let _currentLayerId = 0;

export const getLayerNextId = () => _currentLayerId++;

function getRandomValue(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export const getRandomLayerStartPosition = (
  fromX: number,
  fromY: number,
  toX: number,
  toY: number
): [number, number] => {
  return [getRandomValue(fromX, toX), getRandomValue(fromY, toY)];
}
