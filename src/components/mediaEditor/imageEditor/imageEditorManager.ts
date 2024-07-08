import {ImageState} from '../types';
import {DEFAULT_IMAGE_STATE} from '../consts';

export class WebglRenderer {
  private imgSource: Uint8Array;

  constructor() {}

  init(canvas: HTMLCanvasElement, imgSource: Uint8Array) {}

  destroy() {}

  render(imageState: ImageState) {}

  getImageSnapshot(): Uint8Array {
    return this.imgSource;
  }
}

export class ImageEditorManager {
  private imageStates: ImageState[] = [];
  private currentStateIndex: number = 0;
  private renderer: WebglRenderer = new WebglRenderer();

  constructor() {}

  init(canvas: HTMLCanvasElement, imgSource: Uint8Array, initialImageState: ImageState = DEFAULT_IMAGE_STATE) {
    this.renderer.init(canvas, imgSource);
    this.imageStates.push(initialImageState);
  }

  destroy() {}

  // ------------------ GENERAL API ------------------
  getCurrentImageSource(): Uint8Array {
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
  // ------------------ END: GENERAL API -------------

  // ------------------ FILTER API ------------------
  enhance(enhance: number): ImageState {
    const newImageState = this.createNewImageState({enhance});

    this.renderer.render(newImageState);

    return newImageState;
  }

  brightness(brightness: number): ImageState {
    const newImageState = this.createNewImageState({brightness});

    this.renderer.render(newImageState);

    return newImageState;
  }

  contrast(contrast: number): ImageState {
    const newImageState = this.createNewImageState({contrast});

    this.renderer.render(newImageState);

    return newImageState;
  }

  saturation(saturation: number): ImageState {
    const newImageState = this.createNewImageState({saturation});

    this.renderer.render(newImageState);

    return newImageState;
  }

  warmth(warmth: number): ImageState {
    const newImageState = this.createNewImageState({warmth});

    this.renderer.render(newImageState);

    return newImageState;
  }

  fade(fade: number): ImageState {
    const newImageState = this.createNewImageState({fade});

    this.renderer.render(newImageState);

    return newImageState;
  }

  highlights(highlights: number): ImageState {
    const newImageState = this.createNewImageState({highlights});

    this.renderer.render(newImageState);

    return newImageState;
  }

  vignette(vignette: number): ImageState {
    const newImageState = this.createNewImageState({vignette});

    this.renderer.render(newImageState);

    return newImageState;
  }

  shadows(shadows: number): ImageState {
    const newImageState = this.createNewImageState({shadows});

    this.renderer.render(newImageState);

    return newImageState;
  }

  grain(grain: number): ImageState {
    const newImageState = this.createNewImageState({grain});

    this.renderer.render(newImageState);

    return newImageState;
  }

  sharpen(sharpen: number): ImageState {
    const newImageState = this.createNewImageState({sharpen});

    this.renderer.render(newImageState);

    return newImageState;
  }
  // ------------------ END: FILTER API ------------------

  rotate(angle: number): ImageState {
    return this.createNewImageState({});
  }

  crop(): ImageState {
    return this.createNewImageState({});
  }

  // -----------------------------------------------------
  private getCurrentImageState(): ImageState {
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
