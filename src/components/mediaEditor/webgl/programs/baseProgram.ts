import {CompatibleWebGLRenderingContext} from '../webglContext';
import {WebGlUniform, createWebGlUniform} from '../helpers/webglUniform';
import {DrawObject} from '../drawObject/drawObject';
import {createProgram} from '../helpers/webglProgram';

export const SHADER_CLIP_UTILS = `
  vec2 clipSpace(vec2 position) {
    return vec2(
      -1.0 + position.x * 2.0,
      +1.0 - position.y * 2.0);
  }
`;

export const SHADER_MAT_UTILS = `
  vec2 applyMatrix(mat3 mat, vec2 position) {
    return (mat * vec3(position, 1)).xy;
  }

  vec2 translate(mat3 a, vec2 v) {
    mat3 inversed = a;

    return vec2(v.x + 1.0 / inversed[2].x, v.y + 1.0 / inversed[2].y);
  }

  mat3 scale(mat3 a, vec2 v) {
    return mat3(
      v.x * a[0].x, v.x * a[0].y, v.x * a[0].z,
      v.y * a[1].x, v.y * a[1].y, v.y * a[1].z, 
      a[2].x, a[2].y, a[2].z
    );
  }

  mat3 unscale(mat3 a, vec2 v) {
    return mat3(
      a[0].x / v.x, a[0].y / v.x, a[0].z / v.x,
      a[1].x / v.y, a[1].y / v.y, a[1].z / v.y, 
      a[2].x, a[2].y, a[2].z
    );
  }
`;

export abstract class BaseWebglProgram {
  protected program: WebGLProgram;

  // Uniforms
  protected matrixUniform: WebGlUniform;
  protected widthUniform: WebGlUniform;
  protected heightUniform: WebGlUniform;
  protected distanceUniform: WebGlUniform;
  protected devicePixelRatioUniform: WebGlUniform;
  protected isReadPixelRenderModeUniform: WebGlUniform;
  protected featureFlagsUnifroms: Record<string, WebGlUniform>;

  protected vao: WebGLVertexArrayObjectOES;

  constructor(
    protected readonly gl: CompatibleWebGLRenderingContext,
    protected readonly vertexShaderSource: string,
    protected readonly fragmentShaderSource: string
  ) {}

  public init() {
    const gl = this.gl;

    gl.clear(gl.COLOR_BUFFER_BIT);

    this.setupProgram();
    this.setupBuffer();
    this.setupUniforms();
    this.setupTextures();
    return this.onInit();
  }

  public destroy() {}

  protected setupProgram() {
    this.program = createProgram(this.gl, this.vertexShaderSource, this.fragmentShaderSource);
    this.vao = this.gl.createVertexArray();
  }

  protected setupBuffer() {
    const gl = this.gl;

    gl.bindVertexArray(this.vao);

    gl.bindVertexArray(null);
  }

  protected setupUniforms() {
    this.matrixUniform = createWebGlUniform(this.gl, {name: 'u_matrix', program: this.program});
    this.widthUniform = createWebGlUniform(this.gl, {name: 'u_width', program: this.program});
    this.heightUniform = createWebGlUniform(this.gl, {name: 'u_height', program: this.program});
    this.devicePixelRatioUniform = createWebGlUniform(this.gl, {
      name: 'u_device_pixel_ratio',
      program: this.program
    });
  }

  protected setupTextures() {}

  protected setupFramebuffers() {}

  link() {
    this.gl.useProgram(this.program);
    this.onLink();
  }

  unlink() {
    this.onUnlink();
  }

  onInit(): Promise<void> {
    return Promise.resolve();
  }

  onLink() {}

  onUnlink() {}

  setMatrix(matrix: [number, number, number, number, number, number, number, number, number]) {
    this.matrixUniform.setMatrix3(matrix);
  }

  setWidth(width: number) {
    this.widthUniform.setFloat(width);
  }

  setHeight(height: number) {
    this.heightUniform.setFloat(height);
  }

  setDevicePixelRatio(devicePixelRatio: number) {
    this.devicePixelRatioUniform.setFloat(devicePixelRatio);
  }

  abstract draw(objectGroup: DrawObject | any): void;
}
