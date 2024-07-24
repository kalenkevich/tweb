import {BrushTouch, ImageState, ObjectLayerType} from './types';
import {ArrayBufferTextureSource} from './webgl/helpers/webglTexture';

export interface ImageRendererOptions {
  compileMode?: boolean;
}

export interface RenderOptions {
  clearCanvas?: boolean;
  flipImageByYAxis?: boolean;
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

  renderTexture(texture: ArrayBufferTextureSource, options?: RenderOptions): void;

  getRenderedData(flipY?: boolean): Uint8Array;

  renderBrushTouch(imageState: ImageState, brushTouch: BrushTouch, options?: RenderOptions): void;
}
