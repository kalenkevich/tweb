import {BaseWebglProgram, SHADER_CLIP_UTILS, SHADER_MAT_UTILS} from './baseProgram';
import {CompatibleWebGLRenderingContext} from '../webglContext';
import {WebGlUniform, createWebGlUniform} from '../helpers/webglUniform';
import {WebGlBuffer, createWebGlBuffer} from '../helpers/webglBuffer';
import {WebGlTexture, createWebGlTexture, TextureSourceType} from '../helpers/webglTexture';
import {ImageDrawObject} from '../drawObject/imageDrawObject';

const ImageShaders = {
  vertext: `
    precision highp float;

    ${SHADER_CLIP_UTILS}
    ${SHADER_MAT_UTILS}

    uniform mat3 u_matrix;
    uniform float u_width;
    uniform float u_height;

    attribute vec2 a_position;
    attribute vec2 a_texCoord;
    attribute vec4 a_color;

    varying vec2 v_texCoord;
    varying vec4 v_color;

    void main() {
      v_texCoord = a_texCoord;
      v_color = a_color;

      vec2 resolution = vec2(u_width, u_height);
      vec2 coords = (u_matrix * vec3(a_position, 1)).xy;
      vec2 scaled = coords / resolution;
      vec2 clipped = clipSpace(scaled);

      gl_Position = vec4(clipped, 0.0, 1.0);
    }
  `,
  fragment: `
    precision highp float;

    uniform sampler2D u_texture;
    varying vec2 v_texCoord;

    void main() {
      gl_FragColor = texture2D(u_texture, v_texCoord);
    }
  `
};

export class ImageProgram extends BaseWebglProgram {
  private currentTextureId: number;
  // Uniforms
  protected textureUniform: WebGlUniform;
  protected textureSizeUniform: WebGlUniform;

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

    this.positionBuffer = createWebGlBuffer(gl, {location: 0, size: 2});
    this.textcoordBuffer = createWebGlBuffer(gl, {location: 1, size: 2});

    gl.bindVertexArray(null);
  }

  protected setupUniforms() {
    super.setupUniforms();
    this.textureUniform = createWebGlUniform(this.gl, {name: 'u_texture', program: this.program});
    this.textureSizeUniform = createWebGlUniform(this.gl, {name: 'u_textureSize', program: this.program});
  }

  setupTextures() {
    const gl = this.gl;

    this.texture = createWebGlTexture(gl, {
      name: 'layer_image',
      // image flipping handled by space clipping inside the shader.
      // flipY: true,
      premultiplyAlpha: true,
      wrapS: gl.CLAMP_TO_EDGE,
      wrapT: gl.CLAMP_TO_EDGE,
      minFilter: gl.LINEAR,
      magFilter: gl.LINEAR,
      format: gl.RGBA,
      internalFormat: gl.RGBA
    });
  }

  draw(imageDrawObject: ImageDrawObject): void {
    const gl = this.gl;

    gl.bindVertexArray(this.vao);

    this.textureUniform.setInteger(this.texture.index);
    this.texture.bind();

    // Cache the image.
    if(imageDrawObject.texture.id !== this.currentTextureId) {
      if(imageDrawObject.texture.type === TextureSourceType.IMAGE_BITMAP ||
        imageDrawObject.texture.type === TextureSourceType.IMAGE_DATA ||
        imageDrawObject.texture.type === TextureSourceType.IMAGE_ELEMENT
      ) {
        this.texture.setSource(imageDrawObject.texture);
      } else {
        this.texture.setPixels(imageDrawObject.texture);
      }
      this.currentTextureId = imageDrawObject.texture.id;
    }

    this.textureSizeUniform.setVector2([imageDrawObject.texture.width, imageDrawObject.texture.height]);

    this.positionBuffer.bufferData(imageDrawObject.vertecies.buffer);
    this.textcoordBuffer.bufferData(imageDrawObject.textcoords.buffer);

    gl.drawArrays(gl.TRIANGLES, 0, imageDrawObject.numElements);

    this.texture.unbind();
    gl.bindVertexArray(null);
  }
}
