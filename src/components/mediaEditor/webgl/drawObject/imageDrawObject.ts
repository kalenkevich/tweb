import {ObjectLayer, ObjectLayerType, ImageState} from '../../types';
import {DrawObject, DrawObjectAttribute, DrawObjectAttributeType} from './drawObject';
import {TextureSource} from '../helpers/webglTexture';

export interface ImageDrawObject extends DrawObject {
  numElements: number;
  texture: TextureSource;
  vertecies: DrawObjectAttribute<DrawObjectAttributeType.FLOAT, 2, Float32Array>;
  textcoords: DrawObjectAttribute<DrawObjectAttributeType.FLOAT, 2, Float32Array>;
}

export function toImageDrawObject(state: ImageState | ObjectLayer, canvas: HTMLCanvasElement): ImageDrawObject {
  let width = 0;
  let height = 0;

  // Important to render image with the same a canvas size to fit right.
  if((state as ImageState).type === ObjectLayerType.backgroundImage) {
    width = canvas.width;
    height = canvas.height;
  }

  // Handle text width and height
  if((state as ObjectLayer).type === ObjectLayerType.text) {
    width = state.width;
    height = state.height;
  }

  // Handle sticker width and height
  if((state as ObjectLayer).type === ObjectLayerType.sticker) {
    width = state.width;
    height = state.height;
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
      // basic quad
      buffer: new Float32Array([0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0])
    },
    texture: state.texture
  };
}
