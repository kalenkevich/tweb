import {ImageState} from '../types';
import {ImageRenderer} from '../imageRenderer';
import {CompatibleWebGLRenderingContext, makeCompatibleWebGLRenderingContext} from './webglContext';
import {WebGlSceneCamera, createWebglSceneCamera} from './helpers/weblgCamera';
import {BaseWebglProgram} from './programs/baseProgram';
import {ImageProgram} from './programs/imageProgram';
import {imageState2ImageDrawObject} from './drawObject/imageDrawObject';
import readBlobAsUint8Array from '../../../helpers/blob/readBlobAsUint8Array';

export class WebglImageRenderer implements ImageRenderer {
  private canvas: HTMLCanvasElement;
  private gl: CompatibleWebGLRenderingContext;
  private imageProgram: ImageProgram;
  private sceneCamera: WebGlSceneCamera;

  constructor(private readonly devicePixelRatio = window.devicePixelRatio) {}

  async init(canvas: HTMLCanvasElement) {
    this.canvas = canvas;

    let gl = this.gl = this.canvas.getContext('webgl2', {
      performance: 'high-performance',
      alpha: true,
      preserveDrawingBuffer: true
    }) as CompatibleWebGLRenderingContext;
    if(!this.gl) {
      // Fallback to webgl 1 rendering context.
      const gl1 = this.canvas.getContext('webgl', {
        performance: 'high-performance',
        alpha: true,
        preserveDrawingBuffer: true
      }) as WebGLRenderingContext;
      gl = this.gl = makeCompatibleWebGLRenderingContext(gl1);
    }

    this.resize(this.canvas.width, this.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);

    this.sceneCamera = createWebglSceneCamera({
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      distance: 0,
      rotationInDegree: 0
    });
    this.imageProgram = new ImageProgram(gl);
    await this.imageProgram.init();
  }

  destroy() {}

  public resize(width: number, height: number) {
    this.canvas.width = width * this.devicePixelRatio;
    this.canvas.height = height * this.devicePixelRatio;

    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  render(imageState: ImageState) {
    this.sceneCamera.update({
      width: imageState.width,
      height: imageState.height
    });
    const imageDrawObject = imageState2ImageDrawObject(imageState, this.canvas);

    this.imageProgram.link();
    this.setProgramGlobalUniforms(this.imageProgram, this.sceneCamera);
    this.imageProgram.setFilter(imageState.filter);
    this.imageProgram.draw(imageDrawObject);
  }

  async getImageSnapshot(): Promise<Uint8Array> {
    return new Promise(resolve => {
      this.canvas.toBlob(async(blobResult) => {
        resolve(await readBlobAsUint8Array(blobResult));
      });
    })
  }

  private setProgramGlobalUniforms(program: BaseWebglProgram, camera: WebGlSceneCamera) {
    program.setMatrix(camera.getProjectionViewMatrix());
    program.setWidth(this.canvas.width);
    program.setHeight(this.canvas.height);
    program.setDevicePixelRatio(this.devicePixelRatio);
  }
}
