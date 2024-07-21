import {ImageState, ImageFilterState, ObjectLayerType, BrushTouch, ObjectLayer} from './types';
import {DEFAULT_IMAGE_STATE, DRAGGABLE_OBJECT_TOP_BOTTOM_PADDING, DRAGGABLE_OBJECT_TOP_LEFT_RIGHT} from './consts';
import {ImageRenderer, RenderOptions, DEFAULT_RENDER_OPTIONS} from './imageRenderer';
import {WebglImageRenderer} from './webgl/webglImageRenderer';
import {RenderQueue} from './helpers/renderQueue';
import {easyAnimation} from './helpers/animation';
import {renderTextLayer, renderTextLayerMultiline} from './helpers/textHelper';
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
          const halfWidth = (texture.width) / 2;
          const halfHeight = (texture.height) / 2;
          const scaleX = state.originalWidth / this.canvas.width;
          const scaleY = state.originalHeight / this.canvas.height;

          return {
            ...layer,
            width: texture.width,
            height: texture.height,
            translation: [
              (layer.translation[0] + (window.devicePixelRatio === 2 ? DRAGGABLE_OBJECT_TOP_LEFT_RIGHT : 0)) * scaleX,
              (layer.translation[1] + (window.devicePixelRatio === 2 ? DRAGGABLE_OBJECT_TOP_BOTTOM_PADDING : 0)) * scaleY
            ] as [number, number],
            origin:[
              (-halfWidth * scaleX) / window.devicePixelRatio,
              (-halfHeight * scaleY) / window.devicePixelRatio
            ] as [number, number],
            scale: [scaleX, scaleY] as [number, number]
          };
        }));
      } else if(layer.type === ObjectLayerType.sticker) {
        promises.push(
          rootScope.managers.appDocsManager.getDoc(layer.stickerId).then(async(doc) => {
            const el = document.createElement('div');
            await new Promise<void>((resolve) => {
              this.stickerRenderer.renderSticker(doc, el, undefined, undefined, layer.width * window.devicePixelRatio, layer.height * window.devicePixelRatio, () => {
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
            const halfWidth = (texture.width) / 2;
            const halfHeight = (texture.height) / 2;
            const scaleX = state.originalWidth / this.canvas.width;
            const scaleY = state.originalHeight / this.canvas.height;

            return {
              ...layer,
              width: texture.width,
              height: texture.height,
              translation: [
                (layer.translation[0] + (window.devicePixelRatio === 2 ? DRAGGABLE_OBJECT_TOP_LEFT_RIGHT : 0)) * scaleX,
                (layer.translation[1] + (window.devicePixelRatio === 2 ? DRAGGABLE_OBJECT_TOP_BOTTOM_PADDING : 0)) * scaleY
              ] as [number, number],
              origin:[
                -halfWidth,
                -halfHeight
              ] as [number, number],
              scale: [scaleX, scaleY] as [number, number]
            };
          })
        );
      }
    }
    const preparedLayers: ObjectLayer[] = await Promise.all(promises);
    preparedLayers.sort((l1, l2) => l1.zIndex - l2.zIndex);

    return this.compiler.compileImage({...state, layers: preparedLayers}, renderOptions);
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
