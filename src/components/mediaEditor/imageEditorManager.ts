import {ImageState, ImageFilterState, TextLayer} from './types';
import {DEFAULT_IMAGE_STATE} from './consts';
import {ImageRenderer} from './imageRenderer';
import {WebglImageRenderer} from './webgl/webglImageRenderer';
import {RenderQueue} from './helpers/renderQueue';
import {easyAnimation} from './helpers/animation';

export class ImageEditorManager {
  private canvas?: HTMLCanvasElement;
  private renderQueue: RenderQueue = new RenderQueue();
  private imageStates: ImageState[] = [];
  private currentStateIndex: number = 0;
  // Could be WebGPU renrerer implementation some day.
  private renderer: ImageRenderer = new WebglImageRenderer();
  private ready: boolean = false;

  constructor(private readonly stateSnapshowCounts = 10) {}

  init(canvas: HTMLCanvasElement, initialImageState: ImageState = DEFAULT_IMAGE_STATE) {
    this.canvas = canvas;
    this.renderer.init(canvas);
    this.imageStates.push(initialImageState);
    this.ready = true;
  }

  triggerRerender() {
    this.rerender();
  }

  resizeCanvas(width: number, height: number) {
    this.renderer.resize(width, height);
    this.rerender();
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  destroy() {
    this.renderer.destroy();
  }

  getCurrentImageSource(): Promise<Uint8Array> {
    return this.renderer.getImageSnapshot();
  }

  canUndo(): boolean {
    return this.currentStateIndex > 0;
  }

  undo(): ImageState {
    if(this.canUndo()) {
      this.currentStateIndex--;
    }

    return this.getCurrentImageState();
  }

  canRedo(): boolean {
    return this.currentStateIndex > 0 && this.currentStateIndex < this.imageStates.length - 1;
  }

  redo(): ImageState {
    if(this.canRedo()) {
      this.currentStateIndex++;
    }

    return this.getCurrentImageState();
  }

  pushState(state: ImageState, rerender: boolean = false): ImageState {
    this.createNewImageState(state);

    if(rerender) {
      this.rerender();
    }

    return state;
  }

  filter(filter: ImageFilterState) {
    const newImageState = this.createNewImageState({filter});

    this.rerender();

    return newImageState;
  }

  rotate(rotateAngle: number, animation: boolean = false): ImageState {
    const state = this.getCurrentImageState();
    const newImageState = this.createNewImageState({rotateAngle});

    if(animation) {
      const from = state.rotateAngle;
      const to = rotateAngle;

      easyAnimation((progress) => {
        this.renderer.render({
          ...state,
          rotateAngle: from + (to - from) * progress
        });
      });
    } else {
      this.rerender();
    }

    return newImageState;
  }

  moveTo(translationX: number, translationY: number, animation: boolean = false) {
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
        });
      });
    } else {
      this.rerender();
    }

    return newImageState;
  }

  resize(scaleX: number, scaleY: number, animation: boolean = false) {
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
        });
      });
    } else {
      this.rerender();
    }

    return newImageState;
  }

  crop(): ImageState {
    return this.createNewImageState({});
  }

  flipHorisontaly(): ImageState {
    const state = this.getCurrentImageState();
    const newImageState = this.createNewImageState({scale: [state.scale[0] * -1, 1]});

    this.rerender();

    return newImageState;
  }

  addTextLayer(textLayer: TextLayer): ImageState {
    return this.createNewImageState({});
  }

  public getCurrentImageState(): ImageState {
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

  private rerender(state = this.getCurrentImageState()): Promise<void> {
    if(!this.ready) {
      return;
    }

    return this.renderQueue.runInNextAvailableFrame(() => {
      this.renderer.render(state);
    });
  }
}
