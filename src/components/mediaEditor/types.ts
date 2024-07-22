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
  default = 'default',
  fill_background = 'fill_background',
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
  secondColor: Color; // bacground color
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

export enum ImageFilterType {
  sharpness = 'sharpness',
  brightness = 'brightness',
  contrast = 'contrast',
  saturation = 'saturation',
  warmth = 'warmth',
  fade = 'fade',
  highlights = 'highlights',
  shadows = 'shadows',
  vignette = 'vignette',
  grain = 'grain',
  sharpen = 'sharpen',
  blur = 'blur'
}

export const IMAGE_FILTER_NAMES = [
  ImageFilterType.sharpness,
  ImageFilterType.brightness,
  ImageFilterType.contrast,
  ImageFilterType.saturation,
  ImageFilterType.warmth,
  ImageFilterType.fade,
  ImageFilterType.highlights,
  ImageFilterType.shadows,
  ImageFilterType.vignette,
  ImageFilterType.grain,
  ImageFilterType.sharpen,
  ImageFilterType.blur
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
  blur: number;
}

export interface ImageState {
  type: ObjectLayerType.backgroundImage;
  source?: ImageSource;
  texture?: ImageElementTextureSource;
  originalWidth: number;
  originalHeight: number;
  // From where to start draw image
  resultX: number;
  resultY: number;
  // From where to start draw image
  resultWidth: number;
  resultHeight: number;
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
  crop,
  flip,
  layer,
  drawLayer,
  drawTouch,
  layerTranslation,
  layerOrigin,
  textLayerFontSize
}

export type ImageChangeEvent = FilterImageChangeEvent
  | RotateImageChangeEvent
  | AspectRatioChangeEvent
  | FlipImageChangeEvent
  | MoveChangeEvent
  | ResizeChangeEvent
  | CropChangeEvent
  | LayerChangeEvent
  | DrawLayerChangeEvent
  | DrawTouchEvent
  | LayerTranslationChangeEvent
  | LayerOriginChangeEvent
  | TextLayerFontSizeChangeEvent;

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

export interface CropChangeEvent {
  type: ImageChangeType.crop;
  x: number;
  y: number;
  width: number;
  height: number;
  animation?: boolean;
}

export interface LayerChangeEvent {
  type: ImageChangeType.layer;
  layerId: number;
  layer?: Partial<ObjectLayer>;
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

export interface TextLayerFontSizeChangeEvent {
  type: ImageChangeType.textLayerFontSize;
  layerId: number;
  fontSize: number;
}

export interface LayerTranslationChangeEvent {
  type: ImageChangeType.layerTranslation;
  layerId: number;
  translation: [number, number];
}

export interface LayerOriginChangeEvent {
  type: ImageChangeType.layerOrigin;
  layerId: number;
  origin: [number, number];
  translation?: [number, number]
}
