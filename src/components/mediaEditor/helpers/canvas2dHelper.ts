let _offscreenCanvasEl: OffscreenCanvas;

const getOffscreenCanvas = () => {
  if(_offscreenCanvasEl) {
    return _offscreenCanvasEl;
  }

  return _offscreenCanvasEl = new OffscreenCanvas(window.innerWidth, window.innerHeight);
}
export const measureText = (
  text: string,
  fontName: string,
  fontSize: number,
  fontWeight: number
) => {
  const canvas = getOffscreenCanvas();
  const ctx = canvas.getContext('2d') as OffscreenCanvasRenderingContext2D;
  ctx.font = getCanvas2DFontStyle({fontName, fontSize, fontWeight});
  const metrics = ctx.measureText(text);
  const actualHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;

  return {
    width: metrics.width,
    height: actualHeight
  };
};

export const resizeCanvas = (canvasEl: HTMLCanvasElement, width: number, height: number) => {
  const ratio = window.devicePixelRatio || 1;
  canvasEl.width = width * ratio;
  canvasEl.height = height * ratio;
  canvasEl.style.width = canvasEl.width / ratio + 'px';
  canvasEl.style.height = canvasEl.height / ratio + 'px';
  canvasEl.getContext('2d').scale(ratio, ratio);
};

export const getImageFromCanvas = (canvas: HTMLCanvasElement): HTMLImageElement => {
  const img = new Image();
  img.src = canvas.toDataURL();

  return img
}

export const getCanvas2DFontStyle = ({fontName, fontSize, fontWeight}: {fontName: string; fontSize: number; fontWeight:number}) => `${fontWeight} ${fontSize}px "${fontName}"`;
