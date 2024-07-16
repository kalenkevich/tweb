
import {BaseWebglProgram} from './baseProgram';
import {CompatibleWebGLRenderingContext} from '../webglContext';
import {WebGlBuffer, createWebGlBuffer} from '../helpers/webglBuffer';
import {WebGlTexture} from '../helpers/webglTexture';

const FramebufferShaders = {
  vertext: `
    attribute vec4 a_position;
    attribute vec2 a_texCoord;
    varying vec2 v_texCoord;

    void main() {
      v_texCoord = a_texCoord;
      v_texCoord.y = 1.0 - v_texCoord.y;
      gl_Position = a_position;
    }
  `,
  fragment: `
    precision mediump float;

    uniform sampler2D u_texture;
    varying vec2 v_texCoord;
    
    void main() {
      gl_FragColor = texture2D(u_texture, v_texCoord);
    }
  `
};

const POSITION_DATA = new Float32Array([-1, 1, -1, -1, 1, 1, -1, -1, 1, 1, 1, -1]);
const TEXTURE_DATA = new Float32Array([0, 0, 0, 1, 1, 0, 0, 1, 1, 0, 1, 1]);

export class FramebufferProgram extends BaseWebglProgram {
  protected positionBuffer: WebGlBuffer;
  protected textcoordBuffer: WebGlBuffer;

  protected u_textureLocation: WebGLUniformLocation;

  constructor(
    protected readonly gl: CompatibleWebGLRenderingContext,
    protected readonly vertexShaderSource: string = FramebufferShaders.vertext,
    protected readonly fragmentShaderSource: string = FramebufferShaders.fragment
  ) {
    super(gl, vertexShaderSource, fragmentShaderSource);
  }

  protected setupBuffer() {
    const gl = this.gl;

    gl.bindVertexArray(this.vao);

    this.positionBuffer = createWebGlBuffer(this.gl, {location: 0, size: 2});
    this.positionBuffer.bufferData(POSITION_DATA);
    this.textcoordBuffer = createWebGlBuffer(this.gl, {location: 1, size: 2});
    this.textcoordBuffer.bufferData(TEXTURE_DATA);

    gl.bindVertexArray(null);
  }

  protected setupUniforms() {
    super.setupUniforms();
    this.u_textureLocation = this.gl.getUniformLocation(this.program, 'u_texture');
  }

  public async onInit(): Promise<void> {}

  onLink(): void {
    const gl = this.gl;

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  }

  onUnlink(): void {
    const gl = this.gl;

    gl.disable(gl.BLEND);
  }

  drawObjectGroup(): void {}

  draw(texture: WebGlTexture) {
    const gl = this.gl;

    gl.bindVertexArray(this.vao);

    texture.bind();
    this.gl.uniform1i(this.u_textureLocation, texture.index);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
    texture.unbind();

    gl.bindVertexArray(null);
  }
}
