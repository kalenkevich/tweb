export type ImageSource = Uint8Array;

export enum ImageChangeType {
  enhance,
  brightness,
  contrast,
  saturation,
  warmth,
  fade,
  highlights,
  shadows,
  vignette,
  grain,
  sharpen,
  aspectRatio,
  rotate,
  scale,
  crop,
  text,
  paint,
  sticker,
}

export type ImageChangeEvent = EnhanceImageChangeEvent
  | BrightnessImageChangeEvent
  | ContrastImageChangeEvent
  | SaturationImageChangeEvent
  | WarmthImageChangeEvent
  | FadeImageChangeEvent
  | HighlightsImageChangeEvent
  | ShadowsImageChangeEvent
  | VignetteImageChangeEvent
  | GrainImageChangeEvent
  | SharpenImageChangeEvent
  | RotateImageChangeEvent
  | AspectRatioChangeEvent;

export enum ImageAspectRatio {
  custom = 'custom',
  original = 'original',
  square = 'square'
}

export interface ImageState {
  source: ImageSource;

  // image props
  width: number;
  height: number;

  // filter props
  enhance: number;
  brightness: number;
  contrast: number;
  saturation: number;
  warmth: number;
  fade: number;
  highlights: number;
  shadows: number;
  vignette: number;
  grain: number;
  sharpen: number;

  // resize props
  aspectRatio: number | ImageAspectRatio;
  rotateAngle: number;
}

export interface EnhanceImageChangeEvent {
  type: ImageChangeType.enhance;
  value: number;
}

export interface BrightnessImageChangeEvent {
  type: ImageChangeType.brightness;
  value: number;
}

export interface ContrastImageChangeEvent {
  type: ImageChangeType.contrast;
  value: number;
}

export interface SaturationImageChangeEvent  {
  type: ImageChangeType.saturation;
  value: number;
}

export interface WarmthImageChangeEvent  {
  type: ImageChangeType.warmth;
  value: number;
}

export interface FadeImageChangeEvent  {
  type: ImageChangeType.fade;
  value: number;
}

export interface HighlightsImageChangeEvent  {
  type: ImageChangeType.highlights;
  value: number;
}

export interface ShadowsImageChangeEvent  {
  type: ImageChangeType.shadows;
  value: number;
}

export interface VignetteImageChangeEvent  {
  type: ImageChangeType.vignette;
  value: number;
}

export interface GrainImageChangeEvent  {
  type: ImageChangeType.grain;
  value: number;
}

export interface SharpenImageChangeEvent  {
  type: ImageChangeType.sharpen;
  value: number;
}

export interface AspectRatioChangeEvent {
  type: ImageChangeType.aspectRatio;
  value: number | ImageAspectRatio;
}

export interface RotateImageChangeEvent {
  type: ImageChangeType.rotate;
  value: number; // angle in radians;
}
