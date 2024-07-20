import {BrushTouch, DrawLayer, BrushStyle} from '../types';
import {getLineDirection, Direction, rotate, getAngleBetweenLines, distance} from './mathHelper';

export function canDrawArrow(brushTouches: BrushTouch[]) {
  return brushTouches.length >= 2 &&
      brushTouches[brushTouches.length - 2].style === BrushStyle.arrow &&
      brushTouches[brushTouches.length - 1].style === BrushStyle.arrow;
}

const ARROW_CAP_SIZE = 15;
const ARROW_CAP_ANGLE = 1/3 * Math.PI;

export function correctAngle(angle: number, direction: Direction): number {
  if(direction === Direction.top) {
    return -angle;
  }

  if(direction === Direction.bottom) {
    return angle;
  }

  if(direction === Direction.topRight) {
    return -angle;
  }

  if(direction === Direction.topLeft) {
    return 2 * Math.PI - angle;
  }

  if(direction === Direction.bottomLeft) {
    return angle;
  }

  if(direction === Direction.bottomRight) {
    return angle;
  }

  return angle;
}

export function getArrowCapTouches(drawLayer: DrawLayer, touches: BrushTouch[]): BrushTouch[] {
  const capTouches: BrushTouch[] = [];
  const lastTouch = touches[touches.length - 1];
  let index = touches.length - 2;
  const step = drawLayer.size / 4;
  const arrowCapWidth = step * ARROW_CAP_SIZE;
  while(
    index > 0 &&
    touches[index].sequenceId === lastTouch.sequenceId &&
    touches[index].style === BrushStyle.arrow &&
    distance([touches[index].x, touches[index].y], [lastTouch.x, lastTouch.y]) < arrowCapWidth) {
    index--;
  }
  const fistTouch = touches[++index];
  if(fistTouch.style !== BrushStyle.arrow ||
    fistTouch.sequenceId !== lastTouch.sequenceId ||
    distance([fistTouch.x, fistTouch.y], [lastTouch.x, lastTouch.y]) < arrowCapWidth / 2) {
    return [];
  }

  const angle = getAngleBetweenLines([fistTouch.x, fistTouch.y, lastTouch.x, lastTouch.y], [0, 0, 1, 0]);
  const direction = getLineDirection([fistTouch.x, fistTouch.y], [lastTouch.x, lastTouch.y]);
  const correctedAngle = correctAngle(angle, direction);

  let currentTouch = {...lastTouch};
  for(let i = 0; i < ARROW_CAP_SIZE; i++) {
    currentTouch = {
      ...currentTouch,
      x: currentTouch.x - step,
      y: currentTouch.y - step * Math.cos(ARROW_CAP_ANGLE)
    };
    capTouches.push(currentTouch);
  }

  currentTouch = {...lastTouch}
  for(let i = 0; i < ARROW_CAP_SIZE; i++) {
    currentTouch = {
      ...currentTouch,
      x: currentTouch.x - step,
      y: currentTouch.y + step * Math.cos(ARROW_CAP_ANGLE)
    };
    capTouches.push(currentTouch);
  }

  for(const touch of capTouches) {
    const [newX, newY] = rotate([lastTouch.x, lastTouch.y], [touch.x, touch.y], correctedAngle);
    touch.x = newX;
    touch.y = newY;
  }

  return capTouches;
};
