import {ImageState} from '../../types';
import {DrawObject, DrawObjectAttribute, DrawObjectAttributeType} from './drawObject';
import {Uint8ClampedArrayBufferTextureSource, toUint8ClampedTextureSource} from '../helpers/webglTexture';

export interface ImageDrawObject extends DrawObject {
  numElements: number;
  texture: Uint8ClampedArrayBufferTextureSource;
  vertecies: DrawObjectAttribute<DrawObjectAttributeType.FLOAT, 2, Float32Array>;
  textcoords: DrawObjectAttribute<DrawObjectAttributeType.FLOAT, 2, Float32Array>;
}

export function imageState2ImageDrawObject(imageState: ImageState): ImageDrawObject {
  return {
    name: 'image',
    zIndex: 1,
    numElements: 6,
    vertecies: {
      type: DrawObjectAttributeType.FLOAT,
      size: 2,
      // basic traingle squad
      buffer: new Float32Array([0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0])
    },
    textcoords: {
      type: DrawObjectAttributeType.FLOAT,
      size: 2,
      // basic traingle squad
      buffer: new Float32Array([0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0])
    },
    texture: toUint8ClampedTextureSource(imageState.source, imageState.width, imageState.height)
  };
}
