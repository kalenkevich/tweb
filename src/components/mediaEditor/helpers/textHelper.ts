import {TextLayer, TextStyle} from '../types';
import {anyColorToHexColor} from '../../../helpers/color';
import {measureText as measureCanvasText, getCanvas2DFontStyle, getImageFromCanvas} from '../helpers/canvas2dHelper';
import {ImageElementTextureSource, createImageElementTextureSource} from '../webgl/helpers/webglTexture';

let _offscreenInputEl: HTMLDivElement;

export const getOffscreenInput = (): HTMLDivElement => {
  if(_offscreenInputEl) {
    return _offscreenInputEl;
  }

  _offscreenInputEl = document.createElement('div');
  _offscreenInputEl.style.position = 'absolute';
  _offscreenInputEl.style.visibility = 'hidden';
  _offscreenInputEl.style.height = 'auto';
  _offscreenInputEl.style.width = 'auto';
  _offscreenInputEl.style.whiteSpace = 'nowrap';

  document.body.appendChild(_offscreenInputEl);

  return _offscreenInputEl;
}

export const measureText = (
  text: string,
  fontName: string,
  fontSize: number,
  fontWeight: number,
  strokeWidth: number = 0
) => {
  const offscreenInputEl = getOffscreenInput();

  offscreenInputEl.style.fontFamily = fontName;
  offscreenInputEl.style.fontSize = `${fontSize}px`;
  offscreenInputEl.style.fontWeight = `${fontWeight}`;
  if(strokeWidth) {
    offscreenInputEl.style.paintOrder ='stroke fill';
    offscreenInputEl.style.webkitTextStroke =`${strokeWidth}px black`;
  }

  offscreenInputEl.innerText = text;

  const width = offscreenInputEl.clientWidth + strokeWidth;
  const height = offscreenInputEl.clientHeight + strokeWidth * 2;

  return {
    width,
    height
  };
};

export const renderTextLayer = async(text: string, layer: TextLayer): Promise<ImageElementTextureSource> => {
  const {width, height, fontBoundingBoxDescent} = measureCanvasText(text, layer.fontName, layer.fontSize, layer.fontWeight);
  const ratio = window.devicePixelRatio || 1;
  const canvas = new OffscreenCanvas((width + layer.padding * 2) * ratio, (height + layer.padding * 2) * ratio);
  const ctx = canvas.getContext('2d') as OffscreenCanvasRenderingContext2D;
  ctx.scale(ratio, ratio);

  const fontStyle = getCanvas2DFontStyle(layer);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if(layer.style === TextStyle.stroke) {
    ctx.beginPath();
    ctx.font = fontStyle;
    ctx.lineWidth = layer.strokeWidth;
    ctx.strokeStyle = anyColorToHexColor(layer.strokeColor);
    ctx.strokeText(text, 0, height - layer.strokeWidth);
    ctx.fillStyle = anyColorToHexColor(layer.color);
    ctx.fillText(text, 0, height - layer.strokeWidth);
    ctx.stroke();
    ctx.fill();
  } else if(layer.style === TextStyle.fill) {
    ctx.beginPath();
    ctx.font = fontStyle;
    ctx.fillStyle = anyColorToHexColor(layer.color);
    ctx.fillText(text, 0, height);
    ctx.fill();
  } else if(layer.style === TextStyle.fill_inverse) {
    ctx.beginPath();
    ctx.font = fontStyle;
    ctx.fillStyle = anyColorToHexColor(layer.color);
    ctx.roundRect(
      0,
      0,
      width + layer.padding * 2,
      height + layer.padding * 2,
      layer.borderRadius);
    ctx.fill();
    ctx.fillStyle = anyColorToHexColor(layer.secondColor);
    ctx.fillText(text, layer.padding, height + layer.padding - fontBoundingBoxDescent);
  }

  return createImageElementTextureSource(canvas);
}

export const getTextLayerInputElementStyles = (text: string, layer: TextLayer, placeholder: string = '') => {
  const {width, height} = measureCanvasText(text || placeholder, layer.fontName, layer.fontSize, layer.fontWeight, layer.style === TextStyle.stroke ? layer.strokeWidth : 0);

  const baseStyle = {
    'border': 'none',
    'outline': 'none',
    'width': `${width}px`,
    'height': `${height}px`,
    'font-family': layer.fontName,
    'font-size': `${layer.fontSize}px`,
    'font-weight': `${layer.fontWeight}`,
    'line-height': `${layer.fontSize}px`,
    'text-align': layer.alignment,
    'box-sizing': 'content-box',
    'padding': `${layer.padding}px`
  };

  if(layer.style === TextStyle.fill) {
    return {
      ...baseStyle,
      color: anyColorToHexColor(layer.color)
    }
  }

  if(layer.style === TextStyle.stroke) {
    return {
      ...baseStyle,
      'paint-order': 'stroke fill',
      '-webkit-text-stroke': `${layer.strokeWidth}px ${anyColorToHexColor(layer.strokeColor)}`,
      'color': anyColorToHexColor(layer.color)
    }
  }

  return {
    ...baseStyle,
    'color': anyColorToHexColor(layer.secondColor),
    'background-color': anyColorToHexColor(layer.color),
    'border-radius': `${layer.borderRadius}px`
  };
};
