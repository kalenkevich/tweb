import {ImageState, ImageFilterState, ObjectLayerType, BrushTouch, ObjectLayer, TextLayer, StickerLayer} from './types';
import {DEFAULT_IMAGE_STATE, WAIT_TILL_USER_FINISH_CHANGES_TO_COMMIT_STATE} from './consts';
import {ImageRenderer, RenderOptions, DEFAULT_RENDER_OPTIONS} from './imageRenderer';
import {WebglImageRenderer} from './webgl/webglImageRenderer';
import {RenderQueue} from './helpers/renderQueue';
import {easyAnimation} from './helpers/animation';
import {resetTextureIndex, createUint8TextureSource} from './webgl/helpers/webglTexture';
import {precompileTextObjects, precompileStickerObjects, adjustDrawLayer, renderAnimatedStickerFrame} from './helpers/imageCompileHelper';
import {GIFEncoder, quantize, applyPalette} from './gif/index';
import {saveBlobAsFile} from './helpers/fileHelder';

export class ImageEditorManager {
  private canvas?: HTMLCanvasElement;
  private shadowCanvas?: HTMLCanvasElement;
  private renderQueue: RenderQueue = new RenderQueue();
  private imageStates: {
    id: number;
    state: ImageState,
    commited: boolean;
    timestamp: number;
  }[] = [];
  private currentStateIndex: number = 0;
  // Could be WebGPU renrerer implementation some day.
  private renderer: ImageRenderer = new WebglImageRenderer();
  private compiler: ImageRenderer = new WebglImageRenderer();
  private ready: boolean = false;
  private commitStateTimeoutRef: number;
  private imageStateId = 0;

  constructor(
    initialImageState: ImageState = DEFAULT_IMAGE_STATE,
    private readonly stateSnapshowCounts = 50
  ) {
    this.shadowCanvas = document.createElement('canvas');
    this.shadowCanvas.setAttribute('willReadFrequently', 'true');
    this.imageStates.push({
      id: this.getNextImageStateId(),
      state: initialImageState,
      timestamp: Date.now(),
      commited: true
    });
  }

  init(canvas: HTMLCanvasElement) {
    const state = this.getCurrentImageState();
    this.canvas = canvas;
    this.renderer.init(canvas);
    this.compiler.init(this.shadowCanvas, {compileMode: true});
    this.compiler.resize(state.originalWidth, state.originalHeight);

    this.ready = true;
  }

  triggerRerender(rerenderOptions?: RenderOptions) {
    this.rerender(this.getCurrentImageState(), rerenderOptions);
  }

  resizeCanvas(width: number, height: number, rerenderOptions?: RenderOptions) {
    this.renderer.resize(width, height);
    this.rerender(this.getCurrentImageState(), rerenderOptions);
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  destroy() {
    this.renderer.destroy();
    this.compiler.destroy();
    resetTextureIndex();
  }

  async compileImage(renderOptions: RenderOptions): Promise<Blob> {
    const state = this.getCurrentImageState();
    const textObjectsRaw = state.layers.filter(l => l.type === ObjectLayerType.text && !!l.text) as TextLayer[];
    const stickerObjectsRaw = state.layers.filter(l => l.type === ObjectLayerType.sticker) as StickerLayer[];
    const [
      preparedTextObjects,
      stickerObjects
    ] = await Promise.all([
      precompileTextObjects(this.canvas.width, this.canvas.height, state, textObjectsRaw),
      precompileStickerObjects(this.canvas.width, this.canvas.height, state, stickerObjectsRaw)
    ]);
    const preparedDrawLayer = adjustDrawLayer(this.canvas.width, this.canvas.height, state, state.drawLayer);
    const preparedStaticStickersObjects = stickerObjects.staticStickers.map(s => s.object);

    if(stickerObjects.animatedStickers.length > 0) {
      const totalFrames = Math.max(...stickerObjects.animatedStickers.map(s => s.totalFrames));
      const layers = [
        ...preparedTextObjects,
        ...preparedStaticStickersObjects
      ].sort((l1, l2) => l1.zIndex - l2.zIndex);

      // render static background first
      this.compiler.render({
        ...state,
        drawLayer: preparedDrawLayer,
        layers: layers
      }, renderOptions);
      const staticObjectsBackground = createUint8TextureSource(
        this.compiler.getRenderedData(),
        this.shadowCanvas.width,
        this.shadowCanvas.height
      );

      const gif = GIFEncoder();

      for(let frameIndex = 0; frameIndex < totalFrames; frameIndex += 4) {
        const preparedAnimatedSticker = await Promise.all(
          stickerObjects.animatedStickers.map(async(stickerInfo) => {
            stickerInfo.object.texture = await renderAnimatedStickerFrame(stickerInfo, frameIndex);

            return stickerInfo;
          })
        );
        const isFirstFrame = frameIndex === 0;

        // render current frame
        this.compiler.renderTexture(staticObjectsBackground, 0, 0, {clearCanvas: true});
        this.compiler.render({
          ...state,
          drawLayer: preparedDrawLayer,
          layers: preparedAnimatedSticker.map(s => s.object)
        }, {
          ...renderOptions,
          clearCanvas: false,
          layers: [ObjectLayerType.sticker]
        });

        // get textures of sticker frame with background
        const stickerTexturesWithBackground = preparedAnimatedSticker.map(s => {
          const x = s.object.translation[0] + s.object.origin[0];
          const y = s.object.translation[1] + s.object.origin[1];
          const data = this.compiler.getRenderedData(x, y, s.object.width, s.object.height);

          return {
            x: x,
            y: y,
            texture: createUint8TextureSource(
              data,
              s.object.width,
              s.object.height
            )
          }
        });
        if(!isFirstFrame) {
          this.compiler.clear();
        }
        for(const textureObj of stickerTexturesWithBackground) {
          this.compiler.renderTexture(textureObj.texture, textureObj.x, textureObj.y);
        }

        const data = this.compiler.getRenderedData(0, 0, this.shadowCanvas.width, this.shadowCanvas.height, true);
        const palette = quantize(data, 256);
        const index = applyPalette(data, palette);
        gif.writeFrame(index, 0, 0, this.shadowCanvas.width, this.shadowCanvas.height, {
          first: isFirstFrame,
          palette,
          repeat: 0,
          transparent: !isFirstFrame,
          dispose: isFirstFrame ? 1 : 3
        });
      }

      gif.finish();
      return new Blob([gif.bytes()], {type: 'image/gif'});
    } else {
      const layers = [
        ...preparedTextObjects,
        ...preparedStaticStickersObjects
      ].sort((l1, l2) => l1.zIndex - l2.zIndex);

      this.compiler.render({
        ...state,
        drawLayer: preparedDrawLayer,
        layers
      }, renderOptions);

      return new Promise<Blob>(resolve => {
        this.shadowCanvas.toBlob(blobResult => resolve(blobResult));
      });
    }
  }

  canUndo(): boolean {
    for(let i = this.currentStateIndex - 1; i >= 0; i--) {
      if(this.imageStates[i].commited) {
        return true;
      }
    }

    return false;
    // return this.currentStateIndex > 0;
  }

  undo(rerenderOptions?: RenderOptions): ImageState {
    if(!this.canUndo()) {
      return;
    }

    this.currentStateIndex--;
    if(this.currentStateIndex > 0) {
      this.goToLastCommitedState();
    }

    this.rerender(this.getCurrentImageState(), {
      ...rerenderOptions,
      clearBrushProgramFramebuffer: true
    });

    return this.getCurrentImageState();
  }

  canRedo(): boolean {
    for(let i = this.currentStateIndex + 1; i < this.imageStates.length; i++) {
      if(this.imageStates[i].commited) {
        return true;
      }
    }

    return false;
    // return this.currentStateIndex > 0 && this.currentStateIndex < this.imageStates.length - 1;
  }

  redo(rerenderOptions?: RenderOptions): ImageState {
    if(!this.canRedo()) {
      return;
    }

    this.currentStateIndex++;
    if(this.currentStateIndex < this.imageStates.length) {
      this.goToNextCommitedState();
    }

    this.rerender(this.getCurrentImageState(), {
      ...rerenderOptions,
      clearBrushProgramFramebuffer: true
    });

    return this.getCurrentImageState();
  }

  pushState(state: ImageState, rerenderOptions?: RenderOptions): ImageState {
    this.createNewImageState(state);

    this.rerender(this.getCurrentImageState(), rerenderOptions);

    return state;
  }

  filter(filter: ImageFilterState, rerenderOptions?: RenderOptions) {
    const newImageState = this.createNewImageState({filter});

    this.rerender(this.getCurrentImageState(), rerenderOptions);

    return newImageState;
  }

  origin(originX: number, originY: number, animation: boolean = false, rerenderOptions?: RenderOptions) {
    const state = this.getCurrentImageState();
    const newImageState = this.createNewImageState({
      origin: [originX, originY]
    });

    if(animation) {
      const fromOriginX = state.origin[0];
      const fromOriginY = state.origin[1];

      easyAnimation((progress) => {
        this.renderer.render({
          ...state,
          translation: [
            state.translation[0] + (originX - fromOriginX) * progress,
            state.translation[1] + (originY - fromOriginY) * progress
          ]
        }, rerenderOptions);
      });
    } else {
      this.rerender(this.getCurrentImageState(), rerenderOptions);
    }

    return newImageState;
  }

  rotate(rotation: number, animation: boolean = false, rerenderOptions?: RenderOptions): ImageState {
    const state = this.getCurrentImageState();
    const newImageState = this.createNewImageState({rotation});

    if(animation) {
      const from = state.rotation;
      const to = rotation;

      easyAnimation((progress) => {
        this.renderer.render({
          ...state,
          rotation: from + (to - from) * progress
        }, rerenderOptions);
      });
    } else {
      this.rerender(this.getCurrentImageState(), rerenderOptions);
    }

    return newImageState;
  }

  moveTo(translationX: number, translationY: number, animation: boolean = false, rerenderOptions?: RenderOptions) {
    const state = this.getCurrentImageState();
    const newImageState = this.createNewImageState({
      translation: [translationX, translationY]
    });

    if(animation) {
      const fromTranslationX = state.translation[0];
      const fromTranslationY = state.translation[1];

      easyAnimation((progress) => {
        this.renderer.render({
          ...state,
          translation: [
            state.translation[0] + (translationX - fromTranslationX) * progress,
            state.translation[1] + (translationY - fromTranslationY) * progress
          ]
        }, rerenderOptions);
      });
    } else {
      this.rerender(this.getCurrentImageState(), rerenderOptions);
    }

    return newImageState;
  }

  resize(scaleX: number, scaleY: number, animation: boolean = false, rerenderOptions?: RenderOptions) {
    const state = this.getCurrentImageState();
    const newImageState = this.createNewImageState({
      scale: [scaleX, scaleY]
    });

    if(animation) {
      const fromScaleX = state.scale[0];
      const fromScaleY = state.scale[1];

      easyAnimation((progress) => {
        this.renderer.render({
          ...state,
          scale: [
            fromScaleX + (scaleX - fromScaleX) * progress,
            fromScaleY + (scaleY - fromScaleY) * progress
          ]
        }, rerenderOptions);
      });
    } else {
      this.rerender(this.getCurrentImageState(), rerenderOptions);
    }

    return newImageState;
  }

  crop(x: number, y: number, width: number, height: number, animation: boolean = false, rerenderOptions?: RenderOptions): ImageState {
    const state = this.createNewImageState({
      resultX: x,
      resultY: y,
      resultWidth: width,
      resultHeight: height
    });

    this.rerender(state, rerenderOptions);
    this.compiler.resize(width, height);

    return state;
  }

  brushTouch(brushTouch: BrushTouch, rerenderOptions?: RenderOptions): ImageState {
    const state = this.getCurrentImageState();
    const newState: ImageState = this.createNewImageState({
      ...state,
      drawLayer: {
        ...state.drawLayer,
        touches: [...state.drawLayer.touches, brushTouch]
      }
    });

    this.renderer.renderBrushTouch(newState, brushTouch, rerenderOptions);

    return newState;
  }

  getCurrentImageState(): ImageState {
    return this.imageStates[this.currentStateIndex].state;
  }

  private createNewImageState(state: Partial<ImageState>): ImageState {
    const currentState = this.imageStates[this.currentStateIndex].state;
    const newImageState = {
      ...currentState,
      ...state
    };

    this.currentStateIndex++;
    if(this.currentStateIndex < this.imageStates.length) {
      this.imageStates[this.currentStateIndex] = {
        id: this.getNextImageStateId(),
        state: newImageState,
        commited: false,
        timestamp: Date.now()
      };
    } else {
      this.imageStates.push({
        id: this.getNextImageStateId(),
        state: newImageState,
        commited: false,
        timestamp: Date.now()
      });
    }

    if(this.imageStates.length > this.stateSnapshowCounts) {
      this.imageStates.unshift();
    }

    const stateId = this.imageStates[this.currentStateIndex].id;
    if(this.commitStateTimeoutRef !== undefined) {
      clearTimeout(this.commitStateTimeoutRef);
    }
    this.commitStateTimeoutRef = setTimeout(() => {
      this.commitState(stateId);
      this.pruneUncommitedStates();
      this.goToState(stateId);
      this.commitStateTimeoutRef = undefined;
    }, WAIT_TILL_USER_FINISH_CHANGES_TO_COMMIT_STATE) as unknown as number;

    return newImageState;
  }

  private goToLastCommitedState() {
    while(!this.imageStates[this.currentStateIndex].commited) {
      this.currentStateIndex--;
    }
  }

  private goToNextCommitedState() {
    while(this.currentStateIndex < this.imageStates.length && !this.imageStates[this.currentStateIndex].commited) {
      this.currentStateIndex++;
    }

    if(this.currentStateIndex === this.imageStates.length) {
      this.currentStateIndex--;
    }
  }

  private commitState(stateId: number) {
    const state = this.imageStates.find(s => s.id === stateId);
    state.commited = true;
  }

  private pruneUncommitedStates() {
    this.imageStates = this.imageStates.filter(s => s.commited);
  }

  private goToState(stateId: number) {
    this.currentStateIndex = this.imageStates.findIndex(s => s.id === stateId);
  }

  private getNextImageStateId(): number {
    return this.imageStateId++;
  }

  private rerender(
    state = this.getCurrentImageState(),
    rerenderOptions: RenderOptions = DEFAULT_RENDER_OPTIONS
  ): Promise<void> {
    if(!this.ready || rerenderOptions.render === false) {
      return;
    }

    return this.renderQueue.runInNextAvailableFrame(() => {
      this.renderer.render(state, rerenderOptions);
    });
  }
}
