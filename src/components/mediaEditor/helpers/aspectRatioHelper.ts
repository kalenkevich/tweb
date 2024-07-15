import {ImageAspectRatio} from '../types';

export const getImageScaleByAspectRatio = (sourceWidth: number, sourceHeight: number, aspectRatio: ImageAspectRatio | number): [number, number] => {
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
  const imageScale = getImageScaleByAspectRatio(imageWidth, imageHeight, aspectRatio);
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
