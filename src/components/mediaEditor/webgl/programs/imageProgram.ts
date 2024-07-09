import {BaseWebglProgram, SHADER_CLIP_UTILS, SHADER_MAT_UTILS} from './baseProgram';
import {CompatibleWebGLRenderingContext} from '../webglContext';
import {WebGlUniform, createWebGlUniform} from '../helpers/webglUniform';
import {WebGlBuffer, createWebGlBuffer} from '../helpers/webglBuffer';
import {WebGlTexture, createWebGlTexture} from '../helpers/webglTexture';
import {ImageDrawObject} from '../drawObject/imageDrawObject';

const ImageShaders = {
  vertext: `
    precision highp float;

    ${SHADER_CLIP_UTILS}
    ${SHADER_MAT_UTILS}

    uniform mat3 u_matrix;
    uniform float u_width;
    uniform float u_height;

    attribute vec3 a_position;
    attribute vec2 a_texCoord;
    attribute vec4 a_color;

    varying vec2 v_texCoord;
    varying vec4 v_color;

    void main() {
      v_texCoord = a_texCoord;
      v_color = a_color;

      float x = a_position.x;
      float y = a_position.y;

      gl_Position = vec4(applyMatrix(u_matrix, clipSpace(vec2(x, y))), 0, 1);
    }
  `,
  fragment: `
    precision mediump float;

    uniform sampler2D u_texture;

    varying vec2 v_texCoord;
    varying vec4 v_color;
    
    void main() {
      gl_FragColor = texture2D(u_texture, v_texCoord);
    }
  `
};

export class ImageProgram extends BaseWebglProgram {
  // Uniforms
  protected textureUniform: WebGlUniform;

  // Attributes
  protected textcoordBuffer: WebGlBuffer;
  protected propertiesBuffer: WebGlBuffer;

  // Textures
  protected texture: WebGlTexture;

  constructor(
    protected readonly gl: CompatibleWebGLRenderingContext,
    protected readonly vertexShaderSource: string = ImageShaders.vertext,
    protected readonly fragmentShaderSource: string = ImageShaders.fragment
  ) {
    super(gl, vertexShaderSource, fragmentShaderSource);
  }

  onLink(): void {
    const gl = this.gl;

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.depthMask(false);
  }

  onUnlink(): void {
    const gl = this.gl;

    gl.disable(gl.BLEND);
  }

  protected setupBuffer() {
    const gl = this.gl;

    gl.bindVertexArray(this.vao);

    this.positionBuffer = createWebGlBuffer(gl, {location: 0, size: 3});
    this.textcoordBuffer = createWebGlBuffer(gl, {location: 1, size: 2});

    gl.bindVertexArray(null);
  }

  protected setupUniforms() {
    super.setupUniforms();
    this.textureUniform = createWebGlUniform(this.gl, {name: 'u_texture', program: this.program});
  }

  async setupTextures() {
    const gl = this.gl;

    this.texture = createWebGlTexture(gl, {
      name: 'image',
      width: 0,
      height: 0,
      flipY: true,
      wrapS: gl.CLAMP_TO_EDGE,
      wrapT: gl.CLAMP_TO_EDGE,
      minFilter: gl.LINEAR,
      magFilter: gl.LINEAR
    });
  }

  draw(imageDrawObject: ImageDrawObject): void {
    const gl = this.gl;

    gl.bindVertexArray(this.vao);

    this.textureUniform.setInteger(this.texture.index);
    this.texture.setPixels(imageDrawObject.texture);
    this.texture.bind();

    this.positionBuffer.bufferData(imageDrawObject.vertecies.buffer);
    this.textcoordBuffer.bufferData(imageDrawObject.textcoords.buffer);

    gl.drawArrays(gl.TRIANGLES, 0, imageDrawObject.numElements);

    this.texture.unbind();
    gl.bindVertexArray(null);
  }
}
