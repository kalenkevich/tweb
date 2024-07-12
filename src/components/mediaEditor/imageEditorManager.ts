import {ImageAspectRatio, ImageState, ImageFilterState} from './types';
import {DEFAULT_IMAGE_STATE} from './consts';
import {ImageRenderer} from './imageRenderer';
import {WebglImageRenderer} from './webgl/webglImageRenderer';
import {RenderQueue} from './helpers/renderQueue';
import {easyAnimation} from './helpers/animation';

export class ImageEditorManager {
  private renderQueue: RenderQueue = new RenderQueue();
  private imageStates: ImageState[] = [];
  private currentStateIndex: number = 0;
  // Could be WebGPU renrerer implementation some day.
  private renderer: ImageRenderer = new WebglImageRenderer();
  private ready: boolean = false;

  constructor() {}

  init(canvas: HTMLCanvasElement, initialImageState: ImageState = DEFAULT_IMAGE_STATE) {
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

  pushState(state: ImageState): ImageState {
    this.createNewImageState(state);

    this.rerender();

    return state;
  }

  filter(filter: ImageFilterState) {
    const newImageState = this.createNewImageState({filter});

    this.rerender();

    return newImageState;
  }

  aspectRatio(aspectRatio: number | ImageAspectRatio, animation: boolean = false): ImageState {
    const newImageState = this.createNewImageState({aspectRatio});

    this.rerender();

    return newImageState;
  }

  rotate(rotateAngle: number, animation: boolean = false): ImageState {
    const newImageState = this.createNewImageState({rotateAngle});

    if(animation) {
      const state = this.getCurrentImageState();
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

  move(deltaX: number, deltaY: number, animation: boolean = false) {
    const state = this.getCurrentImageState();
    const newImageState = this.createNewImageState({
      translation: [
        state.translation[0] + deltaX,
        state.translation[1] + deltaY
      ]
    });

    if(animation) {
      easyAnimation((progress) => {
        this.renderer.render({
          ...state,
          translation: [
            state.translation[0] + deltaX * progress,
            state.translation[1] + deltaY * progress
          ]
        });
      });
    } else {
      this.rerender();
    }

    return newImageState;
  }

  scale(scaleX: number, scaleY: number, animation: boolean = false) {
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

  // -----------------------------------------------------
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
