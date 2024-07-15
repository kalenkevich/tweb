import {Color} from '../../helpers/color';
import {ImageElementTextureSource} from './webgl/helpers/webglTexture';

export type ImageSource = HTMLImageElement;

export enum ImageAspectRatio {
  custom = 'custom',
  original = 'original',
  square = 'square'
}

export enum ImageLayerType {
  text = 'text',
  sticker = 'sticker',
  draw = 'draw'
}

export type ImageLayer = TextLayer | DrawLayer | StickerLayer;

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
  id: number;
  type: ImageLayerType.text;
  isDirty: boolean;
  zIndex: number;
  text: string;
  fontName: string;
  fontSize: number
  fontWeight: number;
  color: Color;
  alignment: TextAlignment;
  style: TextStyle;
  // styles for TextStyle.fill_inverse
  padding: number; // fontSize / 2
  borderRadius: number; // fontSize / 4
  strokeColor: Color;
  strokeWidth: number; // fontSize / 6
  secondColor: Color; // bac
  width: number;
  height: number;
  rotation: number;
  origin: [number, number],
  translation: [number, number];
  scale: [number, number];
  texture?: ImageElementTextureSource;
}

export interface DrawLayer {
  id: number;
  type: ImageLayerType.draw;
  isDirty: boolean;
  zIndex: number;
  color: Color;
  size: number;
  style: DrawStyle;
  width: number;
  height: number;
  rotation: number;
  origin: [number, number],
  translation: [number, number];
  scale: [number, number];
  texture?: ImageElementTextureSource;
}

export interface StickerLayer {
  id: number;
  type: ImageLayerType.sticker;
  isDirty: boolean;
  zIndex: number;
  image: ImageSource;
  width: number;
  height: number;
  rotation: number;
  origin: [number, number];
  translation: [number, number];
  scale: [number, number];
  texture?: ImageElementTextureSource;
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
  texture?: ImageElementTextureSource;
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
  filter: ImageFilterState;
  aspectRatio: number | ImageAspectRatio;
  rotation: number;
  translation: [number, number];
  origin: [number, number];
  scale: [number, number];
  layers: ImageLayer[];
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
  | LayerChangeEvent;

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

export interface LayerChangeEvent {
  type: ImageChangeType.layer;
  layer: ImageLayer;
  action: AttachmentChangeAction;
}
