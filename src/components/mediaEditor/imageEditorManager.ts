import {ImageAspectRatio, ImageState, ImageFilterState} from './types';
import {DEFAULT_IMAGE_STATE} from './consts';
import {ImageRenderer} from './imageRenderer';
import {WebglImageRenderer} from './webgl/webglImageRenderer';

export class ImageEditorManager {
  private imageStates: ImageState[] = [];
  private currentStateIndex: number = 0;
  private renderer: ImageRenderer = new WebglImageRenderer();
  private ready: boolean = false;

  constructor() {}

  async init(canvas: HTMLCanvasElement, initialImageState: ImageState = DEFAULT_IMAGE_STATE) {
    await this.renderer.init(canvas);
    this.imageStates.push(initialImageState);
    this.ready = true;
    this.renderer.render(initialImageState);
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

    if(this.ready) {
      this.renderer.render(state);
    }

    return state;
  }

  filter(filter: ImageFilterState) {
    const newImageState = this.createNewImageState({filter});

    if(this.ready) {
      this.renderer.render(newImageState);
    }

    return newImageState;
  }

  aspectRatio(aspectRatio: number | ImageAspectRatio): ImageState {
    const newImageState = this.createNewImageState({aspectRatio});

    if(this.ready) {
      this.renderer.render(newImageState);
    }

    return newImageState;
  }

  rotate(rotateAngle: number): ImageState {
    const newImageState = this.createNewImageState({rotateAngle});

    if(this.ready) {
      this.renderer.render(newImageState);
    }

    return newImageState;
  }

  crop(): ImageState {
    return this.createNewImageState({});
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
}
