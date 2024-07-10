import {Color} from '../../helpers/color';

export type ImageSource = Uint8Array;

export enum ImageChangeType {
  // to be filter
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

  attachment,
  text,
  draw,
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
  | AttachmentChangeEvent;

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

export type ImageAttachment = TextImageAttachment | DrawImageAttachment;

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

export enum DrawStyle {
  pen = 'pen',
  arrow = 'arrow',
  brush = 'brush',
  neon = 'neon',
  blur = 'blur',
  eraser = 'eraser'
}

export enum AttachmentChangeAction {
  create = 'create',
  update = 'update',
  delete = 'delete',
}

export interface TextImageAttachment {
  type: ImageAttachmentType.text;
  zIndex: number;
  box: ImageAttachmentBox;

  text: string;
  fontName: string;
  fontSize: number;
  color: Color;
  alignment: TextAlignment;
  style: TextStyle;
}

export interface DrawImageAttachment {
  type: ImageAttachmentType.draw;
  zIndex: number;
  box: ImageAttachmentBox;
  color: Color;
  size: number;
  style: DrawStyle;
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

  attachments: ImageAttachment[];
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

export interface AttachmentChangeEvent {
  type: ImageChangeType.attachment;
  attachment: ImageAttachment;
  attachmentIndex?: number;
  action: AttachmentChangeAction;
}
