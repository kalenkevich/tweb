import {BaseWebglProgram, SHADER_CLIP_UTILS, SHADER_MAT_UTILS} from './baseProgram';
import {CompatibleWebGLRenderingContext} from '../webglContext';
import {WebGlUniform, createWebGlUniform} from '../helpers/webglUniform';
import {WebGlBuffer, createWebGlBuffer} from '../helpers/webglBuffer';
import {WebGlTexture, createWebGlTexture, TextureSourceType} from '../helpers/webglTexture';
import {ImageDrawObject} from '../drawObject/imageDrawObject';
import {ImageFilterState, IMAGE_FILTER_NAMES} from '../../types';

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
      vec2 coords = a_position.xy / resolution;

      gl_Position = vec4(clipSpace(coords), 0.0, 1.0);
    }
  `,
  fragment: `
    precision mediump float;
    struct ImageFilter {
      float enhance;
      float brightness;
      float contrast;
      float saturation;
      float warmth;
      float fade;
      float highlights;
      float shadows;
      float vignette;
      float grain;
      float sharpen;
    };

    uniform sampler2D u_texture;
    uniform vec2 u_textureSize;
    uniform ImageFilter u_filter;

    vec3 brightness(vec3 color, float brightness) {
      return color + brightness;
    }
      
    vec3 contrast(vec3 color, float contrast) {
      return 0.5 + (contrast + 1.0) * (color.rgb - 0.5);
    }

    vec3 saturation(vec3 color, float saturation) {
      // WCAG 2.1 relative luminance base
      const vec3 luminanceWeighting = vec3(0.2126, 0.7152, 0.0722);
      vec3 grayscaleColor = vec3(dot(color, luminanceWeighting));
      return mix(grayscaleColor, color, 1.0 + saturation);
    }

    vec3 shadowsHighlights(vec3 color, float shadows, float highlights) {
      const vec3 luminanceWeighting = vec3(0.3, 0.3, 0.3);
      mediump float luminance = dot(color, luminanceWeighting);

      mediump float shadow = clamp((pow(luminance, 1.0 / (shadows + 1.0)) + (-0.76) * pow(luminance, 2.0 / (shadows + 1.0))) - luminance, 0.0, 1.0);
      mediump float highlight = clamp((1.0 - (pow(1.0 - luminance, 1.0 / (1.0 - highlights)) + (-0.8) * pow(1.0 - luminance, 2.0 / (1.0 - highlights)))) - luminance, -1.0, 0.0);
      lowp vec3 result = vec3(0.0, 0.0, 0.0) + ((luminance + shadow + highlight) - 0.0) * ((color - vec3(0.0, 0.0, 0.0)) / (luminance - 0.0));

      return result;
    }

    vec3 warmthTint(vec3 color, float warmth, float tint) {
      const vec3 warmFilter = vec3(0.93, 0.54, 0.0);
      const mat3 RGBtoYIQ = mat3(0.299, 0.587, 0.114, 0.596, -0.274, -0.322, 0.212, -0.523, 0.311);
      const mat3 YIQtoRGB = mat3(1.0, 0.956, 0.621, 1.0, -0.272, -0.647, 1.0, -1.105, 1.702);

      // adjusting tint
      vec3 yiq = RGBtoYIQ * color;
      yiq.b = clamp(yiq.b + tint * 0.5226 * 0.1, -0.5226, 0.5226);
      vec3 rgb = YIQtoRGB * yiq;

      // adjusting warmth
      vec3 processed = vec3(
        (rgb.r < 0.5 ? (2.0 * rgb.r * warmFilter.r) : (1.0 - 2.0 * (1.0 - rgb.r) * (1.0 - warmFilter.r))),
        (rgb.g < 0.5 ? (2.0 * rgb.g * warmFilter.g) : (1.0 - 2.0 * (1.0 - rgb.g) * (1.0 - warmFilter.g))),
        (rgb.b < 0.5 ? (2.0 * rgb.b * warmFilter.b) : (1.0 - 2.0 * (1.0 - rgb.b) * (1.0 - warmFilter.b)))
      );

      return mix(rgb, processed, warmth);
    }

    vec3 vignette(vec3 color, vec2 coord, float vignette, float size) {
      float dist = distance(coord, vec2(0.5, 0.5));

      return color *= smoothstep(0.8, size * 0.799, dist * (vignette + size));
    }

    // vec3 sharpen(float sharpen) {
    //   vec2 onePixel = vec2(1.0, 1.0) / u_textureSize;
    //   float sharpen_kernel[9] = float[9](0.0, -1.0, 0, -1.0, 1.0, -1.0, 0, -1.0, 0);
    //   vec4 colorSum =
    //     texture2D(u_texture, v_texCoord + onePixel * vec2(-1, -1)) * sharpen_kernel[0] +
    //     texture2D(u_texture, v_texCoord + onePixel * vec2( 0, -1)) * sharpen_kernel[1] * sharpen +
    //     texture2D(u_texture, v_texCoord + onePixel * vec2( 1, -1)) * sharpen_kernel[2] +
    //     texture2D(u_texture, v_texCoord + onePixel * vec2(-1,  0)) * sharpen_kernel[3] * sharpen +
    //     texture2D(u_texture, v_texCoord + onePixel * vec2( 0,  0)) * sharpen_kernel[4] + 4 * sharpen +
    //     texture2D(u_texture, v_texCoord + onePixel * vec2( 1,  0)) * sharpen_kernel[5] * sharpen +
    //     texture2D(u_texture, v_texCoord + onePixel * vec2(-1,  1)) * sharpen_kernel[6] +
    //     texture2D(u_texture, v_texCoord + onePixel * vec2( 0,  1)) * sharpen_kernel[7] * sharpen +
    //     texture2D(u_texture, v_texCoord + onePixel * vec2( 1,  1)) * sharpen_kernel[8];

    //    return (colorSum / 1.0).rgb;
    // }

    varying vec2 v_texCoord;
    varying vec4 v_color;
    
    void main() {
      vec4 color = texture2D(u_texture, v_texCoord);

      color.rgb = brightness(color.rgb, u_filter.brightness);
      color.rgb = contrast(color.rgb, u_filter.contrast);
      color.rgb = saturation(color.rgb, u_filter.saturation);
      color.rgb = shadowsHighlights(color.rgb, u_filter.shadows, u_filter.highlights);
      color.rgb = warmthTint(color.rgb, u_filter.warmth, 0.0);
      color.rgb = vignette(color.rgb, v_texCoord, u_filter.vignette, 0.0);
      // color.rgb = sharpen(u_filter.sharpen);

      gl_FragColor = color;
    }
  `
};

export class ImageProgram extends BaseWebglProgram {
  // Uniforms
  protected textureUniform: WebGlUniform;
  protected textureSizeUniform: WebGlUniform;

  // Attributes
  protected textcoordBuffer: WebGlBuffer;
  protected propertiesBuffer: WebGlBuffer;

  protected imageFilterUnifroms: {
    [key: string]: WebGlUniform;
  } = {};

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
    for(const name of IMAGE_FILTER_NAMES) {
      this.imageFilterUnifroms[name] = createWebGlUniform(this.gl, {
        name: `u_filter.${name}`,
        program: this.program
      });
    }
  }

  setFilter(filter: ImageFilterState) {
    for(const [name, value] of Object.entries(filter)) {
      this.imageFilterUnifroms[name].setFloat(value);
    }
  }

  setTextureSize(width: number, height: number) {

  }

  async setupTextures() {
    const gl = this.gl;

    this.texture = createWebGlTexture(gl, {
      name: 'image',
      // image flipping handled by space clipping inside the shader.
      // flipY: true,
      wrapS: gl.CLAMP_TO_EDGE,
      wrapT: gl.CLAMP_TO_EDGE,
      minFilter: gl.LINEAR,
      magFilter: gl.LINEAR,
      format: gl.RGB,
      internalFormat: gl.RGB
    });
  }

  draw(imageDrawObject: ImageDrawObject): void {
    const gl = this.gl;

    gl.bindVertexArray(this.vao);

    this.textureUniform.setInteger(this.texture.index);
    this.texture.bind();
    if(imageDrawObject.texture.type === TextureSourceType.IMAGE_BITMAP ||
      imageDrawObject.texture.type === TextureSourceType.IMAGE_DATA ||
      imageDrawObject.texture.type === TextureSourceType.IMAGE_ELEMENT
    ) {
      this.texture.setSource(imageDrawObject.texture);
    } else {
      this.texture.setPixels(imageDrawObject.texture);
    }
    this.textureSizeUniform.setVector2([imageDrawObject.texture.width, imageDrawObject.texture.height]);

    this.positionBuffer.bufferData(imageDrawObject.vertecies.buffer);
    this.textcoordBuffer.bufferData(imageDrawObject.textcoords.buffer);

    gl.drawArrays(gl.TRIANGLES, 0, imageDrawObject.numElements);

    this.texture.unbind();
    gl.bindVertexArray(null);
  }
}
