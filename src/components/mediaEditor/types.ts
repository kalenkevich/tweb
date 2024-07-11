import {Color} from '../../helpers/color';

export type ImageSource = HTMLImageElement;

export enum ImageChangeType {
  filter,
  aspectRatio,
  rotate,
  scale,
  crop,
  layer,
}

export type ImageChangeEvent = FilterImageChangeEvent
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

export type ObjectLayer = TextLayer| DrawLayer;

export interface LayerBox {
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

export interface TextLayer {
  type: ImageAttachmentType.text;
  zIndex: number;
  box: LayerBox;
  text: string;
  fontName: string;
  fontSize: number;
  color: Color;
  alignment: TextAlignment;
  style: TextStyle;
}

export interface DrawLayer {
  type: ImageAttachmentType.draw;
  zIndex: number;
  box: LayerBox;
  color: Color;
  size: number;
  style: DrawStyle;
}

export const IMAGE_FILTER_NAMES = [
  'enhance',
  'brightness',
  'contrast',
  'saturation',
  'warmth',
  'fade',
  'highlights',
  'shadows',
  'vignette',
  'grain',
  'sharpen'
];
export interface ImageFilterState {
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
}

export interface ImageState {
  source?: ImageSource;
  width: number;
  height: number;
  filter: ImageFilterState;
  aspectRatio: number | ImageAspectRatio;
  rotateAngle: number;
  layers: ObjectLayer[];
}

export interface FilterImageChangeEvent {
  type: ImageChangeType.filter;
  value: ImageFilterState;
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
  type: ImageChangeType.layer;
  layer: ObjectLayer;
  layerIndex?: number;
  action: AttachmentChangeAction;
}
