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
  | AspectRatioChangeEvent
  | TextAttachmentChangeEvent;

export enum ImageAspectRatio {
  custom = 'custom',
  original = 'original',
  square = 'square'
}

export enum ImageAttachmentType {
  text = 'text',
  sticker = 'sticker',
  draw = 'draw'
}

export type ImageAttachment = TextImageAttachment;

export interface ImageAttachmentBox {
  // from left top corner of image
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

export enum TextAlignment {
  left = 'left',
  right = 'right',
  center = 'center',
}

export enum TextStyle {
  fill = 'fill',
  fill_inverse = 'fill_inverse',
  stroke = 'stroke',
}

export interface TextImageAttachment {
  type: ImageAttachmentType.text;
  zIndex: number;
  box: ImageAttachmentBox;

  text: string;
  fontName: string;
  fontSize: number;
  colorHsla: string
  alignment: TextAlignment;
  style: TextStyle;
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

  attachments: TextImageAttachment[];
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

export interface TextAttachmentChangeEvent {
  type: ImageChangeType.text;
  attachment: TextImageAttachment;
  attachmentIndex: number;
}
