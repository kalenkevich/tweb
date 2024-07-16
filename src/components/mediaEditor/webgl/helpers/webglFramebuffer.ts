import {CompatibleWebGLRenderingContext} from '../webglContext';
import {WebGlTexture} from './webglTexture';

export interface CreateFrameBufferOptions {
  texture: WebGlTexture;
  attachmentPoint?: number;
}

export interface WebGlFrameBuffer {
  framebuffer: WebGLFramebuffer;
  bind(): void;
  unbind(): void;
  clear(color?: [number, number, number, number]): void;
  getTexture(): WebGlTexture;
}

export function createFrameBuffer(
  gl: CompatibleWebGLRenderingContext,
  options: CreateFrameBufferOptions
): WebGlFrameBuffer {
  const framebuffer = gl.createFramebuffer();

  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    options.texture.texture,
    options.texture.level
  );
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  return {
    framebuffer,
    bind() {
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    },
    unbind() {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    },
    getTexture(): WebGlTexture {
      return options.texture;
    },
    clear(color?: [number, number, number, number]) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

      if(color) {
        gl.clearColor(...color);
      } else {
        // default is white
        gl.clearColor(1, 1, 1, 1);
      }
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
  };
}
