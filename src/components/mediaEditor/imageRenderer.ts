import {ImageState} from './types';

/**
 * Base interface for ImageRenderer
 */
export interface ImageRenderer {
  init(canvas: HTMLCanvasElement): Promise<void>;

  destroy(): void;

  resize(width: number, height: number): void;

  render(imageState: ImageState): void;

  getImageSnapshot(): Promise<Uint8Array>
}
