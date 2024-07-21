import {ImageAspectRatio} from '../types';

export const getScaleByAspectRatio = (sourceWidth: number, sourceHeight: number, aspectRatio: ImageAspectRatio | number): [number, number] => {
  const imageAspect = sourceWidth / sourceHeight;
  if(typeof aspectRatio === 'number') {
    return [1, imageAspect / aspectRatio];
  }

  if(aspectRatio === ImageAspectRatio.square) {
    return [1, imageAspect];
  }

  // ImageAspectRatio.original
  return [1, 1];
};

export enum ScaleMode {
  cover = 'cover',
  contain = 'contain',
  fitVertically = 'fitVertically',
  fitHorisontal = 'fitHorisontal',
}

export const fitImageIntoCanvas = (
  scaleMode: ScaleMode,
  imageWidth: number,
  imageHeight: number,
  canvasWidth: number,
  canvasHeight: number,
  aspectRatio: ImageAspectRatio | number
): [number, number] => {
  const canvasAspect = canvasWidth / canvasHeight;
  const imageScale = getScaleByAspectRatio(imageWidth, imageHeight, aspectRatio);
  const imageAspect = (imageWidth * imageScale[0]) / (imageHeight * imageScale[1]);

  if(scaleMode === ScaleMode.contain) {
    let scaleY = 1;
    let scaleX = imageAspect / canvasAspect;
    if(scaleX > 1) {
      scaleY = 1 / scaleX;
      scaleX = 1;
    }

    return [scaleX, scaleY];
  }

  if(scaleMode === ScaleMode.fitVertically) {
    return [imageAspect / canvasAspect, 1];
  }

  if(scaleMode === ScaleMode.fitHorisontal) {
    return [1, canvasAspect / imageAspect];
  }

  if(scaleMode === ScaleMode.cover) {
    let scaleY = 1;
    let scaleX = imageAspect / canvasAspect;
    if(scaleX < 1) {
      scaleY = 1 / scaleX;
      scaleX = 1;
    }

    return [scaleX, scaleY];
  }

  return imageScale;
};

export function fitImageIntoElement(
  imageWidth: number,
  imageHeight: number,
  elWidth: number,
  elHeight: number
): [number, number] {
  if(imageWidth <= elWidth && imageHeight > elHeight) {
    const aspect = elHeight / imageHeight;

    return [imageWidth * aspect, imageHeight * aspect];
  }

  if(imageWidth > elWidth && imageHeight <= elHeight) {
    const aspect = elWidth / imageWidth;

    return [imageWidth * aspect, imageHeight * aspect];
  }

  if(imageWidth > elWidth && imageHeight > elHeight) {
    const aspectW = elWidth / imageWidth;
    const aspectH = elHeight / imageHeight;
    const aspect = Math.min(aspectW, aspectH);

    return [imageWidth * aspect, imageHeight * aspect];
  }

  return [imageWidth, imageHeight];
};

export function getDimentionsForAspectRatio(
  elWidth: number,
  elHeight: number,
  aspectRatio: ImageAspectRatio | number
): [number, number] {
  const scale = getScaleByAspectRatio(elWidth, elHeight, aspectRatio);

  return [elWidth * scale[0], elHeight * scale[1]];
}
