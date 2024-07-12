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
  private renderer: ImageRenderer = new WebglImageRenderer();
  private ready: boolean = false;

  constructor() {}

  async init(canvas: HTMLCanvasElement, initialImageState: ImageState = DEFAULT_IMAGE_STATE) {
    await this.renderer.init(canvas);
    this.imageStates.push(initialImageState);
    this.ready = true;
    this.rerender();
  }

  resizeCanvas(width: number, height: number) {
    this.renderer.resize(width, height);
    this.rerender();
  }

  destroy() {}

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

      return this.createNewImageState({rotateAngle});
    }

    const newImageState = this.createNewImageState({rotateAngle});
    this.rerender();

    return newImageState;
  }

  crop(): ImageState {
    return this.createNewImageState({});
  }

  flipHorisontaly(): ImageState {
    const newImageState = this.createNewImageState({scale: [-1, 1]});

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
