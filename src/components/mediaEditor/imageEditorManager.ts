import {ImageState, ImageFilterState, ObjectLayerType, BrushTouch, ObjectLayer} from './types';
import {DEFAULT_IMAGE_STATE, WAIT_TILL_USER_FINISH_CHANGES_TO_COMMIT_STATE} from './consts';
import {ImageRenderer, RenderOptions, DEFAULT_RENDER_OPTIONS} from './imageRenderer';
import {WebglImageRenderer} from './webgl/webglImageRenderer';
import {RenderQueue} from './helpers/renderQueue';
import {easyAnimation} from './helpers/animation';
import {renderTextLayerMultiline} from './helpers/textHelper';
import {createImageElementTextureSource} from './webgl/helpers/webglTexture';
import rootScope from '../../lib/rootScope';
import SuperStickerRenderer from '../emoticonsDropdown/tabs/SuperStickerRenderer';
import {resetTextureIndex} from './webgl/helpers/webglTexture';

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
    private readonly stickerRenderer: SuperStickerRenderer,
    initialImageState: ImageState = DEFAULT_IMAGE_STATE,
    private readonly stateSnapshowCounts = 50
  ) {
    this.shadowCanvas = document.createElement('canvas');
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
    const promises = [];
    for(const layer of state.layers) {
      if(layer.type === ObjectLayerType.text && !!layer.text) {
        promises.push(renderTextLayerMultiline(layer.text, layer).then(texture => {
          layer.texture = texture;
          const scaleX = state.resultWidth / this.canvas.width;
          const scaleY = state.resultHeight / this.canvas.height;

          return {
            ...layer,
            width: texture.width,
            height: texture.height,
            translation: [
              layer.translation[0] * scaleX,
              layer.translation[1] * scaleY
            ] as [number, number],
            origin:[
              layer.origin[0],
              layer.origin[1]
            ] as [number, number],
            scale: [scaleX, scaleY] as [number, number]
          };
        }));
      } else if(layer.type === ObjectLayerType.sticker) {
        promises.push(
          rootScope.managers.appDocsManager.getDoc(layer.stickerId).then(async(doc) => {
            const el = document.createElement('div');
            await new Promise<void>((resolve) => {
              this.stickerRenderer.renderSticker(doc, el, undefined, undefined, 512, 512, () => {
                const img = el.children[0] as HTMLImageElement;
                if(img.complete) {
                  resolve();
                } else {
                  img.addEventListener('load', () => resolve());
                }
              });
            })
            const img = el.children[0] as HTMLImageElement;
            img.width = layer.width * window.devicePixelRatio;
            img.height = layer.height * window.devicePixelRatio;
            const texture = createImageElementTextureSource(el.children[0] as HTMLImageElement);
            layer.texture = texture;
            const scaleX = state.resultWidth / this.canvas.width;
            const scaleY = state.resultHeight / this.canvas.height;

            return {
              ...layer,
              width: texture.width,
              height: texture.height,
              translation: [
                layer.translation[0] * scaleX,
                layer.translation[1] * scaleY
              ] as [number, number],
              origin:[
                layer.origin[0],
                layer.origin[1]
              ] as [number, number],
              scale: [scaleX, scaleY] as [number, number]
            };
          })
        );
      }
    }
    const preparedLayers: ObjectLayer[] = await Promise.all(promises);
    preparedLayers.sort((l1, l2) => l1.zIndex - l2.zIndex);

    const scaleX = state.resultWidth / this.canvas.width;
    const scaleY = state.resultHeight / this.canvas.height;
    const preparedDrawLayer = {
      ...state.drawLayer,
      touches: state.drawLayer.touches.map(t => {
        return {
          ...t,
          x: t.x * scaleX,
          y: t.y * scaleY,
          size: t.size * scaleX
        }
      })
    };

    return this.compiler.compileImage({
      ...state,
      drawLayer: preparedDrawLayer,
      layers: preparedLayers
    }, renderOptions);
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
