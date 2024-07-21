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

export enum Direction {
  top = 'top',
  left = 'left',
  right = 'right',
  bottom = 'bottom',
  topLeft = 'topLeft',
  topRight = 'topRight',
  bottomLeft = 'bottomLeft',
  bottomRight = 'bottomRight'
}
export function getLineDirection(p1: [number, number], p2: [number, number]): Direction {
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

export function distance(p1: [number, number], p2: [number, number] = [0, 0]): number {
  return Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2));
}
