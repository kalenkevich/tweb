import {ImageState} from './types';

export const DEFAULT_IMAGE_STATE: ImageState = {
  source: new Uint8Array([]),

  width: 0,
  height: 0,

  enhance: 50,
  brightness: -50,
  contrast: 50,
  saturation: 0,
  warmth: 0,
  fade: 0,
  highlights: 0,
  shadows: 0,
  vignette: 0,
  grain: 0,
  sharpen: 0
};
