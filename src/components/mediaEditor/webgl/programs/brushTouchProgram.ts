import {BrushStyle} from '../../types';
import {BaseWebglProgram, SHADER_CLIP_UTILS, SHADER_MAT_UTILS} from './baseProgram';
import {CompatibleWebGLRenderingContext} from '../webglContext';
import {WebGlBuffer, createWebGlBuffer} from '../helpers/webglBuffer';
import {VERTEX_QUAD_POSITION} from '../drawObject/drawObject';
import {BrushTouchDrawObject} from '../drawObject/brushTouchDrawObject';
import {WebGlFrameBuffer, createFrameBuffer} from '../helpers/webglFramebuffer';
import {WebGlTexture, createWebGlTexture} from '../helpers/webglTexture';

const BrushTouchProgramShaders = {
  vertext: `
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

    attribute vec3 a_position;
    attribute vec3 a_properties;
    attribute vec4 a_color;
    attribute vec4 a_border_color;

    varying vec4 v_color;
    varying vec4 v_border_color;
    varying float v_radius;
    varying float v_style;
    varying float v_border_width;
    varying vec2 v_center_point;

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

      gl_Position = vec4(clipped, 0.0, 1.0);
    }
  `,
  fragment: `
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

    varying vec4 v_color;
    varying vec4 v_border_color;
    varying float v_radius;
    varying float v_style;
    varying float v_border_width;
    varying vec2 v_center_point;

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

      if(distance <= radius) {
        gl_FragColor = v_color;
      } else {
        discard;
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

  // Framebuffer
  protected framebuffer: WebGlFrameBuffer;
  protected framebufferTexture: WebGlTexture;

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

    gl.bindVertexArray(null);
  }

  setupFramebuffer(width: number, height: number) {
    const gl = this.gl;

    this.framebufferTexture = createWebGlTexture(gl, {
      name: 'framebuffer_texture',
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
    this.framebuffer = createFrameBuffer(gl, {texture: this.framebufferTexture});
    this.clearFramebuffer();
  }

  resetFramebuffer(width: number, height: number) {
    this.setupFramebuffer(width, height);
  }

  clearFramebuffer() {
    this.framebuffer.clear([1, 1, 1, 0]);
  }

  draw(drawTouchesObject: BrushTouchDrawObject): void {
    const gl = this.gl;

    gl.bindVertexArray(this.vao);

    this.positionBuffer.bufferData(drawTouchesObject.position.buffer);
    this.propertiesBuffer.bufferData(drawTouchesObject.properties.buffer);
    this.colorBuffer.bufferData(drawTouchesObject.color.buffer);
    this.borderColorBuffer.bufferData(drawTouchesObject.borderColor.buffer);

    gl.drawArrays(gl.TRIANGLES, 0, drawTouchesObject.numElements);

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
