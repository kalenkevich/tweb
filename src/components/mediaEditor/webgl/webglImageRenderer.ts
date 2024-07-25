import {ImageState, ObjectLayerType, BrushTouch, ObjectLayer} from '../types';
import {ImageRenderer, ImageRendererOptions, RenderOptions} from '../imageRenderer';
import {CompatibleWebGLRenderingContext, makeCompatibleWebGLRenderingContext} from './webglContext';
import {createWebGlTexture, ArrayBufferTextureSource, WebGlTexture} from './helpers/webglTexture';
import {ObjectLayerProgram} from './programs/objectLayerProgram';
import {BrushTouchProgram} from './programs/brushTouchProgram';
import {BackgroundImageProgram} from './programs/backgroundImageProgram';
import {FramebufferProgram} from './programs/framebufferProgram';
import {toImageDrawObject} from './drawObject/imageDrawObject';
import {toBrushTouchDrawObject} from './drawObject/brushTouchDrawObject';
import {Matrix3, createMatrix3, multiplyMatrix3, rotateMatrix3, translateMatrix3, scaleMatrix3} from '../helpers/matrixHelpers';
import {showErrorIfExist} from './helpers/webglDebugHelper';

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
    this.backgroundImageProgram.setupFramebuffer(this.canvas.width, this.canvas.height);

    this.inited = true;
    showErrorIfExist(this.gl, 'init');
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
    showErrorIfExist(this.gl, 'resize, viewport');
    this.backgroundImageProgram?.resetFramebuffer(this.canvas.width, this.canvas.height);
    showErrorIfExist(this.gl, 'resize, background reset framebuffer');
    this.brushTouchProgram?.resetFramebuffer(this.canvas.width, this.canvas.height);
    showErrorIfExist(this.gl, 'resize, brush touch reset framebuffer');
  }

  public render(imageState: ImageState, options?: RenderOptions) {
    if(options.clearCanvas) {
      this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    }
    showErrorIfExist(this.gl, 'render, clear');
    const backgroundImageTexture = this.renderBackgroundImage(imageState, options);
    showErrorIfExist(this.gl, 'render, background');
    this.renderBrushTouches(backgroundImageTexture, imageState.drawLayer.touches, options);
    showErrorIfExist(this.gl, 'render, brush touches');
    this.renderLayerObjects(imageState.layers, options);
    showErrorIfExist(this.gl, 'render, objects');
  }

  public renderBrushTouch(imageState: ImageState, touch: BrushTouch, options?: RenderOptions) {
    if(options.clearCanvas) {
      this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    }
    const backgroundImage = this.renderBackgroundImage(imageState, options);
    this.renderBrushTouches(backgroundImage, [touch], {...options, clearBrushProgramFramebuffer: false});
    this.renderLayerObjects(imageState.layers, options);
  }

  public renderTexture(textureSource: ArrayBufferTextureSource, options: RenderOptions) {
    if(options.clearCanvas) {
      this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    }
    const canvasMatrix = getProjectionViewMatrix({
      translation: [0, 0],
      scale: [1, 1],
      rotation: 0,
      origin: [0, 0]
    }, options.flipImageByYAxis);
    const image = createWebGlTexture(this.gl, {
      name: 'brush_touches_framebuffer_texture',
      width: textureSource.width,
      height: textureSource.height,
      pixels: textureSource.data,
      minFilter: this.gl.LINEAR,
      magFilter: this.gl.LINEAR,
      wrapS: this.gl.CLAMP_TO_EDGE,
      wrapT: this.gl.CLAMP_TO_EDGE
    });

    this.framebufferProgram.link();
    this.framebufferProgram.setMatrix(canvasMatrix);
    this.framebufferProgram.setWidth(this.canvas.width);
    this.framebufferProgram.setHeight(this.canvas.height);
    this.framebufferProgram.setDevicePixelRatio(this.devicePixelRatio);
    this.framebufferProgram.draw(image);
    this.framebufferProgram.unlink();
    image.destroy();
  }

  public getRenderedData(flipY: boolean = false): Uint8Array {
    const width = this.canvas.width;
    const height = this.canvas.height;
    const length = width * height * 4;
    const data = new Uint8Array(length);
    this.gl.readPixels(0, 0, width, height, this.gl.RGBA, this.gl.UNSIGNED_BYTE, data);

    if(!flipY) {
      return data;
    }

    const row = width * 4;
    const end = (height - 1) * row;
    const pixels = new Uint8Array(length);
    for(let i = 0; i < length; i += row) {
      pixels.set(data.subarray(i, i + row), end - i);
    }

    return pixels;
  }

  renderBackgroundImage(imageState: ImageState, options: RenderOptions): WebGlTexture {
    const renderAllLayers = options?.layers === 'all';
    const renderBackgroundLayer = renderAllLayers || (options?.layers || []).includes(ObjectLayerType.backgroundImage);
    if(!renderBackgroundLayer) {
      return;
    }

    const imageMatrix = getProjectionViewMatrix(imageState, options.flipImageByYAxis);
    const imageDrawObject = toImageDrawObject(imageState, this.canvas);

    // Render main image first
    this.backgroundImageProgram.link();
    this.backgroundImageProgram.setMatrix(imageMatrix);
    this.backgroundImageProgram.setWidth(this.canvas.width);
    this.backgroundImageProgram.setHeight(this.canvas.height);
    this.backgroundImageProgram.setDevicePixelRatio(this.devicePixelRatio);
    this.backgroundImageProgram.setFilter(imageState.filter);
    this.backgroundImageProgram.clearFramebuffer();
    this.backgroundImageProgram.drawToFramebuffer(imageDrawObject);
    this.backgroundImageProgram.unlink();

    const backgroundImage = this.backgroundImageProgram.getFramebufferTexture();
    const canvasMatrix = getProjectionViewMatrix({
      translation: [0, 0],
      scale: [1, 1],
      rotation: 0,
      origin: [0, 0]
    }, options.flipImageByYAxis);

    this.framebufferProgram.link();
    this.framebufferProgram.setMatrix(canvasMatrix);
    this.framebufferProgram.setWidth(this.canvas.width);
    this.framebufferProgram.setHeight(this.canvas.height);
    this.framebufferProgram.setDevicePixelRatio(this.devicePixelRatio);
    this.framebufferProgram.draw(backgroundImage);
    this.framebufferProgram.unlink();

    return backgroundImage;
  }

  renderBrushTouches(backgroundImage: WebGlTexture, touches: BrushTouch[], options: RenderOptions) {
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
    }, options.flipImageByYAxis);
    this.brushTouchProgram.link();
    this.brushTouchProgram.setMatrix(canvasMatrix);
    this.brushTouchProgram.setWidth(this.canvas.width);
    this.brushTouchProgram.setHeight(this.canvas.height);
    this.brushTouchProgram.setDevicePixelRatio(this.devicePixelRatio);
    this.brushTouchProgram.setBackgroundImageTexture(backgroundImage);
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
      const objectLayerMatrix = getProjectionViewMatrix(object, options.flipImageByYAxis);
      const imageDrawObject = toImageDrawObject(object, this.canvas);

      this.imageProgram.setMatrix(objectLayerMatrix);
      this.imageProgram.draw(imageDrawObject);
    }

    this.imageProgram.unlink();
  }
}

export interface ProjectionProperties {
  translation: [number, number];
  rotation: number;
  scale: [number, number];
  origin: [number, number];
}
export function getProjectionViewMatrix(state: ProjectionProperties, flipY: boolean = false): Matrix3 {
  const translationMatrix = translateMatrix3(createMatrix3(), [state.translation[0], state.translation[1]]);
  const rotationMatrix = rotateMatrix3(createMatrix3(), degreesToRadians(state.rotation));
  const scaleMatrix = scaleMatrix3(createMatrix3(), [state.scale[0], state.scale[1] * (flipY ? -1 : 1)]);
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
