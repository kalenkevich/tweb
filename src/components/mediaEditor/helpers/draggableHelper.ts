import {distance} from './mathHelper';

export function getResizeCursorName(x: number, y: number): string {
  const topLeftCorner = {
    x: 0,
    y: 0,
    cursor: 'nwse-resize'
  };
  const topRightCorner = {
    x: window.innerWidth,
    y: 0,
    cursor: 'nesw-resize'
  };
  const bottomLeftCorner = {
    x: 0,
    y: window.innerHeight,
    cursor: 'nesw-resize'
  };
  const bottomRightCorner = {
    x: window.innerWidth,
    y: window.innerHeight,
    cursor: 'nwse-resize'
  };

  return [topLeftCorner, topRightCorner, bottomLeftCorner, bottomRightCorner].sort((a, b) => {
    const aDistance = distance([x, y], [a.x, a.y]);
    const bDistance = distance([x, y], [b.x, b.y]);

    return aDistance - bDistance;
  })[0].cursor;
}
