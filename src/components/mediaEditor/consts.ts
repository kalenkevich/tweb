import {Color, ColorFormatType} from '../../helpers/color';
import {ImageAspectRatio, ImageState, TextLayer, DrawLayer, StickerLayer, ImageLayerType, TextAlignment, TextStyle, DrawStyle} from './types';

export const DEFAULT_IMAGE_STATE: ImageState = {
  width: 0,
  height: 0,
  originalWidth: 0,
  originalHeight: 0,
  filter: {
    enhance: 0,
    brightness: 0,
    contrast: 0,
    saturation: 0,
    warmth: 0,
    fade: 0,
    highlights: 0,
    shadows: 0,
    vignette: 0,
    grain: 0,
    sharpen: 0
  },
  aspectRatio: ImageAspectRatio.original,
  rotateAngle: 0,
  translation: [0, 0],
  scale: [1, 1],
  layers: []
};

export const WHITE_COLOR_HEX = {
  type: ColorFormatType.hexa,
  value: '#FFFFFF'
};

export const BLACK_COLOR_HEX = {
  type: ColorFormatType.hexa,
  value: '#000000'
};

export const QUCIK_PALLETE_COLORS: Color[] = [{
  type: ColorFormatType.hexa,
  value: '#FFFFFF'
  // hsla(0, 0%, 100%, 1)
  // rgba(255, 255, 255, 1)
}, {
  type: ColorFormatType.hexa,
  value: '#FE4438'
  // hsla(4, 99%, 61%, 1)
  // rgba(254, 68, 56, 1)
}, {
  type: ColorFormatType.hexa,
  value: '#FF8901'
  // hsla(32, 100%, 50%, 1)
  // rgba(255, 137, 1, 1)
}, {
  type: ColorFormatType.hexa,
  value: '#FFD60A'
  // hsla(50, 100%, 52%, 1)
  // rgba(255, 214, 10, 1)
}, {
  type: ColorFormatType.hexa,
  value: '#33C759'
  // hsla(135, 59%, 49%, 1)
  // rgba(51, 199, 89, 1)
}, {
  type: ColorFormatType.hexa,
  value: '#62E5E0'
  // hsla(178, 72%, 64%, 1)
  // rgba(98, 229, 224, 1)
}, {
  type: ColorFormatType.hexa,
  value: '#0A84FF'
  // hsla(210, 100%, 52%, 1)
  // rgba(10, 132, 255, 1)
}, {
  type: ColorFormatType.hexa,
  value: '#BD5CF3'
  // hsla(279, 86%, 66%, 1)
  // rgba(189, 92, 243, 1)
}];

export const DEFAULT_TEXT_LAYER: TextLayer = {
  id: 0,
  type: ImageLayerType.text,
  isDirty: false,
  zIndex: 0,
  text: '',
  fontName: 'Roboto',
  fontSize: 24,
  fontWeight: 500,
  color: QUCIK_PALLETE_COLORS[0],
  alignment: TextAlignment.left,
  style: TextStyle.fill,
  padding: 12,
  borderRadius: 6,
  strokeWidth: 4,
  strokeColor: {
    type: ColorFormatType.hexa,
    value: '#000000'
  },
  secondColor: {
    type: ColorFormatType.hexa,
    value: '#000000'
  },
  image: new Image(),
  width: 130 * window.devicePixelRatio,
  height: 82 * window.devicePixelRatio,
  rotation: 0,
  translation: [0, 0],
  scale: [1, 1]
};

export const DEFAULT_DRAW_LAYER: DrawLayer = {
  id: 0,
  type: ImageLayerType.draw,
  isDirty: false,
  zIndex: 0,
  color: QUCIK_PALLETE_COLORS[0],
  size: 15,
  style: DrawStyle.pen,
  width: 0,
  height: 0,
  rotation: 0,
  translation: [0, 0],
  scale: [1, 1]
};

export const DEFAULT_STICKER_LAYER: StickerLayer = {
  id: 0,
  type: ImageLayerType.sticker,
  isDirty: false,
  zIndex: 0,
  image: '',
  width: 0,
  height: 0,
  rotation: 0,
  translation: [0, 0],
  scale: [1, 1]
}
