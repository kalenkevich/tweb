import {ObjectLayer, ObjectLayerType, ImageState} from '../../types';
import {DrawObject, DrawObjectAttribute, DrawObjectAttributeType} from './drawObject';
import {TextureSource} from '../helpers/webglTexture';

export interface ImageDrawObject extends DrawObject {
  numElements: number;
  texture: TextureSource;
  vertecies: DrawObjectAttribute<DrawObjectAttributeType.FLOAT, 2, Float32Array>;
  textcoords: DrawObjectAttribute<DrawObjectAttributeType.FLOAT, 2, Float32Array>;
}

const FULL_QUAD = [0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0];

export function toImageDrawObject(state: ImageState | ObjectLayer, canvas: HTMLCanvasElement): ImageDrawObject {
  let width = 0;
  let height = 0;
  let textcoords: number[] = FULL_QUAD;

  // Important to render image with the same a canvas size to fit right.
  if((state as ImageState).type === ObjectLayerType.backgroundImage) {
    const x = (state as ImageState).resultX;
    const y = (state as ImageState).resultY;
    const imageWidth = (state as ImageState).resultWidth;
    const imageHeight = (state as ImageState).resultHeight;
    const originalWidth = (state as ImageState).originalWidth;
    const originalHeight = (state as ImageState).originalHeight;

    width = canvas.width;
    height = canvas.height;
    textcoords = [
      x / originalWidth, y / originalHeight,
      (x + imageWidth) / originalWidth, y / originalHeight,
      x / originalWidth, (y + imageHeight) / originalHeight,
      x / originalWidth, (y + imageHeight) / originalHeight,
      (x + imageWidth) / originalWidth, y / originalHeight,
      (x + imageWidth) / originalWidth, (y + imageHeight) / originalHeight
    ];
  }

  // Handle text width and height
  if((state as ObjectLayer).type === ObjectLayerType.text) {
    width = (state as ObjectLayer).width;
    height = (state as ObjectLayer).height;
  }

  // Handle sticker width and height
  if((state as ObjectLayer).type === ObjectLayerType.sticker) {
    width = (state as ObjectLayer).width;
    height = (state as ObjectLayer).height;
  }

  return {
    name: 'image',
    zIndex: 1,
    numElements: 6,
    vertecies: {
      type: DrawObjectAttributeType.FLOAT,
      size: 2,
      buffer: new Float32Array([
        0, 0,
        width, 0,
        0, height,
        0, height,
        width, 0,
        width, height
      ])
    },
    textcoords: {
      type: DrawObjectAttributeType.FLOAT,
      size: 2,
      buffer: new Float32Array(textcoords)
    },
    texture: state.texture
  };
}
