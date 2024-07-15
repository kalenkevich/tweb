import {ImageState} from '../../types';
import {DrawObject, DrawObjectAttribute, DrawObjectAttributeType} from './drawObject';
import {TextureSource} from '../helpers/webglTexture';

export interface ImageDrawObject extends DrawObject {
  numElements: number;
  texture: TextureSource;
  vertecies: DrawObjectAttribute<DrawObjectAttributeType.FLOAT, 2, Float32Array>;
  textcoords: DrawObjectAttribute<DrawObjectAttributeType.FLOAT, 2, Float32Array>;
}

export function imageState2ImageDrawObject(imageState: ImageState, canvas: HTMLCanvasElement): ImageDrawObject {
  return {
    name: 'image',
    zIndex: 1,
    numElements: 6,
    vertecies: {
      type: DrawObjectAttributeType.FLOAT,
      size: 2,
      buffer: new Float32Array([
        0, 0,
        canvas.width, 0,
        0, canvas.height,
        0, canvas.height,
        canvas.width, 0,
        canvas.width, canvas.height
      ])
    },
    textcoords: {
      type: DrawObjectAttributeType.FLOAT,
      size: 2,
      // basic quad
      buffer: new Float32Array([0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0])
    },
    texture: imageState.texture
  };
}

// const canvasDisplayWidth = Math.round(canvas.clientWidth * devicePixelRatio);
// const canvasDisplayHeight = Math.round(canvas.clientHeight * devicePixelRatio);
// let imageDisplayWidth = canvasDisplayWidth;
// let imageDisplayHeight = height * imageDisplayWidth / width;

// // Now let's check if it fit? If not let's use the height
// if(imageDisplayHeight > canvasDisplayHeight) {
//   imageDisplayHeight = canvasDisplayHeight;
//   imageDisplayWidth = width * imageDisplayHeight / height;
// }

// // Now we need to convert `imageDisplayWidth` and `imageDisplayHeight` to the size of pixels
// // in the canvas. Note: If the canvas is being displayed the same size
// // as the its resolution you can skip this step
// const canvasPixelsAcrossPerDisplayPixel = canvas.width / canvasDisplayWidth;
// const canvasPixelsDownPerDisplayPixel = canvas.height / canvasDisplayHeight;
// const imageDrawWidth = imageDisplayWidth * canvasPixelsAcrossPerDisplayPixel;
// const imageDrawHeight = imageDisplayHeight * canvasPixelsDownPerDisplayPixel;

// const rectCenterX = imageDrawWidth / 2;
// const rectCenterY = imageDrawHeight / 2;
// const canvasCenterX = canvas.width / 2;
// const canvasCenterY = canvas.height / 2;
// const x1 = canvasCenterX - rectCenterX;
// const y1 = canvasCenterY - rectCenterY;
// const x2 = canvasCenterX + rectCenterX;
// const y2 = canvasCenterY - rectCenterY;
// const x3 = canvasCenterX - rectCenterX;
// const y3 = canvasCenterY + rectCenterY;
// const x4 = canvasCenterX + rectCenterX;
// const y4 = canvasCenterY + rectCenterY;

// return [
//   x1, y1,
//   x2, y2,
//   x3, y3,
//   x3, y3,
//   x2, y2,
//   x4, y4
// ];
