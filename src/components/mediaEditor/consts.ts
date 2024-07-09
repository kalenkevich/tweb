import {ImageAspectRatio, ImageState, TextImageAttachment, ImageAttachmentType, TextAlignment, TextStyle} from './types';

export const DEFAULT_IMAGE_STATE: ImageState = {
  source: new Uint8Array([]),

  width: 0,
  height: 0,

  enhance: 50,
  brightness: -50,
  contrast: 50,
  saturation: 0,
  warmth: 0,
  fade: 0,
  highlights: 0,
  shadows: 0,
  vignette: 0,
  grain: 0,
  sharpen: 0,

  aspectRatio: ImageAspectRatio.original,
  rotateAngle: 0,

  attachments: []
};

const isDarkMode = !!document.documentElement.classList.contains('dark');
export const DEFAULT_TEXT_ATTACHMENT: TextImageAttachment = {
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
  colorHsla: isDarkMode ? 'hsla(0, 0%, 100%, 1)' : 'hsla(0, 0%, 0%, 1)',
  alignment: TextAlignment.left,
  style: TextStyle.fill
}
