import {ImageLayer, ImageLayerType, ImageState, TextLayer} from '../types';
import {ImageRenderer, ImageRendererOptions, RenderOptions} from '../imageRenderer';
import {CompatibleWebGLRenderingContext, makeCompatibleWebGLRenderingContext} from './webglContext';
import {ImageProgram} from './programs/imageProgram';
import {BackgroundImageProgram} from './programs/backgroundImageProgram';
import {toImageDrawObject} from './drawObject/imageDrawObject';
import readBlobAsUint8Array from '../../../helpers/blob/readBlobAsUint8Array';
import {Matrix3, createMatrix3, multiplyMatrix3, rotateMatrix3, translateMatrix3, scaleMatrix3} from '../helpers/matrixHelpers';

const a = document.createElement('a');
document.body.appendChild(a);
a.style.display = 'none';
function saveBlobAsFile(blob: Blob, fileName: string) {
  const url = window.URL.createObjectURL(blob);
  a.href = url;
  a.download = fileName;
  a.click();
  window.URL.revokeObjectURL(url);
}

export class WebglImageRenderer implements ImageRenderer {
  private canvas: HTMLCanvasElement;
  private gl: CompatibleWebGLRenderingContext;
  private backgroundImageProgram: BackgroundImageProgram;
  private imageProgram: ImageProgram;

  constructor(private readonly devicePixelRatio = window.devicePixelRatio) {}

  init(canvas: HTMLCanvasElement, options: ImageRendererOptions) {
    this.canvas = canvas;

    let gl = this.gl = this.canvas.getContext('webgl2', {
      performance: 'high-performance',
      alpha: true,
      premultipliedAlpha: !!options?.compileMode,
      preserveDrawingBuffer: !!options?.compileMode
    }) as CompatibleWebGLRenderingContext;
    if(!this.gl) {
      // Fallback to webgl 1 rendering context.
      const gl1 = this.canvas.getContext('webgl', {
        performance: 'high-performance',
        alpha: true,
        premultipliedAlpha: !!options?.compileMode,
        preserveDrawingBuffer: !!options?.compileMode
      }) as WebGLRenderingContext;
      gl = this.gl = makeCompatibleWebGLRenderingContext(gl1);
    }

    this.resize(this.canvas.width, this.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);

    this.backgroundImageProgram = new BackgroundImageProgram(gl);
    this.backgroundImageProgram.init();

    this.imageProgram = new ImageProgram(gl);
    this.imageProgram.init();
  }

  destroy() {}

  public resize(width: number, height: number) {
    this.canvas.width = width * this.devicePixelRatio;
    this.canvas.height = height * this.devicePixelRatio;

    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  render(imageState: ImageState, options?: RenderOptions) {
    const projectionViewMatrix = getProjectionViewMatrix(imageState);
    const imageDrawObject = toImageDrawObject(imageState);

    this.backgroundImageProgram.link();
    this.backgroundImageProgram.setMatrix(projectionViewMatrix);
    this.backgroundImageProgram.setWidth(this.canvas.width);
    this.backgroundImageProgram.setHeight(this.canvas.height);
    this.backgroundImageProgram.setDevicePixelRatio(this.devicePixelRatio);
    this.backgroundImageProgram.setFilter(imageState.filter);
    this.backgroundImageProgram.draw(imageDrawObject);
    this.backgroundImageProgram.unlink();

    if(options?.renderAllLayers) {
      for(const layer of imageState.layers) {
        if([ImageLayerType.text, ImageLayerType.sticker].includes(layer.type)) {
          const projectionViewMatrix = getProjectionViewMatrix(layer);
          const imageDrawObject = toImageDrawObject(layer);

          this.imageProgram.link();
          this.imageProgram.setMatrix(projectionViewMatrix);
          this.imageProgram.setWidth(this.canvas.width);
          this.imageProgram.setHeight(this.canvas.height);
          this.imageProgram.setDevicePixelRatio(this.devicePixelRatio);
          this.imageProgram.draw(imageDrawObject);
          this.imageProgram.unlink();
        }
      }
    }
  }

  async compileImage(imageState: ImageState): Promise<Uint8Array> {
    // Draw image first
    this.render(imageState, {renderAllLayers: true});

    return new Promise(resolve => {
      this.canvas.toBlob(async(blobResult) => {
        saveBlobAsFile(blobResult, 'result_image');
        resolve(await readBlobAsUint8Array(blobResult));
      });
    });
  }
}

export function getProjectionViewMatrix(state: ImageState | ImageLayer): Matrix3 {
  const translationMatrix = translateMatrix3(createMatrix3(), state.translation);
  const rotationMatrix = rotateMatrix3(createMatrix3(), degreesToRadians(state.rotation));
  const scaleMatrix = scaleMatrix3(createMatrix3(), state.scale);
  const originMatrix = translateMatrix3(createMatrix3(), state.origin);

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
