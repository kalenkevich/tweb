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
  fontWeight: number,
  extraPadding: number = 0
) => {
  const canvas = getOffscreenCanvas();
  const ctx = canvas.getContext('2d') as OffscreenCanvasRenderingContext2D;
  ctx.font = getCanvas2DFontStyle({fontName, fontSize, fontWeight});
  const metrics = ctx.measureText(text);
  // Mozilla linux 115 do not support fontBoundingBoxAscent and fontBoundingBoxDescent props.
  const actualHeight = (metrics.fontBoundingBoxAscent || metrics.actualBoundingBoxAscent) + (metrics.fontBoundingBoxDescent || metrics.actualBoundingBoxDescent);

  return {
    actualBoundingBoxAscent: metrics.actualBoundingBoxAscent,
    actualBoundingBoxDescent: metrics.actualBoundingBoxDescent,
    actualBoundingBoxLeft: metrics.actualBoundingBoxLeft,
    actualBoundingBoxRight: metrics.actualBoundingBoxRight,
    fontBoundingBoxAscent: metrics.fontBoundingBoxAscent,
    fontBoundingBoxDescent: metrics.fontBoundingBoxDescent,
    width: metrics.width + extraPadding * 2,
    height: actualHeight + extraPadding * 2
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

export const getImageFromCanvas = async(canvas: HTMLCanvasElement | OffscreenCanvas): Promise<HTMLImageElement> => {
  if((canvas as HTMLCanvasElement).toDataURL) {
    const img = new Image();
    img.src = (canvas as HTMLCanvasElement).toDataURL();

    return Promise.resolve(img);
  }

  // @ts-ignore
  const blob = await canvas[canvas.convertToBlob ? 'convertToBlob' : 'toBlob']();
  const img = new Image();
  img.src = URL.createObjectURL(blob);

  return img;
}

export const getCanvas2DFontStyle = (options: {
  fontName: string;
  fontSize: number;
  fontWeight:number
}) => `${options.fontWeight} ${options.fontSize}px "${options.fontName}"`;
