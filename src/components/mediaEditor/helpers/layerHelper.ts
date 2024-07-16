let _currentLayerId = 0;

export const getLayerNextId = () => _currentLayerId++;

function getRandomValue(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export const getRandomLayerStartPosition = (
  canvasWidth: number,
  canvasHeight: number
): [number, number] => {
  return [getRandomValue(0, canvasWidth), getRandomValue(0, canvasHeight)];
}
