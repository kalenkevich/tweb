import {ObjectLayer, ObjectLayerType, ImageState} from '../types';
import {ImageRenderer, ImageRendererOptions, RenderOptions} from '../imageRenderer';
import {CompatibleWebGLRenderingContext, makeCompatibleWebGLRenderingContext} from './webglContext';
import {ObjectLayerProgram} from './programs/objectLayerProgram';
import {BrushTouchProgram} from './programs/brushTouchProgram';
import {BackgroundImageProgram} from './programs/backgroundImageProgram';
import {FramebufferProgram} from './programs/framebufferProgram';
import {WebGlFrameBuffer, createFrameBuffer} from './helpers/webglFramebuffer';
import {createWebGlTexture} from './helpers/webglTexture';
import {toImageDrawObject} from './drawObject/imageDrawObject';
import {toBrushTouchDrawObject} from './drawObject/brushTouchDrawObject';
import {Matrix3, createMatrix3, multiplyMatrix3, rotateMatrix3, translateMatrix3, scaleMatrix3} from '../helpers/matrixHelpers';
import readBlobAsUint8Array from '../../../helpers/blob/readBlobAsUint8Array';

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
  private imageProgram: ObjectLayerProgram;
  private brushTouchProgram: BrushTouchProgram;
  private backgroundImageProgram: BackgroundImageProgram;
  private framebufferProgram: FramebufferProgram;
  private inited: boolean = false;

  constructor(private readonly devicePixelRatio = window.devicePixelRatio) {}

  init(canvas: HTMLCanvasElement, options: ImageRendererOptions) {
    this.canvas = canvas;

    let gl = this.gl = this.canvas.getContext('webgl2', {
      performance: 'high-performance',
      alpha: true,
      premultipliedAlpha: true,
      preserveDrawingBuffer: !!options?.compileMode
    }) as CompatibleWebGLRenderingContext;
    if(!this.gl) {
      // Fallback to webgl 1 rendering context.
      const gl1 = this.canvas.getContext('webgl', {
        performance: 'high-performance',
        alpha: true,
        premultipliedAlpha: true,
        preserveDrawingBuffer: !!options?.compileMode
      }) as WebGLRenderingContext;
      gl = this.gl = makeCompatibleWebGLRenderingContext(gl1);
    }

    gl.clear(gl.COLOR_BUFFER_BIT);

    this.framebufferProgram = new FramebufferProgram(gl);
    this.framebufferProgram.init();

    this.imageProgram = new ObjectLayerProgram(gl);
    this.imageProgram.init();

    this.brushTouchProgram = new BrushTouchProgram(gl);
    this.brushTouchProgram.init();

    this.backgroundImageProgram = new BackgroundImageProgram(gl);
    this.backgroundImageProgram.init();

    this.inited = true;
    this.resize(this.canvas.width, this.canvas.height);
  }

  destroy() {}

  public resize(width: number, height: number) {
    this.canvas.width = width * this.devicePixelRatio;
    this.canvas.height = height * this.devicePixelRatio;

    if(!this.inited) {
      return;
    }

    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.brushTouchProgram?.resetFramebuffer(this.canvas.width, this.canvas.height);
  }

  public render(imageState: ImageState, options?: RenderOptions) {
    const projectionViewMatrix = getProjectionViewMatrix(imageState);
    const imageDrawObject = toImageDrawObject(imageState);

    // render all brush touches first to framebuffer (texture)
    if((options?.renderLayers || []).includes(imageState.drawLayer.type)) {
      const brushTouchDrawObject = toBrushTouchDrawObject(imageState);
      this.brushTouchProgram.link();
      this.brushTouchProgram.setMatrix(projectionViewMatrix);
      this.brushTouchProgram.setWidth(this.canvas.width);
      this.brushTouchProgram.setHeight(this.canvas.height);
      this.brushTouchProgram.setDevicePixelRatio(this.devicePixelRatio);
      this.brushTouchProgram.setupFramebuffer(this.canvas.width, this.canvas.height);
      this.brushTouchProgram.drawToFramebuffer(brushTouchDrawObject);
      this.brushTouchProgram.unlink();
    }

    // Render main image first
    this.backgroundImageProgram.link();
    this.backgroundImageProgram.setMatrix(projectionViewMatrix);
    this.backgroundImageProgram.setWidth(this.canvas.width);
    this.backgroundImageProgram.setHeight(this.canvas.height);
    this.backgroundImageProgram.setDevicePixelRatio(this.devicePixelRatio);
    this.backgroundImageProgram.setFilter(imageState.filter);
    this.backgroundImageProgram.draw(imageDrawObject);
    this.backgroundImageProgram.unlink();

    // render all touches (as a texture) to canvas
    this.framebufferProgram.link();
    this.framebufferProgram.setMatrix(projectionViewMatrix);
    this.framebufferProgram.setWidth(this.canvas.width);
    this.framebufferProgram.setHeight(this.canvas.height);
    this.framebufferProgram.setDevicePixelRatio(this.devicePixelRatio);
    this.framebufferProgram.draw(this.brushTouchProgram.getFramebufferTexture());
    this.framebufferProgram.unlink();

    // Render other layers if needed
    if(options?.renderLayers) {
      for(const layer of imageState.layers) {
        if(options.renderLayers.includes(layer.type)) {
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
    this.render(imageState, {renderLayers: [ObjectLayerType.draw, ObjectLayerType.sticker, ObjectLayerType.text]});

    return new Promise(resolve => {
      this.canvas.toBlob(async(blobResult) => {
        saveBlobAsFile(blobResult, 'result_image');
        resolve(await readBlobAsUint8Array(blobResult));
      });
    });
  }
}

export function getProjectionViewMatrix(state: ImageState | ObjectLayer): Matrix3 {
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
