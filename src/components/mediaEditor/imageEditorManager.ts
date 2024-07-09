import {ImageAspectRatio, ImageState} from './types';
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

  // ------------------ GENERAL API ------------------
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
  // ------------------ END: GENERAL API -------------

  // ------------------ FILTER API ------------------
  enhance(enhance: number): ImageState {
    const newImageState = this.createNewImageState({enhance});

    if(this.ready) {
      this.renderer.render(newImageState);
    }

    return newImageState;
  }

  brightness(brightness: number): ImageState {
    const newImageState = this.createNewImageState({brightness});

    if(this.ready) {
      this.renderer.render(newImageState);
    }

    return newImageState;
  }

  contrast(contrast: number): ImageState {
    const newImageState = this.createNewImageState({contrast});

    if(this.ready) {
      this.renderer.render(newImageState);
    }

    return newImageState;
  }

  saturation(saturation: number): ImageState {
    const newImageState = this.createNewImageState({saturation});

    if(this.ready) {
      this.renderer.render(newImageState);
    }

    return newImageState;
  }

  warmth(warmth: number): ImageState {
    const newImageState = this.createNewImageState({warmth});

    if(this.ready) {
      this.renderer.render(newImageState);
    }

    return newImageState;
  }

  fade(fade: number): ImageState {
    const newImageState = this.createNewImageState({fade});

    if(this.ready) {
      this.renderer.render(newImageState);
    }

    return newImageState;
  }

  highlights(highlights: number): ImageState {
    const newImageState = this.createNewImageState({highlights});

    if(this.ready) {
      this.renderer.render(newImageState);
    }

    return newImageState;
  }

  vignette(vignette: number): ImageState {
    const newImageState = this.createNewImageState({vignette});

    if(this.ready) {
      this.renderer.render(newImageState);
    }

    return newImageState;
  }

  shadows(shadows: number): ImageState {
    const newImageState = this.createNewImageState({shadows});

    if(this.ready) {
      this.renderer.render(newImageState);
    }

    return newImageState;
  }

  grain(grain: number): ImageState {
    const newImageState = this.createNewImageState({grain});

    if(this.ready) {
      this.renderer.render(newImageState);
    }

    return newImageState;
  }

  sharpen(sharpen: number): ImageState {
    const newImageState = this.createNewImageState({sharpen});

    if(this.ready) {
      this.renderer.render(newImageState);
    }

    return newImageState;
  }
  // ------------------ END: FILTER API ------------------

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
