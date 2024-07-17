import {BrushTouch} from '../../types';
import {anyColorToRgbaColor} from '../../../../helpers/color';
import {DrawObject, DrawObjectAttribute, DrawObjectAttributeType, VERTEX_QUAD_POSITION} from './drawObject';

export interface BrushTouchDrawObject extends DrawObject {
  numElements: number;
  position: DrawObjectAttribute<DrawObjectAttributeType.FLOAT, 3, Float32Array>;
  properties: DrawObjectAttribute<DrawObjectAttributeType.FLOAT, 2, Float32Array>;
  color: DrawObjectAttribute<DrawObjectAttributeType.FLOAT, 4, Float32Array>;
}

export function toBrushTouchDrawObject(touches: BrushTouch[]): BrushTouchDrawObject {
  const ratio = window.devicePixelRatio;
  let numElements = 0;
  const positionBuffer = [];
  const propertiesBuffer = [];
  const colorBuffer = [];

  for(let i = 0; i < touches.length; i++) {
    const touch = touches[i];
    const colorRgba = anyColorToRgbaColor(touch.color).map(v => v / 255);

    positionBuffer.push(
      touch.x * ratio, touch.y * ratio, VERTEX_QUAD_POSITION.TOP_LEFT,
      touch.x * ratio, touch.y * ratio, VERTEX_QUAD_POSITION.TOP_RIGHT,
      touch.x * ratio, touch.y * ratio, VERTEX_QUAD_POSITION.BOTTOM_LEFT,
      touch.x * ratio, touch.y * ratio, VERTEX_QUAD_POSITION.BOTTOM_LEFT,
      touch.x * ratio, touch.y * ratio, VERTEX_QUAD_POSITION.TOP_RIGHT,
      touch.x * ratio, touch.y * ratio, VERTEX_QUAD_POSITION.BOTTOM_RIGHT
    );
    propertiesBuffer.push(
      touch.size * ratio, touch.style,
      touch.size * ratio, touch.style,
      touch.size * ratio, touch.style,
      touch.size * ratio, touch.style,
      touch.size * ratio, touch.style,
      touch.size * ratio, touch.style
    );
    colorBuffer.push(
      ...colorRgba,
      ...colorRgba,
      ...colorRgba,
      ...colorRgba,
      ...colorRgba,
      ...colorRgba
    );
    numElements += 6;
  }

  return {
    name: 'drawLayer',
    zIndex: 1,
    numElements,
    position: {
      type: DrawObjectAttributeType.FLOAT,
      size: 3,
      buffer: new Float32Array(positionBuffer)
    },
    properties: {
      type: DrawObjectAttributeType.FLOAT,
      size: 2,
      buffer: new Float32Array(propertiesBuffer)
    },
    color: {
      type: DrawObjectAttributeType.FLOAT,
      size: 4,
      buffer: new Float32Array(colorBuffer)
    }
  };
}
