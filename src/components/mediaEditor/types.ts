import {Color} from '../../helpers/color';
import {ImageElementTextureSource} from './webgl/helpers/webglTexture';

export type ImageSource = HTMLImageElement;

export enum FlipImageDirection {
  vertical = 'vertical',
  horisontal = 'horisontal'
}

export enum ImageAspectRatio {
  custom = 'custom',
  original = 'original',
  square = 'square'
}

export enum ObjectLayerType {
  backgroundImage = 'backgroundImage',
  text = 'text',
  sticker = 'sticker',
  draw = 'draw'
}

export type ObjectLayer = TextLayer | StickerLayer;

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

export enum BrushStyle {
  pen = 0,
  arrow = 1,
  brush = 2,
  neon = 3,
  blur = 4,
  eraser = 5
}

export enum AttachmentChangeAction {
  create = 'create',
  update = 'update',
  delete = 'delete',
}

export interface TextLayer {
  id: number;
  type: ObjectLayerType.text;
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

export interface BrushTouch {
  sequenceId: number;
  color: Color;
  size: number; // radius
  style: BrushStyle;
  borderColor: Color;
  borderWidth: number;
  x: number;
  y: number;
}

export interface DrawLayer {
  id: number;
  type: ObjectLayerType.draw;
  zIndex: number;
  color: Color;
  size: number; // radius
  style: BrushStyle;
  touches: BrushTouch[];
  texture?: ImageElementTextureSource;
}

export interface StickerLayer {
  id: number;
  type: ObjectLayerType.sticker;
  zIndex: number;
  stickerId: string;
  width: number;
  height: number;
  rotation: number;
  origin: [number, number];
  translation: [number, number];
  scale: [number, number];
  texture?: ImageElementTextureSource;
}

export const IMAGE_FILTER_NAMES = [
  'sharpness',
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
  // "Enhance" filter
  sharpness: number;
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
  type: ObjectLayerType.backgroundImage;
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
  layers: ObjectLayer[];
  // keep draw layer separate as it only one per image.
  drawLayer: DrawLayer;
}

export enum ImageChangeType {
  filter,
  rotate,
  // should be removed and resize used
  aspectRatio,
  resize,
  move,
  flip,
  layer,
  drawLayer,
  drawTouch
}

export type ImageChangeEvent = FilterImageChangeEvent
  | RotateImageChangeEvent
  | AspectRatioChangeEvent
  | FlipImageChangeEvent
  | MoveChangeEvent
  | ResizeChangeEvent
  | LayerChangeEvent
  | DrawLayerChangeEvent
  | DrawTouchEvent;

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
  type: ImageChangeType.flip;
  alignment: FlipImageDirection;
  animation?: boolean;
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
  layer: ObjectLayer;
  action: AttachmentChangeAction;
  appearInRandomSpot?: boolean;
}

export interface DrawLayerChangeEvent {
  type: ImageChangeType.drawLayer;
  layer: {
    color?: Color;
    style?: BrushStyle;
    size?: number;
  };
}

export interface DrawTouchEvent {
  type: ImageChangeType.drawTouch;
  touch: {x: number; y: number} & Partial<BrushTouch>;
  preventDrawingArrowCap?: boolean;
}
