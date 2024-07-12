import {Color} from '../../helpers/color';

export type ImageSource = HTMLImageElement;

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
  origin: [number, number],
  translation: [number, number];
  scale: [number, number];
  layers: ObjectLayer[];
}

export enum ImageChangeType {
  filter,
  rotate,
  // should be removed and resize used
  aspectRatio,
  resize,
  move,
  flipHorisontaly,
  layer,
}

export type ImageChangeEvent = FilterImageChangeEvent
  | RotateImageChangeEvent
  | AspectRatioChangeEvent
  | FlipImageChangeEvent
  | MoveChangeEvent
  | ResizeChangeEvent
  | AttachmentChangeEvent;

export interface FilterImageChangeEvent {
  type: ImageChangeType.filter;
  value: ImageFilterState;
}

export interface AspectRatioChangeEvent {
  type: ImageChangeType.aspectRatio;
  value: number | ImageAspectRatio;
  animation?: boolean;
}

export interface RotateImageChangeEvent {
  type: ImageChangeType.rotate;
  value: number; // angle in degree;
  animation?: boolean;
}

export interface FlipImageChangeEvent {
  type: ImageChangeType.flipHorisontaly;
}

export interface MoveChangeEvent {
  type: ImageChangeType.move;
  deltaX: number;
  deltaY: number;
  animation?: boolean;
}

export interface ResizeChangeEvent {
  type: ImageChangeType.resize;
  scaleX: number;
  scaleY: number;
  animation?: boolean;
}

export interface AttachmentChangeEvent {
  type: ImageChangeType.layer;
  layer: ObjectLayer;
  layerIndex?: number;
  action: AttachmentChangeAction;
}
