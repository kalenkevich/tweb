import {ImageState, ImageFilterState, TextLayer, ObjectLayerType, BrushTouch} from './types';
import {DEFAULT_IMAGE_STATE} from './consts';
import {ImageRenderer, RenderOptions, DEFAULT_RENDER_OPTIONS} from './imageRenderer';
import {WebglImageRenderer} from './webgl/webglImageRenderer';
import {RenderQueue} from './helpers/renderQueue';
import {easyAnimation} from './helpers/animation';
import {renderTextLayer} from './helpers/textHelper';
import {createImageElementTextureSource} from './webgl/helpers/webglTexture';
import rootScope from '../../lib/rootScope';
import SuperStickerRenderer from '../emoticonsDropdown/tabs/SuperStickerRenderer';
import {resetTextureIndex} from './webgl/helpers/webglTexture';

export class ImageEditorManager {
  private canvas?: HTMLCanvasElement;
  private shadowCanvas?: HTMLCanvasElement;
  private renderQueue: RenderQueue = new RenderQueue();
  private imageStates: ImageState[] = [];
  private currentStateIndex: number = 0;
  // Could be WebGPU renrerer implementation some day.
  private renderer: ImageRenderer = new WebglImageRenderer();
  private compiler: ImageRenderer = new WebglImageRenderer();
  private ready: boolean = false;

  constructor(
    private readonly stickerRenderer: SuperStickerRenderer,
    initialImageState: ImageState = DEFAULT_IMAGE_STATE,
    private readonly stateSnapshowCounts = 10
  ) {
    this.shadowCanvas = document.createElement('canvas');
    this.imageStates.push(initialImageState);
  }

  init(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.shadowCanvas.width = canvas.width;
    this.shadowCanvas.height = canvas.height;
    this.renderer.init(canvas);
    this.compiler.init(this.shadowCanvas, {compileMode: true});

    this.ready = true;
  }

  triggerRerender(rerenderOptions?: RenderOptions) {
    this.rerender(this.getCurrentImageState(), rerenderOptions);
  }

  resizeCanvas(width: number, height: number, rerenderOptions?: RenderOptions) {
    this.renderer.resize(width, height);
    this.compiler.resize(width, height);
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

  async compileImage(renderOptions: RenderOptions): Promise<Uint8Array> {
    const state = this.getCurrentImageState();
    const promises = [];
    for(const layer of state.layers) {
      if(layer.type === ObjectLayerType.text && !!layer.text) {
        promises.push(renderTextLayer(layer.text, layer).then(texture => {
          layer.texture = texture;
          layer.width = layer.texture.width;
          layer.height = layer.texture.height;
          layer.origin = [-(texture.width / 2) / window.devicePixelRatio, -(texture.height / 2) / window.devicePixelRatio];
        }));
      } else if(layer.type === ObjectLayerType.sticker) {
        promises.push(
          rootScope.managers.appDocsManager.getDoc(layer.stickerId).then(async(doc) => {
            const el = document.createElement('div');
            await new Promise<void>((resolve) => {
              this.stickerRenderer.renderSticker(doc, el, [], undefined, () => {
                resolve();
              });
            })
            const texture = createImageElementTextureSource(el.children[0] as HTMLImageElement);
            layer.texture = texture;
            layer.origin = [-(layer.width / 2) / window.devicePixelRatio, -(layer.height / 2) / window.devicePixelRatio];
          })
        );
      }
    }
    await Promise.all(promises);

    return this.compiler.compileImage(state, renderOptions);
  }

  canUndo(): boolean {
    return this.currentStateIndex > 0;
  }

  undo(rerenderOptions?: RenderOptions): ImageState {
    if(this.canUndo()) {
      this.currentStateIndex--;
    }

    this.rerender(this.getCurrentImageState(), rerenderOptions);

    return this.getCurrentImageState();
  }

  canRedo(): boolean {
    return this.currentStateIndex > 0 && this.currentStateIndex < this.imageStates.length - 1;
  }

  redo(rerenderOptions?: RenderOptions): ImageState {
    if(this.canRedo()) {
      this.currentStateIndex++;
    }

    this.rerender(this.getCurrentImageState(), rerenderOptions);

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

  crop(fromX: number, fromY: number, width: number, height: number, animation: boolean = false, rerenderOptions?: RenderOptions): ImageState {
    return this.createNewImageState({});
  }

  flipHorisontaly(animation: boolean = false, rerenderOptions?: RenderOptions): ImageState {
    const state = this.getCurrentImageState();
    const newImageState = this.createNewImageState({scale: [state.scale[0] * -1, 1]});

    this.rerender(newImageState, rerenderOptions);

    return newImageState;
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
    return this.imageStates[this.currentStateIndex];
  }

  private createNewImageState(state: Partial<ImageState>) {
    const currentState = this.imageStates[this.currentStateIndex];
    const newState = {
      ...currentState,
      ...state
    };

    this.currentStateIndex++;
    if(this.currentStateIndex < this.imageStates.length) {
      this.imageStates[this.currentStateIndex] = newState;
    } else {
      this.imageStates.push(newState);
    }

    if(this.imageStates.length > this.stateSnapshowCounts) {
      this.imageStates.unshift();
    }

    return newState;
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
