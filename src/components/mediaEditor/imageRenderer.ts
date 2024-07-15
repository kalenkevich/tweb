import {ImageState} from './types';

export interface ImageRendererOptions {
  compileMode?: boolean;
}

export interface RenderOptions {
  renderAllLayers?: boolean;
}

/**
 * Base interface for ImageRenderer
 */
export interface ImageRenderer {
  init(canvas: HTMLCanvasElement, options?: ImageRendererOptions): void;

  destroy(): void;

  resize(width: number, height: number): void;

  render(imageState: ImageState, options?: RenderOptions): void;

  compileImage(imageState: ImageState): Promise<Uint8Array>
}
