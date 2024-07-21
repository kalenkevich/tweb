import {ImageState, ObjectLayerType, BrushTouch, ObjectLayer} from '../types';
import {ImageRenderer, ImageRendererOptions, RenderOptions} from '../imageRenderer';
import {CompatibleWebGLRenderingContext, makeCompatibleWebGLRenderingContext} from './webglContext';
import {ObjectLayerProgram} from './programs/objectLayerProgram';
import {BrushTouchProgram} from './programs/brushTouchProgram';
import {BackgroundImageProgram} from './programs/backgroundImageProgram';
import {FramebufferProgram} from './programs/framebufferProgram';
import {toImageDrawObject} from './drawObject/imageDrawObject';
import {toBrushTouchDrawObject} from './drawObject/brushTouchDrawObject';
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
    this.resize(this.canvas.width, this.canvas.height);

    this.framebufferProgram = new FramebufferProgram(gl);
    this.framebufferProgram.init();

    this.imageProgram = new ObjectLayerProgram(gl);
    this.imageProgram.init();

    this.brushTouchProgram = new BrushTouchProgram(gl);
    this.brushTouchProgram.init();
    this.brushTouchProgram.setupFramebuffer(this.canvas.width, this.canvas.height);

    this.backgroundImageProgram = new BackgroundImageProgram(gl);
    this.backgroundImageProgram.init();

    this.inited = true;
  }

  destroy() {
    this.framebufferProgram.destroy();
    this.imageProgram.destroy();
    this.brushTouchProgram.destroy();
    this.backgroundImageProgram.destroy();
  }

  public resize(width: number, height: number) {
    this.canvas.width = width;
    this.canvas.height = height;

    if(!this.inited) {
      return;
    }

    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.brushTouchProgram?.resetFramebuffer(this.canvas.width, this.canvas.height);
  }

  public render(imageState: ImageState, options?: RenderOptions) {
    this.renderBackgroundImage(imageState, options);
    this.renderBrushTouches(imageState.drawLayer.touches, options);
    this.renderLayerObjects(imageState.layers, options);

    const error = this.gl.getError();
    if(error) {
      console.log(error);
      // const div = document.createElement('div');
      // div.innerText = `GL ERROR: ${error}`;
      // div.style.position = 'fixed';
      // div.style.fontSize = '32px';
      // div.style.color = 'red';
      // div.style.top = '25%';
      // div.style.left = '25%';
      // div.style.zIndex = '999999';
      // div.style.width = '300px';
      // div.style.height = '300px';
      // div.style.background = 'white';
      // document.body.appendChild(div);
    }
  }

  public renderBrushTouch(imageState: ImageState, touch: BrushTouch, options?: RenderOptions) {
    this.renderBackgroundImage(imageState, options);
    this.renderBrushTouches([touch], {...options, clearBrushProgramFramebuffer: false});
    this.renderLayerObjects(imageState.layers, options);

    const error = this.gl.getError();
    if(error) {
      console.log(error);
    }
  }

  renderBackgroundImage(imageState: ImageState, options: RenderOptions) {
    const renderAllLayers = options?.layers === 'all';
    const renderBackgroundLayer = renderAllLayers || (options?.layers || []).includes(ObjectLayerType.backgroundImage);
    const imageMatrix = getProjectionViewMatrix(imageState);
    const imageDrawObject = toImageDrawObject(imageState, this.canvas);

    if(!renderBackgroundLayer) {
      return;
    }
    // Render main image first
    this.backgroundImageProgram.link();
    this.backgroundImageProgram.setMatrix(imageMatrix);
    this.backgroundImageProgram.setWidth(this.canvas.width);
    this.backgroundImageProgram.setHeight(this.canvas.height);
    this.backgroundImageProgram.setDevicePixelRatio(this.devicePixelRatio);
    this.backgroundImageProgram.setFilter(imageState.filter);
    this.backgroundImageProgram.draw(imageDrawObject);
    this.backgroundImageProgram.unlink();
  }

  renderBrushTouches(touches: BrushTouch[], options: RenderOptions) {
    const renderAllLayers = options?.layers === 'all';
    const renderDrawLayer = renderAllLayers || (options?.layers || []).includes(ObjectLayerType.draw);

    if(!renderDrawLayer) {
      return;
    }

    // render all brush touches first to framebuffer texture
    const brushTouchDrawObject = toBrushTouchDrawObject(touches);
    const canvasMatrix = getProjectionViewMatrix({
      translation: [0, 0],
      scale: [1, 1],
      rotation: 0,
      origin: [0, 0]
    });
    this.brushTouchProgram.link();
    this.brushTouchProgram.setMatrix(canvasMatrix);
    this.brushTouchProgram.setWidth(this.canvas.width);
    this.brushTouchProgram.setHeight(this.canvas.height);
    this.brushTouchProgram.setDevicePixelRatio(this.devicePixelRatio);
    if(options.clearBrushProgramFramebuffer === true) {
      this.brushTouchProgram.clearFramebuffer();
    }
    this.brushTouchProgram.drawToFramebuffer(brushTouchDrawObject);
    this.brushTouchProgram.unlink();

    // render all touches (as a texture) to canvas
    this.framebufferProgram.link();
    this.framebufferProgram.setMatrix(canvasMatrix);
    this.framebufferProgram.setWidth(this.canvas.width);
    this.framebufferProgram.setHeight(this.canvas.height);
    this.framebufferProgram.setDevicePixelRatio(this.devicePixelRatio);
    this.framebufferProgram.draw(this.brushTouchProgram.getFramebufferTexture());
    this.framebufferProgram.unlink();
  }

  renderLayerObjects(objects: ObjectLayer[], options: RenderOptions) {
    const renderAllLayers = options?.layers === 'all';
    const renderTextLayer = renderAllLayers || (options?.layers || []).includes(ObjectLayerType.text);
    const renderStickerLayer = renderAllLayers || (options?.layers || []).includes(ObjectLayerType.sticker);

    // Render other layers if needed
    if(!renderTextLayer && !renderStickerLayer) {
      return;
    }

    this.imageProgram.link();
    this.imageProgram.setWidth(this.canvas.width);
    this.imageProgram.setHeight(this.canvas.height);
    this.imageProgram.setDevicePixelRatio(this.devicePixelRatio);

    for(const object of objects) {
      if(!renderAllLayers && !options.layers.includes(object.type)) {
        continue;
      }
      const objectLayerMatrix = getProjectionViewMatrix(object);
      const imageDrawObject = toImageDrawObject(object, this.canvas);

      this.imageProgram.setMatrix(objectLayerMatrix);
      this.imageProgram.draw(imageDrawObject);
    }

    this.imageProgram.unlink();
  }

  async compileImage(imageState: ImageState, renderOptions: RenderOptions): Promise<Blob> {
    this.render(imageState, renderOptions);

    return new Promise(resolve => {
      this.canvas.toBlob((blobResult) => {
        saveBlobAsFile(blobResult, 'result_image');
        resolve(blobResult);
      });
    });
  }
}

export interface ProjectionProperties {
  translation: [number, number];
  rotation: number;
  scale: [number, number];
  origin: [number, number];
}
export function getProjectionViewMatrix(state: ProjectionProperties): Matrix3 {
  const translationMatrix = translateMatrix3(createMatrix3(), [state.translation[0], state.translation[1]]);
  const rotationMatrix = rotateMatrix3(createMatrix3(), degreesToRadians(state.rotation));
  const scaleMatrix = scaleMatrix3(createMatrix3(), state.scale);
  const originMatrix = translateMatrix3(createMatrix3(), [state.origin[0], state.origin[1]]);

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
