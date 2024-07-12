import {Color, ColorFormatType} from '../../helpers/color';
import {ImageAspectRatio, ImageState, TextLayer, DrawLayer, ImageAttachmentType, TextAlignment, TextStyle, DrawStyle} from './types';

export const DEFAULT_IMAGE_STATE: ImageState = {
  width: 0,
  height: 0,
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
  origin: [0, 0],
  scale: [1, 1],
  layers: []
};

const isDarkMode = !!document.documentElement.classList.contains('dark');

export const DEFAULT_TEXT_LAYER: TextLayer = {
  type: ImageAttachmentType.text,
  zIndex: 0,
  box: {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    rotation: 0
  },
  text: '',
  fontName: 'Roboto',
  fontSize: 24,
  color: {
    type: ColorFormatType.hexa,
    value: isDarkMode ? '#FFFFFF' : '#000000'
  },
  alignment: TextAlignment.left,
  style: TextStyle.fill
}

export const DEFAULT_DRAW_LAYER: DrawLayer = {
  type: ImageAttachmentType.draw,
  zIndex: 0,
  box: {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    rotation: 0
  },
  color: {
    type: ColorFormatType.hexa,
    value: isDarkMode ? '#FFFFFF' : '#000000'
  },
  size: 15,
  style: DrawStyle.pen
}

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
