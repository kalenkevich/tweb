import {BrushStyle} from '../../types';
import {BaseWebglProgram, SHADER_CLIP_UTILS, SHADER_MAT_UTILS} from './baseProgram';
import {CompatibleWebGLRenderingContext} from '../webglContext';
import {WebGlBuffer, createWebGlBuffer} from '../helpers/webglBuffer';
import {VERTEX_QUAD_POSITION} from '../drawObject/drawObject';
import {BrushTouchDrawObject} from '../drawObject/brushTouchDrawObject';
import {WebGlFrameBuffer, createFrameBuffer} from '../helpers/webglFramebuffer';
import {WebGlTexture, createWebGlTexture} from '../helpers/webglTexture';
import {WebGlUniform, createWebGlUniform} from '../helpers/webglUniform';

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
      float quadHalf = radius + border_width;

      if (vertexQuadPosition == VERTEX_QUAD_POSITION_TOP_LEFT) {
        centerX -= quadHalf;
        centerY += quadHalf;
      } else if (vertexQuadPosition == VERTEX_QUAD_POSITION_TOP_RIGHT) {
        centerX += quadHalf;
        centerY += quadHalf;
      } else if (vertexQuadPosition == VERTEX_QUAD_POSITION_BOTTOM_LEFT) {
        centerX -= quadHalf;
        centerY -= quadHalf;
      } else if (vertexQuadPosition == VERTEX_QUAD_POSITION_BOTTOM_RIGHT) {
        centerX += quadHalf;
        centerY -= quadHalf;
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

    float random(vec2 co){
      return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
    }

    // 2D Noise based on Morgan McGuire @morgan3d
    // https://www.shadertoy.com/view/4dS3Wd
    float noise (vec2 st) {
      vec2 i = floor(st);
      vec2 f = fract(st);

      // Four corners in 2D of a tile
      float a = random(i);
      float b = random(i + vec2(1.0, 0.0));
      float c = random(i + vec2(0.0, 1.0));
      float d = random(i + vec2(1.0, 1.0));

      // Smooth Interpolation

      // Cubic Hermine Curve.  Same as SmoothStep()
      vec2 u = f*f*(3.0-2.0*f);
      // u = smoothstep(0.,1.,f);

      // Mix 4 coorners percentages
      return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
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
      float borderWidth = v_border_width / u_width;

      if(distance > radius) {
        if(v_style == BRUSH_STYLE_NEON) {
          if(distance > radius + borderWidth) {
            discard;
          }
        } else {
          discard;
        }
      }

      if(v_style == BRUSH_STYLE_BLUR) {
        vec4 color = vec4(1.0) * noise(vec2(current_point * 500.0));
        vec2 texcoord = current_point + 1.0 * color.xy * 0.1;                   

        fragColor = texture(u_background_image, texcoord);
      } else if (v_style == BRUSH_STYLE_NEON) {
        float d = pow(radius / distance, 0.2);

        fragColor = vec4(d * v_border_color.rgb, 0.5);
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

  public destroy(): void {
    this.framebufferTexture?.destroy();
    this.backgroundImageTexture?.destroy();
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
      minFilter: gl.NEAREST,
      magFilter: gl.NEAREST,
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
