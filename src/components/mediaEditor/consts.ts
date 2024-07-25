import {Color, ColorFormatType} from '../../helpers/color';
import {ImageAspectRatio, ImageState, TextLayer, DrawLayer, StickerLayer, ObjectLayerType, TextAlignment, TextStyle, BrushStyle} from './types';

export const WHITE_COLOR_HEX = {
  type: ColorFormatType.hexa,
  value: '#FFFFFF'
};

export const BLACK_COLOR_HEX = {
  type: ColorFormatType.hexa,
  value: '#000000'
};

export const RED_COLOR_HEX = {
  type: ColorFormatType.hexa,
  value: '#FE4438'
};

export const QUICK_PALLETE_COLORS: Color[] = [
  BLACK_COLOR_HEX,
  {
    type: ColorFormatType.hexa,
    value: '#FE4438'
  }, {
    type: ColorFormatType.hexa,
    value: '#FF8901'
  }, {
    type: ColorFormatType.hexa,
    value: '#FFD60A'
  }, {
    type: ColorFormatType.hexa,
    value: '#33C759'
  }, {
    type: ColorFormatType.hexa,
    value: '#62E5E0'
  }, {
    type: ColorFormatType.hexa,
    value: '#0A84FF'
  }, {
    type: ColorFormatType.hexa,
    value: '#BD5CF3'
  }
];

export const QUICK_PALLETE_COLORS_NIGHT = [
  WHITE_COLOR_HEX,
  {
    type: ColorFormatType.hexa,
    value: '#FE4438'
  }, {
    type: ColorFormatType.hexa,
    value: '#FF8901'
  }, {
    type: ColorFormatType.hexa,
    value: '#FFD60A'
  }, {
    type: ColorFormatType.hexa,
    value: '#33C759'
  }, {
    type: ColorFormatType.hexa,
    value: '#62E5E0'
  }, {
    type: ColorFormatType.hexa,
    value: '#0A84FF'
  }, {
    type: ColorFormatType.hexa,
    value: '#BD5CF3'
  }
];

export const DEFAULT_TEXT_LAYER: TextLayer = {
  id: 0,
  type: ObjectLayerType.text,
  isDirty: false,
  zIndex: 1,
  text: '',
  fontName: 'Roboto',
  fontSize: 24,
  fontWeight: 500,
  color: WHITE_COLOR_HEX,
  alignment: TextAlignment.left,
  style: TextStyle.fill_background,
  padding: 12,
  borderRadius: 6,
  strokeWidth: 4,
  strokeColor: BLACK_COLOR_HEX,
  secondColor: BLACK_COLOR_HEX,
  width: 130 * window.devicePixelRatio,
  height: 82 * window.devicePixelRatio,
  rotation: 0,
  translation: [0, 0],
  scale: [1, 1],
  origin: [0, 0]
};

export const DEFAULT_DRAW_LAYER: DrawLayer = {
  id: 0,
  type: ObjectLayerType.draw,
  zIndex: 0,
  color: RED_COLOR_HEX,
  size: 15,
  style: BrushStyle.pen,
  touches: []
};

export const DEFAULT_STICKER_LAYER: StickerLayer = {
  id: 0,
  type: ObjectLayerType.sticker,
  zIndex: 2,
  stickerId: '',
  width: 0,
  height: 0,
  rotation: 0,
  translation: [0, 0],
  scale: [1, 1],
  origin: [0, 0]
}

export const DEFAULT_IMAGE_STATE: ImageState = {
  type: ObjectLayerType.backgroundImage,
  resultX: 0,
  resultY: 0,
  resultWidth: 0,
  resultHeight: 0,
  originalWidth: 0,
  originalHeight: 0,
  filter: {
    sharpness: 0,
    brightness: 0,
    contrast: 0,
    saturation: 0,
    warmth: 0,
    fade: 0,
    highlights: 0,
    shadows: 0,
    vignette: 0,
    grain: 0,
    sharpen: 0,
    blur: 0
  },
  aspectRatio: ImageAspectRatio.original,
  rotation: 0,
  translation: [0, 0],
  scale: [1, 1],
  origin: [0, 0],
  layers: [],
  drawLayer: DEFAULT_DRAW_LAYER
};

export const NEON_BRUSH_BORDER_COLOR: Color = {
  type: ColorFormatType.rgba,
  value: [255, 255, 255, 255]
};

export const TRANPARENT_COLOR: Color = {
  type: ColorFormatType.rgba,
  value: [0, 0, 0, 0]
};

export const NEON_BRUSH_BORDER_WIDTH = 5;

export const DRAGGABLE_OBJECT_TOP_BOTTOM_PADDING = 14;

export const DRAGGABLE_OBJECT_TOP_LEFT_RIGHT = 6;

export const DRAW_ARROW_CAP_AFTER_MS = 250;

export const IMAGE_EDITOR_MOBILE_WIDTH_THRESHOLD = 840;

export const MAX_FONT_SIZE = 128;

export const WAIT_TILL_USER_FINISH_CHANGES_TO_COMMIT_STATE = 250;

export const WEBGL_DEBUG_MODE = false;
