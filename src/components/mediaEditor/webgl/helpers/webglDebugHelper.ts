import {IS_MOBILE} from '../../../../environment/userAgent';
import {CompatibleWebGLRenderingContext} from '../webglContext';
import {WEBGL_DEBUG_MODE} from '../../consts';

export function showErrorIfExist(gl: CompatibleWebGLRenderingContext, step: string) {
  if(!IS_MOBILE || !WEBGL_DEBUG_MODE) {
    return;
  }

  const glError = gl.getError();

  if(glError) {
    let div = document.getElementById('#webgl-error');
    if(!div) {
      div = document.createElement('div');
      div.id = '#webgl-error';
    }
    div.innerText = div.innerText + `Step: ${step}\nGL ERROR: ${glError}\n\n`;
    div.style.position = 'fixed';
    div.style.fontSize = '16px';
    div.style.color = 'red';
    div.style.top = 'calc(50% - 150px)';
    div.style.left = 'calc(50% - 150px)';
    div.style.zIndex = '999999';
    div.style.width = '300px';
    div.style.height = '300px';
    div.style.background = 'white';
    document.body.appendChild(div);
  }
}
