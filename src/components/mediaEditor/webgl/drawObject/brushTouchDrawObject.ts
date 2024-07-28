import {BrushTouch} from '../../types';
import {anyColorToRgbaColor} from '../../../../helpers/color';
import {DrawObject, DrawObjectAttribute, DrawObjectAttributeType, VERTEX_QUAD_POSITION} from './drawObject';

export interface BrushTouchDrawObject extends DrawObject {
  numElements: number;
  position: DrawObjectAttribute<DrawObjectAttributeType.FLOAT, 3, Float32Array>;
  properties: DrawObjectAttribute<DrawObjectAttributeType.FLOAT, 3, Float32Array>;
  color: DrawObjectAttribute<DrawObjectAttributeType.FLOAT, 4, Float32Array>;
  borderColor: DrawObjectAttribute<DrawObjectAttributeType.FLOAT, 4, Float32Array>;
  backgroundImageTextcoord: DrawObjectAttribute<DrawObjectAttributeType.FLOAT, 2, Float32Array>;
}

export function toBrushTouchDrawObject(touches: BrushTouch[]): BrushTouchDrawObject {
  const ratio = window.devicePixelRatio;
  let numElements = 0;
  const positionBuffer = [];
  const propertiesBuffer = [];
  const colorBuffer = [];
  const borderColorBuffer = [];
  const backgroundImageTextcoordBuffer = [];

  for(let i = 0; i < touches.length; i++) {
    const touch = touches[i];
    const borderColorRgba = anyColorToRgbaColor(touch.borderColor).map(v => v / 255);
    const colorRgba = anyColorToRgbaColor(touch.color).map(v => v / 255);
    const x = touch.x * ratio;
    const y = touch.y * ratio;
    const diameter = touch.size * ratio;

    positionBuffer.push(
      x, y, VERTEX_QUAD_POSITION.TOP_LEFT,
      x, y, VERTEX_QUAD_POSITION.TOP_RIGHT,
      x, y, VERTEX_QUAD_POSITION.BOTTOM_LEFT,
      x, y, VERTEX_QUAD_POSITION.BOTTOM_LEFT,
      x, y, VERTEX_QUAD_POSITION.TOP_RIGHT,
      x, y, VERTEX_QUAD_POSITION.BOTTOM_RIGHT
    );
    propertiesBuffer.push(
      diameter, touch.style, touch.borderWidth * ratio,
      diameter, touch.style, touch.borderWidth * ratio,
      diameter, touch.style, touch.borderWidth * ratio,
      diameter, touch.style, touch.borderWidth * ratio,
      diameter, touch.style, touch.borderWidth * ratio,
      diameter, touch.style, touch.borderWidth * ratio
    );
    colorBuffer.push(
      ...colorRgba,
      ...colorRgba,
      ...colorRgba,
      ...colorRgba,
      ...colorRgba,
      ...colorRgba
    );
    borderColorBuffer.push(
      ...borderColorRgba,
      ...borderColorRgba,
      ...borderColorRgba,
      ...borderColorRgba,
      ...borderColorRgba,
      ...borderColorRgba
    );
    const quadSize = diameter + touch.borderWidth * ratio;
    const quadSizeHalf = (quadSize / 2);
    backgroundImageTextcoordBuffer.push(
      x + quadSizeHalf, y + quadSizeHalf, // 4
      x - quadSizeHalf, y + quadSizeHalf, // 3
      x + quadSizeHalf, y - quadSizeHalf, // 2
      x + quadSizeHalf, y - quadSizeHalf, // 2
      x - quadSizeHalf, y + quadSizeHalf, // 3
      x - quadSizeHalf, y - quadSizeHalf  // 1
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
      size: 3,
      buffer: new Float32Array(propertiesBuffer)
    },
    color: {
      type: DrawObjectAttributeType.FLOAT,
      size: 4,
      buffer: new Float32Array(colorBuffer)
    },
    borderColor: {
      type: DrawObjectAttributeType.FLOAT,
      size: 4,
      buffer: new Float32Array(borderColorBuffer)
    },
    backgroundImageTextcoord: {
      type: DrawObjectAttributeType.FLOAT,
      size: 2,
      buffer: new Float32Array(backgroundImageTextcoordBuffer)
    }
  };
}
