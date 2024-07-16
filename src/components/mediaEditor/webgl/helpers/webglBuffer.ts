import {CompatibleWebGLRenderingContext} from '../webglContext';

export interface CreateWebGlBufferParams {
  location: number;
  size: GLint;
  type?: GLenum;
  normalized?: GLboolean;
  stride?: GLsizei;
  offset?: GLintptr;
}

export interface WebGlBuffer {
  buffer: WebGLBuffer;
  location: number;
  bufferData(data: Float32Array | Uint8ClampedArray): void;
}

/**
 * Creates instance of WebglBuffer. Usually web buffer definition and initialzation is a boilerplate.
 * This function helps to create a facade object API to cover it.
 */
export function createWebGlBuffer(gl: CompatibleWebGLRenderingContext, params: CreateWebGlBufferParams): WebGlBuffer {
  const buffer = gl.createBuffer();

  gl.enableVertexAttribArray(params.location);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.vertexAttribPointer(
    params.location,
    params.size,
    params.type || gl.FLOAT,
    params.normalized || false,
    params.stride || 0,
    params.offset || 0
  );
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return {
    buffer,
    location: params.location,
    bufferData(data: Float32Array) {
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }
  };
}
