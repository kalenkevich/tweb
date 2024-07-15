import {ImageState} from '../types';
import {ImageRenderer} from '../imageRenderer';
import {CompatibleWebGLRenderingContext, makeCompatibleWebGLRenderingContext} from './webglContext';
import {WebGlSceneCamera, createWebglSceneCamera} from './helpers/weblgCamera';
import {ImageProgram} from './programs/imageProgram';
import {imageState2ImageDrawObject} from './drawObject/imageDrawObject';
import readBlobAsUint8Array from '../../../helpers/blob/readBlobAsUint8Array';
import {Matrix3, createMatrix3, multiplyMatrix3, rotateMatrix3, translateMatrix3, scaleMatrix3} from '../math/matrixUtils';

export class WebglImageRenderer implements ImageRenderer {
  private canvas: HTMLCanvasElement;
  private gl: CompatibleWebGLRenderingContext;
  private imageProgram: ImageProgram;
  private sceneCamera: WebGlSceneCamera;

  constructor(private readonly devicePixelRatio = window.devicePixelRatio) {}

  init(canvas: HTMLCanvasElement) {
    this.canvas = canvas;

    let gl = this.gl = this.canvas.getContext('webgl2', {
      performance: 'high-performance',
      alpha: true
    }) as CompatibleWebGLRenderingContext;
    if(!this.gl) {
      // Fallback to webgl 1 rendering context.
      const gl1 = this.canvas.getContext('webgl', {
        performance: 'high-performance',
        alpha: true
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
    this.imageProgram.init();
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
    const projectionViewMatrix = getProjectionViewMatrix(imageState, this.canvas);
    const imageDrawObject = imageState2ImageDrawObject(imageState, this.canvas);

    this.imageProgram.link();
    this.imageProgram.setMatrix(projectionViewMatrix);
    this.imageProgram.setWidth(this.canvas.width);
    this.imageProgram.setHeight(this.canvas.height);
    this.imageProgram.setDevicePixelRatio(this.devicePixelRatio);
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
}

export function getProjectionViewMatrix(imageState: ImageState, canvas: HTMLCanvasElement): Matrix3 {
  const translationMatrix = translateMatrix3(createMatrix3(), imageState.translation);
  const rotationMatrix = rotateMatrix3(createMatrix3(), degreesToRadians(imageState.rotateAngle));
  const scaleMatrix = scaleMatrix3(createMatrix3(), imageState.scale);
  const originMatrix = translateMatrix3(createMatrix3(), [-((canvas.width) / 2), -((canvas.height) / 2)]);

  return multiplyMatrix3(
    multiplyMatrix3(
      multiplyMatrix3(
        translationMatrix,
        rotationMatrix
      ),
      scaleMatrix
    ),
    originMatrix
  );
}

function degreesToRadians(degrees: number) {
  return degrees * (Math.PI/180);
}
