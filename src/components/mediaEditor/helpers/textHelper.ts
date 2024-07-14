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
