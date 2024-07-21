import {BrushStyle} from '../../types';
import {BaseWebglProgram, SHADER_CLIP_UTILS, SHADER_MAT_UTILS} from './baseProgram';
import {CompatibleWebGLRenderingContext} from '../webglContext';
import {WebGlBuffer, createWebGlBuffer} from '../helpers/webglBuffer';
import {VERTEX_QUAD_POSITION} from '../drawObject/drawObject';
import {BrushTouchDrawObject} from '../drawObject/brushTouchDrawObject';
import {WebGlFrameBuffer, createFrameBuffer} from '../helpers/webglFramebuffer';
import {WebGlTexture, createWebGlTexture} from '../helpers/webglTexture';
import {WebGlUniform, createWebGlUniform} from '../helpers/webglUniform';

function isPowerOfTwo(x: number) {
  return (x & (x - 1)) == 0;
}

function nextHighestPowerOfTwo(x: number) {
  --x;
  for(var i = 1; i < 32; i <<= 1) {
    x = x | x >> i;
  }
  return x + 1;
}

const BrushTouchProgramShaders = {
  vertext: `#version 300 es
    precision highp float;
    #define VERTEX_QUAD_POSITION_TOP_LEFT ${VERTEX_QUAD_POSITION.TOP_LEFT}.0
    #define VERTEX_QUAD_POSITION_TOP_RIGHT ${VERTEX_QUAD_POSITION.TOP_RIGHT}.0
    #define VERTEX_QUAD_POSITION_BOTTOM_LEFT ${VERTEX_QUAD_POSITION.BOTTOM_LEFT}.0
    #define VERTEX_QUAD_POSITION_BOTTOM_RIGHT ${VERTEX_QUAD_POSITION.BOTTOM_RIGHT}.0

    ${SHADER_CLIP_UTILS}
    ${SHADER_MAT_UTILS}

    uniform mat3 u_matrix;
    uniform float u_width;
    uniform float u_height;
    uniform float u_device_pixel_ratio;

    in vec3 a_position;
    in vec3 a_properties;
    in vec4 a_color;
    in vec4 a_border_color;
    in vec2 a_background_image_textcoord;

    out vec4 v_color;
    out vec4 v_border_color;
    out float v_radius;
    out float v_style;
    out float v_border_width;
    out vec2 v_center_point;
    out vec2 v_background_image_textcoord;

    void main() {
      vec2 resolution = vec2(u_width, u_height);
      float centerX = a_position[0];
      float centerY = a_position[1];
      float vertexQuadPosition = a_position[2];
      float originalCenterX = centerX;
      float originalCenterY = centerY;
      float diameter = a_properties[0];
      float style = a_properties[1];
      float border_width = a_properties[2];
      float radius = diameter / 2.0;

      if (vertexQuadPosition == VERTEX_QUAD_POSITION_TOP_LEFT) {
        centerX -= radius;
        centerY += radius;
      } else if (vertexQuadPosition == VERTEX_QUAD_POSITION_TOP_RIGHT) {
        centerX += radius;
        centerY += radius;
      } else if (vertexQuadPosition == VERTEX_QUAD_POSITION_BOTTOM_LEFT) {
        centerX -= radius;
        centerY -= radius;
      } else if (vertexQuadPosition == VERTEX_QUAD_POSITION_BOTTOM_RIGHT) {
        centerX += radius;
        centerY -= radius;
      }
      
      vec2 coords = (u_matrix * vec3(centerX, centerY, 1)).xy;
      vec2 scaled = coords / resolution;
      vec2 clipped = clipSpace(scaled);

      v_center_point = vec2(originalCenterX, originalCenterY);
      v_radius = radius;
      v_style = style;
      v_border_width = border_width;
      v_color = a_color;
      v_border_color = a_border_color;
      v_background_image_textcoord = (u_matrix * vec3(a_background_image_textcoord.xy, 1)).xy / resolution;

      gl_Position = vec4(clipped, 0.0, 1.0);
    }
  `,
  fragment: `#version 300 es
    precision highp float;
    #define BRUSH_STYLE_PEN ${BrushStyle.pen}.0
    #define BRUSH_STYLE_ARROW ${BrushStyle.arrow}.0
    #define BRUSH_STYLE_BRUSH ${BrushStyle.brush}.0
    #define BRUSH_STYLE_NEON ${BrushStyle.neon}.0
    #define BRUSH_STYLE_BLUR ${BrushStyle.blur}.0
    #define BRUSH_STYLE_ERASER ${BrushStyle.eraser}.0

    uniform float u_width;
    uniform float u_height;
    uniform float u_device_pixel_ratio;
    uniform vec2 u_background_image_size;
    uniform sampler2D u_background_image;

    in vec4 v_color;
    in vec4 v_border_color;
    in float v_radius;
    in float v_style;
    in float v_border_width;
    in vec2 v_center_point;
    in vec2 v_background_image_textcoord;

    out vec4 fragColor;

    vec4 blur(vec4 color, vec2 texcoord, float blur) {
      vec2 onePixel = vec2(1.0, 1.0) / u_background_image_size;
      vec4 colorSum =
        texture(u_background_image, texcoord + vec2(-7.0*onePixel.x, -7.0*onePixel.y))*0.0044299121055113265 +
        texture(u_background_image, texcoord + vec2(-6.0*onePixel.x, -6.0*onePixel.y))*0.00895781211794 +
        texture(u_background_image, texcoord + vec2(-5.0*onePixel.x, -5.0*onePixel.y))*0.0215963866053 +
        texture(u_background_image, texcoord + vec2(-4.0*onePixel.x, -4.0*onePixel.y))*0.0443683338718 +
        texture(u_background_image, texcoord + vec2(-3.0*onePixel.x, -3.0*onePixel.y))*0.0776744219933 +
        texture(u_background_image, texcoord + vec2(-2.0*onePixel.x, -2.0*onePixel.y))*0.115876621105 +
        texture(u_background_image, texcoord + vec2(-1.0*onePixel.x, -1.0*onePixel.y))*0.147308056121 +
        texture(u_background_image, texcoord                                         )*0.159576912161 +
        texture(u_background_image, texcoord + vec2( 1.0*onePixel.x,  1.0*onePixel.y))*0.147308056121 +
        texture(u_background_image, texcoord + vec2( 2.0*onePixel.x,  2.0*onePixel.y))*0.115876621105 +
        texture(u_background_image, texcoord + vec2( 3.0*onePixel.x,  3.0*onePixel.y))*0.0776744219933 +
        texture(u_background_image, texcoord + vec2( 4.0*onePixel.x,  4.0*onePixel.y))*0.0443683338718 +
        texture(u_background_image, texcoord + vec2( 5.0*onePixel.x,  5.0*onePixel.y))*0.0215963866053 +
        texture(u_background_image, texcoord + vec2( 6.0*onePixel.x,  6.0*onePixel.y))*0.00895781211794 +
        texture(u_background_image, texcoord + vec2( 7.0*onePixel.x,  7.0*onePixel.y))*0.0044299121055113265;

      return mix(color, colorSum, blur);
    }

    float random(vec2 co){
      return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
    }

    vec4 blur2(vec4 input_color, vec2 texcoord, vec2 delta) {
      float total = 0.0;
      float offset = random(vec2(0.0, 1.0));
      vec4 color = input_color;

      for (float t = -50.0; t <= 50.0; t++) {
          float percent = (t + offset - 0.5) / 50.0;
          float weight = 1.0 - abs(percent);
          vec4 og = texture(u_background_image, texcoord);
          vec4 samp = texture(u_background_image, texcoord + delta * percent);

          if(samp.a == 1.0) {
            samp.rgb = og.rgb;
          } else {
            samp.rgb *= samp.a;
          }

          color += samp * weight;
          total += weight;
      }

      vec4 result = color / total;
      result.rgb /= result.a + 0.00001;

      return result;
    }

    void main() {
      vec2 resolution = vec2(u_width, u_height);
      vec2 center_point = vec2(v_center_point.x, resolution.y - v_center_point.y - 1.0) / resolution.xy;
      vec2 current_point = gl_FragCoord.xy / resolution;
      vec2 dist = center_point - current_point;
      float scaleX = 1.0;
      float scaleY = 1.0;
      if (u_width > u_height) {
        scaleX = u_width / u_height;
      } else {
        scaleY = u_height / u_width;
      }
      dist.x *= scaleX;
      dist.y *= scaleY;
      float distance = length(dist);
      float radius = v_radius / u_width;

      if(distance > radius) {
        discard;
      }

      if(v_style == BRUSH_STYLE_BLUR) {
        vec2 texcoord = vec2(v_background_image_textcoord.x, 1.0 - v_background_image_textcoord.y);
        vec4 color = texture(u_background_image, texcoord);
        fragColor = blur(color, texcoord, 1.0);
        fragColor[3] = smoothstep(0.0, radius, distance);
        // vec4 color = blur2(vec4(0), texcoord, vec2(v_radius / u_width, v_radius / u_height));
        // fragColor = blur2(color, texcoord, vec2(0.0, v_radius / u_height));
      } else {
        fragColor = v_color;
      }
    }
  `
};

export class BrushTouchProgram extends BaseWebglProgram {
  // Attributes
  protected positionBuffer: WebGlBuffer;
  protected propertiesBuffer: WebGlBuffer;
  protected colorBuffer: WebGlBuffer;
  protected borderColorBuffer: WebGlBuffer;
  protected backgroundImageTextcoordBuffer: WebGlBuffer;

  // Uniforms
  protected backgroundImageSize: WebGlUniform;
  protected backgroundImageTextureUniform: WebGlUniform;

  // Framebuffer
  protected framebuffer: WebGlFrameBuffer;
  protected framebufferTexture: WebGlTexture;

  // Background image texture
  protected backgroundImageTexture: WebGlTexture;

  constructor(
    protected readonly gl: CompatibleWebGLRenderingContext,
    protected readonly vertexShaderSource: string = BrushTouchProgramShaders.vertext,
    protected readonly fragmentShaderSource: string = BrushTouchProgramShaders.fragment
  ) {
    super(gl, vertexShaderSource, fragmentShaderSource);
  }

  onLink(): void {
    const gl = this.gl;

    // !!!IMPORTANT SETTING OTHERWISE ERASER EFFECT WILL NOT WORK
    gl.disable(gl.BLEND);
    gl.depthMask(false);
  }

  onUnlink(): void {
    const gl = this.gl;

    gl.disable(gl.BLEND);
  }

  protected setupBuffer() {
    const gl = this.gl;

    gl.bindVertexArray(this.vao);

    this.positionBuffer = createWebGlBuffer(gl, {location: 0, size: 3});  // [x, y, VERTEX_QUAD_POSITION]
    this.propertiesBuffer = createWebGlBuffer(gl, {location: 1, size: 3}); // [size, style, borderWidth]
    this.colorBuffer = createWebGlBuffer(gl, {location: 2, size: 4}); // color
    this.borderColorBuffer = createWebGlBuffer(gl, {location: 3, size: 4}); // borderColor
    this.backgroundImageTextcoordBuffer = createWebGlBuffer(gl, {location: 4, size: 2}); // background_image_textcoord

    gl.bindVertexArray(null);
  }

  protected setupUniforms(): void {
    super.setupUniforms();
    this.backgroundImageTextureUniform = createWebGlUniform(this.gl, {name: 'u_background_image', program: this.program});
    this.backgroundImageSize = createWebGlUniform(this.gl, {name: 'u_background_image_size', program: this.program});
  }

  setupFramebuffer(width: number, height: number) {
    const gl = this.gl;

    this.framebufferTexture = createWebGlTexture(gl, {
      name: 'brush_touches_framebuffer_texture',
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

  setWidth(width: number) {
    this.widthUniform.setFloat(width);
  }

  setHeight(height: number) {
    this.heightUniform.setFloat(height);
  }

  setBackgroundImageTexture(texture: WebGlTexture) {
    this.backgroundImageTextureUniform.setInteger(texture.index);
    this.backgroundImageTexture = texture;
    this.backgroundImageSize.setVector2([texture.width, texture.height]);
  }

  resetFramebuffer(width: number, height: number) {
    this.setupFramebuffer(width, height);
  }

  clearFramebuffer() {
    this.framebuffer.clear([0, 0, 0, 0]);
  }

  draw(drawTouchesObject: BrushTouchDrawObject): void {
    const gl = this.gl;

    gl.bindVertexArray(this.vao);

    this.backgroundImageTexture.bind();
    this.positionBuffer.bufferData(drawTouchesObject.position.buffer);
    this.propertiesBuffer.bufferData(drawTouchesObject.properties.buffer);
    this.colorBuffer.bufferData(drawTouchesObject.color.buffer);
    this.borderColorBuffer.bufferData(drawTouchesObject.borderColor.buffer);
    this.backgroundImageTextcoordBuffer.bufferData(drawTouchesObject.backgroundImageTextcoord.buffer);
    gl.drawArrays(gl.TRIANGLES, 0, drawTouchesObject.numElements);
    this.backgroundImageTexture.unbind();

    gl.bindVertexArray(null);
  }

  drawToFramebuffer(drawTouchesObject: BrushTouchDrawObject): void {
    this.framebuffer.bind();

    this.draw(drawTouchesObject);

    this.framebuffer.unbind();
  }

  getFramebufferTexture(): WebGlTexture {
    return this.framebufferTexture;
  }
}
