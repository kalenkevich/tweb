import {BrushTouch, DrawLayer, BrushStyle} from '../types';

export function canDrawArrow(brushTouches: BrushTouch[]) {
  return brushTouches.length >= 2 &&
      brushTouches[brushTouches.length - 2].style === BrushStyle.arrow &&
      brushTouches[brushTouches.length - 1].style === BrushStyle.arrow;
}

const ARROW_CAP_SIZE = 15;
const ARROW_CAP_ANGLE = 1/3 * Math.PI;

export function rotate(origin: [number, number], point: [number, number], angle: number): [number, number] {
  return [
    origin[0] + Math.cos(angle) * (point[0] - origin[0]) - Math.sin(angle) * (point[1] - origin[1]),
    origin[1] + Math.sin(angle) * (point[0] - origin[0]) + Math.cos(angle) * (point[1] - origin[1])
  ];
}

export function getAngleBetweenLines(l1: [number, number, number, number], l2: [number, number, number, number]): number {
  const dAx = l1[2] - l1[0];
  const dAy = l1[3] - l1[1];
  const dBx = l2[2] - l2[0];
  const dBy = l2[3] - l2[1];
  const angle = Math.atan2(dAx * dBy - dAy * dBx, dAx * dBx + dAy * dBy);

  if(angle < 0) {
    return -angle;
  }

  return angle;
}

enum Direction {
  top = 'top',
  left = 'left',
  right = 'right',
  bottom = 'bottom',
  topLeft = 'topLeft',
  topRight = 'topRight',
  bottomLeft = 'bottomLeft',
  bottomRight = 'bottomRight'
}
export function getDirection(p1: [number, number], p2: [number, number]): Direction {
  if(p1[1] > p2[1] && p1[0] === p2[0]) {
    return Direction.top;
  }

  if(p1[1] < p2[1] && p1[0] === p2[0]) {
    return Direction.bottom;
  }

  if(p1[0] > p2[0] && p1[1] === p2[1]) {
    return Direction.left;
  }

  if(p1[0] < p2[0] && p1[1] === p2[1]) {
    return Direction.right;
  }

  if(p1[1] > p2[1] && p1[0] > p2[0]) {
    return Direction.topLeft;
  }

  if(p1[1] < p2[1] && p1[0] > p2[0]) {
    return Direction.bottomLeft;
  }

  if(p1[1] > p2[1] && p1[0] < p2[0]) {
    return Direction.topRight;
  }

  if(p1[1] < p2[1] && p1[0] < p2[0]) {
    return Direction.bottomRight;
  }
}

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
  while(
    index > 0 &&
    touches[index].sequenceId === lastTouch.sequenceId &&
    touches[index].style === BrushStyle.arrow) {
    index--;
  }
  const fistTouch = touches[++index];

  const angle = getAngleBetweenLines([fistTouch.x, fistTouch.y, lastTouch.x, lastTouch.y], [0, 0, 1, 0]);
  const direction = getDirection([fistTouch.x, fistTouch.y], [lastTouch.x, lastTouch.y]);
  const correctedAngle = correctAngle(angle, direction);
  const step = drawLayer.size / 4;

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
