import {BrushTouch, ImageState, ObjectLayerType} from './types';

export interface ImageRendererOptions {
  compileMode?: boolean;
}

export interface RenderOptions {
  render?: boolean;
  layers?: ObjectLayerType[] | 'all';
  clearBrushProgramFramebuffer?: boolean;
}

export const DEFAULT_RENDER_OPTIONS: RenderOptions = {
  render: true,
  layers: [
    ObjectLayerType.backgroundImage,
    ObjectLayerType.draw
  ]
}

/**
 * Base interface for ImageRenderer
 */
export interface ImageRenderer {
  init(canvas: HTMLCanvasElement, options?: ImageRendererOptions): void;

  destroy(): void;

  resize(width: number, height: number): void;

  render(imageState: ImageState, options?: RenderOptions): void;

  renderBrushTouch(imageState: ImageState, brushTouch: BrushTouch, options?: RenderOptions): void;

  compileImage(imageState: ImageState, options?: RenderOptions): Promise<Blob>
}
