
import {BaseWebglProgram, SHADER_CLIP_UTILS, SHADER_MAT_UTILS} from './baseProgram';
import {CompatibleWebGLRenderingContext} from '../webglContext';
import {WebGlBuffer, createWebGlBuffer} from '../helpers/webglBuffer';
import {WebGlTexture} from '../helpers/webglTexture';

const FramebufferShaders = {
  vertext: `#version 300 es
    precision highp float;

    ${SHADER_CLIP_UTILS}
    ${SHADER_MAT_UTILS}

    in vec2 a_position;
    in vec2 a_texCoord;
    out vec2 v_texCoord;

    uniform mat3 u_matrix;
    uniform float u_width;
    uniform float u_height;

    void main() {
      v_texCoord = a_texCoord;
      v_texCoord.y = 1.0 - v_texCoord.y;

      vec2 resolution = vec2(u_width, u_height);
      vec2 coords = (u_matrix * vec3(a_position, 1)).xy;
      vec2 scaled = coords / resolution;
      vec2 clipped = clipSpace(scaled);

      gl_Position = vec4(clipped, 0.0, 1.0);
    }
  `,
  fragment: `#version 300 es
    precision mediump float;

    uniform sampler2D u_texture;
    in vec2 v_texCoord;

    out vec4 fragColor;
    
    void main() {
      fragColor = texture(u_texture, v_texCoord);
    }
  `
};

const TEXTURE_DATA = new Float32Array([
  0, 0,
  1, 0,
  0, 1,
  0, 1,
  1, 0,
  1, 1
]);

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

    this.positionBuffer.bufferData(new Float32Array([
      0, 0,
      texture.width, 0,
      0, texture.height,
      0, texture.height,
      texture.width, 0,
      texture.width, texture.height
    ]));

    texture.bind();
    this.gl.uniform1i(this.u_textureLocation, texture.index);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
    texture.unbind();

    gl.bindVertexArray(null);
  }
}
