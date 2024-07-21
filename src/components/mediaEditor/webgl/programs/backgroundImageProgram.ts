import {BaseWebglProgram, SHADER_CLIP_UTILS, SHADER_MAT_UTILS} from './baseProgram';
import {CompatibleWebGLRenderingContext} from '../webglContext';
import {WebGlUniform, createWebGlUniform} from '../helpers/webglUniform';
import {WebGlBuffer, createWebGlBuffer} from '../helpers/webglBuffer';
import {WebGlFrameBuffer, createFrameBuffer} from '../helpers/webglFramebuffer';
import {WebGlTexture, createWebGlTexture, TextureSourceType} from '../helpers/webglTexture';
import {ImageDrawObject} from '../drawObject/imageDrawObject';
import {ImageFilterState, IMAGE_FILTER_NAMES} from '../../types';

const BackgroundImageShaders = {
  vertext: `#version 300 es
    precision highp float;

    ${SHADER_CLIP_UTILS}
    ${SHADER_MAT_UTILS}

    uniform mat3 u_matrix;
    uniform float u_width;
    uniform float u_height;

    in vec2 a_position;
    in vec2 a_texCoord;

    out vec2 v_texCoord;

    void main() {
      v_texCoord = a_texCoord;

      vec2 resolution = vec2(u_width, u_height);
      vec2 coords = (u_matrix * vec3(a_position, 1)).xy;
      vec2 scaled = coords / resolution;
      vec2 clipped = clipSpace(scaled);

      gl_Position = vec4(clipped, 0.0, 1.0);
    }
  `,
  fragment: `#version 300 es
    precision highp float;

    struct ImageFilter {
      float sharpness;
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
      float blur;
    };

    uniform float u_width;
    uniform float u_height;
    uniform sampler2D u_texture;
    uniform vec2 u_textureSize;
    uniform ImageFilter u_filter;

    in vec2 v_texCoord;
    in vec4 v_color;

    out vec4 fragColor;

    float rand(vec2 co){
      return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
    }

    vec3 brightness(vec3 color, float brightness) {
      return color + brightness;
    }
      
    vec3 contrast(vec3 color, float contrast) {
      return 0.5 + (contrast + 1.0) * (color.rgb - 0.5);
    }

    vec3 fade(vec3 color, float fade) {
      return mix(color, vec3(0.0, 0.0, 0.0), fade);
    }

    vec3 saturation(vec3 color, float saturation) {
      // WCAG 2.1 relative luminance base
      const vec3 luminanceWeighting = vec3(0.2126, 0.7152, 0.0722);
      vec3 grayscaleColor = vec3(dot(color, luminanceWeighting));
      return mix(grayscaleColor, color, 1.0 + saturation);
    }

    vec3 highlights(vec3 color, float highlights) {
      const float a = 1.357697966704323E-01;
      const float b = 1.006045552016985E+00;
      const float c = 4.674339906510876E-01;
      const float d = 8.029414702292208E-01;
      const float e = 1.127806558508491E-01;

      float maxx = max(color.r, max(color.g, color.b));
      float minx = min(color.r, min(color.g, color.b));
      float lum = (maxx+minx)/2.0;
      float x1 = abs(highlights);
      float x2 = lum;
      float lum_new =  lum < 0.5 ? lum : lum+ a * sign(highlights) * exp(-0.5 * (((x1-b)/c)*((x1-b)/c) + ((x2-d)/e)*((x2-d)/e)));

      return vec3(color * lum_new / lum);
    }

    vec3 shadows(vec3 color, float shadows) {
      const float highlights = 0.0;
      const vec3 luminanceWeighting = vec3(0.3, 0.3, 0.3);
      mediump float luminance = dot(color, luminanceWeighting);
      shadows += 1.0;

      mediump float shadow = clamp((pow(luminance, 1.0/shadows) + (-0.76)*pow(luminance, 2.0/shadows)) - luminance, 0.0, 1.0);
      mediump float highlight = clamp((1.0 - (pow(1.0-luminance, 1.0/(2.0-highlights)) + (-0.8)*pow(1.0-luminance, 2.0/(2.0-highlights)))) - luminance, -1.0, 0.0);
      lowp vec3 result = vec3(0.0, 0.0, 0.0) + ((luminance + shadow + highlight) - 0.0) * ((color.rgb - vec3(0.0, 0.0, 0.0))/(luminance - 0.0));

      // blend toward white if highlights is more than 1
      mediump float contrastedLuminance = ((luminance - 0.5) * 1.5) + 0.5;
      mediump float whiteInterp = contrastedLuminance*contrastedLuminance*contrastedLuminance;
      mediump float whiteTarget = clamp(highlights, 1.0, 2.0) - 1.0;
      result = mix(result, vec3(1.0), whiteInterp*whiteTarget);

      // blend toward black if shadows is less than 1
      mediump float invContrastedLuminance = 1.0 - contrastedLuminance;
      mediump float blackInterp = invContrastedLuminance*invContrastedLuminance*invContrastedLuminance;
      mediump float blackTarget = 1.0 - clamp(shadows, 0.0, 1.0);
      result = mix(result, vec3(0.0), blackInterp*blackTarget);

      return result.rgb;
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

    vec4 vignette(vec4 color, vec2 uv, float vignette) {
      float d = length(uv - 0.5) * -1.0;
      vec4 overlay = vec4(d, d, d, vignette);

      return mix(color, overlay, overlay.a);
    }

    vec4 grain(vec4 fragColor, vec2 uv, float grain) {
      vec4 color = fragColor;
      float diff = (rand(uv) - 0.0) * grain;
      color.r += diff;
      color.g += diff;
      color.b += diff;

      return mix(fragColor, color, color.a);
    }

    vec4 sharpen(vec4 color, float sharpen) {
      float u_sharpen_kernel[9];
      u_sharpen_kernel[0] = -1.0;
      u_sharpen_kernel[1] = -1.0;
      u_sharpen_kernel[2] = -1.0;
      u_sharpen_kernel[3] = -1.0;
      u_sharpen_kernel[4] = 9.0;
      u_sharpen_kernel[5] = -1.0;
      u_sharpen_kernel[6] = -1.0;
      u_sharpen_kernel[7] = -1.0;
      u_sharpen_kernel[8] = -1.0;

      vec2 onePixel = vec2(1.0, 1.0) / u_textureSize;
      vec4 colorSum =
       texture(u_texture, v_texCoord + onePixel * vec2(-1, -1)) * u_sharpen_kernel[0] +
       texture(u_texture, v_texCoord + onePixel * vec2( 0, -1)) * u_sharpen_kernel[1] +
       texture(u_texture, v_texCoord + onePixel * vec2( 1, -1)) * u_sharpen_kernel[2] +
       texture(u_texture, v_texCoord + onePixel * vec2(-1,  0)) * u_sharpen_kernel[3] +
       texture(u_texture, v_texCoord + onePixel * vec2( 0,  0)) * u_sharpen_kernel[4] +
       texture(u_texture, v_texCoord + onePixel * vec2( 1,  0)) * u_sharpen_kernel[5] +
       texture(u_texture, v_texCoord + onePixel * vec2(-1,  1)) * u_sharpen_kernel[6] +
       texture(u_texture, v_texCoord + onePixel * vec2( 0,  1)) * u_sharpen_kernel[7] +
       texture(u_texture, v_texCoord + onePixel * vec2( 1,  1)) * u_sharpen_kernel[8] ;

      return mix(color, colorSum, sharpen);
    }

    vec4 sharpness(vec4 color, float sharpness) {
      float u_sharpness_kernel[9];
      u_sharpness_kernel[0] = 0.0;
      u_sharpness_kernel[1] = -1.0;
      u_sharpness_kernel[2] = 0.0;
      u_sharpness_kernel[3] = -1.0;
      u_sharpness_kernel[4] = 5.0;
      u_sharpness_kernel[5] = -1.0;
      u_sharpness_kernel[6] = 0.0;
      u_sharpness_kernel[7] = -1.0;
      u_sharpness_kernel[8] = 0.0;

      vec2 onePixel = vec2(1.0, 1.0) / u_textureSize;
      vec4 colorSum =
        texture(u_texture, v_texCoord + onePixel * vec2(-1, -1)) * u_sharpness_kernel[0] +
        texture(u_texture, v_texCoord + onePixel * vec2( 0, -1)) * u_sharpness_kernel[1] +
        texture(u_texture, v_texCoord + onePixel * vec2( 1, -1)) * u_sharpness_kernel[2] +
        texture(u_texture, v_texCoord + onePixel * vec2(-1,  0)) * u_sharpness_kernel[3] +
        texture(u_texture, v_texCoord + onePixel * vec2( 0,  0)) * u_sharpness_kernel[4] +
        texture(u_texture, v_texCoord + onePixel * vec2( 1,  0)) * u_sharpness_kernel[5] +
        texture(u_texture, v_texCoord + onePixel * vec2(-1,  1)) * u_sharpness_kernel[6] +
        texture(u_texture, v_texCoord + onePixel * vec2( 0,  1)) * u_sharpness_kernel[7] +
        texture(u_texture, v_texCoord + onePixel * vec2( 1,  1)) * u_sharpness_kernel[8] ;

      return mix(color, colorSum, sharpness);
    }

    vec4 blur(vec4 color, float blur) {
      vec2 onePixel = vec2(1.0, 1.0) / u_textureSize;
      vec4 colorSum =
        texture(u_texture, v_texCoord + vec2(-7.0*onePixel.x, -7.0*onePixel.y))*0.0044299121055113265 +
        texture(u_texture, v_texCoord + vec2(-6.0*onePixel.x, -6.0*onePixel.y))*0.00895781211794 +
        texture(u_texture, v_texCoord + vec2(-5.0*onePixel.x, -5.0*onePixel.y))*0.0215963866053 +
        texture(u_texture, v_texCoord + vec2(-4.0*onePixel.x, -4.0*onePixel.y))*0.0443683338718 +
        texture(u_texture, v_texCoord + vec2(-3.0*onePixel.x, -3.0*onePixel.y))*0.0776744219933 +
        texture(u_texture, v_texCoord + vec2(-2.0*onePixel.x, -2.0*onePixel.y))*0.115876621105 +
        texture(u_texture, v_texCoord + vec2(-1.0*onePixel.x, -1.0*onePixel.y))*0.147308056121 +
        texture(u_texture, v_texCoord                                         )*0.159576912161 +
        texture(u_texture, v_texCoord + vec2( 1.0*onePixel.x,  1.0*onePixel.y))*0.147308056121 +
        texture(u_texture, v_texCoord + vec2( 2.0*onePixel.x,  2.0*onePixel.y))*0.115876621105 +
        texture(u_texture, v_texCoord + vec2( 3.0*onePixel.x,  3.0*onePixel.y))*0.0776744219933 +
        texture(u_texture, v_texCoord + vec2( 4.0*onePixel.x,  4.0*onePixel.y))*0.0443683338718 +
        texture(u_texture, v_texCoord + vec2( 5.0*onePixel.x,  5.0*onePixel.y))*0.0215963866053 +
        texture(u_texture, v_texCoord + vec2( 6.0*onePixel.x,  6.0*onePixel.y))*0.00895781211794 +
        texture(u_texture, v_texCoord + vec2( 7.0*onePixel.x,  7.0*onePixel.y))*0.0044299121055113265;

      return mix(color, colorSum, blur);
    }

    void main() {
      vec2 resolution = vec2(u_width, u_height);
      vec2 uv = gl_FragCoord.xy / resolution;
      vec4 color = texture(u_texture, v_texCoord);

      color = sharpness(color, u_filter.sharpness);
      color.rgb = brightness(color.rgb, u_filter.brightness);
      color.rgb = contrast(color.rgb, u_filter.contrast);
      color.rgb = saturation(color.rgb, u_filter.saturation);
      color.rgb = fade(color.rgb, u_filter.fade);
      color.rgb = shadows(color.rgb, u_filter.shadows);
      color.rgb = highlights(color.rgb, u_filter.highlights);
      color.rgb = warmthTint(color.rgb, u_filter.warmth, 0.0);
      color = vignette(color, uv, u_filter.vignette);
      color = grain(color, uv, u_filter.grain);
      color = sharpen(color, u_filter.sharpen);
      color = blur(color, u_filter.blur);

      fragColor = color;
    }
  `
};

export class BackgroundImageProgram extends BaseWebglProgram {
  private currentTextureId: number;
  // Uniforms
  protected textureUniform: WebGlUniform;
  protected textureSizeUniform: WebGlUniform;

  // Attributes
  protected positionBuffer: WebGlBuffer;
  protected textcoordBuffer: WebGlBuffer;

  protected framebuffer: WebGlFrameBuffer;
  protected framebufferTexture: WebGlTexture;

  protected imageFilterUnifroms: {
    [key: string]: WebGlUniform;
  } = {};

  // Textures
  protected texture: WebGlTexture;

  constructor(
    protected readonly gl: CompatibleWebGLRenderingContext,
    protected readonly vertexShaderSource: string = BackgroundImageShaders.vertext,
    protected readonly fragmentShaderSource: string = BackgroundImageShaders.fragment
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

  setTextureSize(width: number, height: number) {}

  setupTextures() {
    const gl = this.gl;

    this.texture = createWebGlTexture(gl, {
      name: 'image',
      // image flipping handled by space clipping inside the shader.
      // flipY: true,
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

  drawToFramebuffer(imageDrawObject: ImageDrawObject): void {
    this.framebuffer.bind();

    this.draw(imageDrawObject);

    this.framebuffer.unbind();
  }

  getFramebufferTexture(): WebGlTexture {
    return this.framebufferTexture;
  }

  resetFramebuffer(width: number, height: number) {
    this.setupFramebuffer(width, height);
  }

  clearFramebuffer() {
    this.framebuffer.clear([1, 1, 1, 0]);
  }

  setupFramebuffer(width: number, height: number) {
    const gl = this.gl;

    this.framebufferTexture = createWebGlTexture(gl, {
      name: 'background_framebuffer_texture',
      // Replace texture with a new instance but use the same texture index
      textureIndex: this.framebufferTexture?.index,
      width,
      height,
      pixels: null,
      minFilter: gl.LINEAR,
      magFilter: gl.LINEAR,
      wrapS: gl.CLAMP_TO_EDGE,
      wrapT: gl.CLAMP_TO_EDGE
    });
    this.framebuffer = createFrameBuffer(gl, {texture: [this.framebufferTexture]});
    this.clearFramebuffer();
  }
}
