import {CompatibleWebGLRenderingContext} from '../webglContext';

export enum TextureSourceType {
  IMAGE_BITMAP = 0,
  IMAGE_DATA = 1,
  IMAGE_ELEMENT = 2,
  UINT8_ARRAY_BUFFER = 3,
  UINT_8_CLAMPED_ARRAY_BUFFER = 4,
}

let currentTextureId = 0;

export type ArrayBufferTextureSource = Uint8ClampedArrayBufferTextureSource | Uint8ArrayBufferTextureSource;
export type ImageTextureSource = ImageBitmapTextureSource | ImageDataTextureSource | ImageElementTextureSource;
export type TextureSource = ArrayBufferTextureSource | ImageTextureSource;

// /** Bynary source of the image. */
export interface Uint8ClampedArrayBufferTextureSource {
  id: number; // Every texture should have uniq id to identify it (and set only once for example);
  name?: string;
  type: TextureSourceType.UINT_8_CLAMPED_ARRAY_BUFFER;
  width: number;
  height: number;
  data: Uint8ClampedArray;
}

/** Bynary source of the image. */
export interface Uint8ArrayBufferTextureSource {
  id: number;
  name?: string;
  type: TextureSourceType.UINT8_ARRAY_BUFFER;
  width: number;
  height: number;
  data: Uint8Array;
}

export interface CreateTextureSourceOptions {
  sharedMemory: boolean;
  flipY: boolean;
}

const DefaultCreateOptions: CreateTextureSourceOptions = {
  sharedMemory: false,
  flipY: false
};

export function createUint8TextureSource(
  source: Uint8Array,
  width: number,
  height: number,
  options: CreateTextureSourceOptions = DefaultCreateOptions
): Uint8ArrayBufferTextureSource {
  return {
    id: currentTextureId++,
    type: TextureSourceType.UINT8_ARRAY_BUFFER,
    width,
    height,
    data: source
  };
}

export function createImageDataTextureSource(
  source: Uint8ClampedArray,
  width: number,
  height: number,
  options: CreateTextureSourceOptions = DefaultCreateOptions
): ImageDataTextureSource {
  return {
    id: currentTextureId++,
    type: TextureSourceType.IMAGE_DATA,
    width,
    height,
    data: new ImageData(source, width, height)
  };
}

export function createImageElementTextureSource(
  source: HTMLImageElement | HTMLCanvasElement | OffscreenCanvas,
  width?: number,
  height?: number,
  options: CreateTextureSourceOptions = DefaultCreateOptions
): ImageElementTextureSource {
  return {
    id: currentTextureId++,
    type: TextureSourceType.IMAGE_ELEMENT,
    width: source.width,
    height: source.height,
    data: source
  };
}

// export async function blobToArrayBufferSource(sourceBlob: Blob): Promise<Uint8ClampedArrayBufferTextureSource> {
//   const sourceImage = await createImageBitmap(sourceBlob);
//   const canvas = new OffscreenCanvas(sourceImage.width, sourceImage.height);
//   const ctx = canvas.getContext('2d') as OffscreenCanvasRenderingContext2D;
//   const resultData = new Uint8ClampedArray(ctx.getImageData(0, 0, sourceImage.width, sourceImage.height).data.buffer);

//   return toUint8ClampedTextureSource(resultData, sourceImage.width, sourceImage.height);
// }

/** Bitmap image source. Ready to be used in canvas by GPU. */
export interface ImageBitmapTextureSource {
  id: number;
  name?: string;
  type: TextureSourceType.IMAGE_BITMAP;
  width: number;
  height: number;
  data: ImageBitmap | ImageData;
}

export interface ImageDataTextureSource {
  id: number;
  name?: string;
  type: TextureSourceType.IMAGE_DATA;
  width: number;
  height: number;
  data: ImageData;
}

export interface ImageElementTextureSource {
  id: number;
  name?: string;
  type: TextureSourceType.IMAGE_ELEMENT;
  width: number;
  height: number;
  data: HTMLImageElement | HTMLCanvasElement | OffscreenCanvas;
}

export interface CreateTextureOptions {
  name: string;
  textureIndex?: number;
  width?: number;
  height?: number;
  flipY?: boolean;
  premultiplyAlpha?: boolean;
  wrapS?: number;
  wrapT?: number;
  minFilter?: number;
  magFilter?: number;
  level?: number;
  type?: number;
  pixels?: ArrayBufferView;
  source?: ImageBitmapTextureSource | ImageDataTextureSource;
  internalFormat?: number;
  format?: number;
  alignment?: number;
}

export interface WebGlTexture {
  name: string;
  texture: WebGLTexture;
  index: number;
  width: number;
  height: number;
  level: number;
  setSource(source: ImageTextureSource): void;
  setPixels(texturePixels: ArrayBufferTextureSource): void;
  bind(): void;
  unbind(): void;
  destroy(): void;
}

/** Global countaer of all used textures. */
let CURRENT_TEXTURE_INDEX = 0;
const FREE_TEXTURE_INDICIES = new Set<number>();

export function resetTextureIndex() {
  CURRENT_TEXTURE_INDEX = 0;
}

export function getTextureIndex() {
  if(FREE_TEXTURE_INDICIES.size) {
    const val = [...FREE_TEXTURE_INDICIES][0];
    FREE_TEXTURE_INDICIES.delete(val);

    return val;
  }

  return CURRENT_TEXTURE_INDEX++;
}

/**
 * Creates a wrapper (facade) with better API for the webgl texture object.
 * @param gl - Compatible WebGL Rendering Context
 * @param options - creating options.
 * @returns wrapped webgl texture object
 */
export function createWebGlTexture(gl: CompatibleWebGLRenderingContext, options: CreateTextureOptions): WebGlTexture {
  const texture = gl.createTexture();
  const level = options.level || 0;
  const textureIndex = options.textureIndex !== undefined ? options.textureIndex : getTextureIndex();

  gl.activeTexture(gl.TEXTURE0 + textureIndex);
  gl.bindTexture(gl.TEXTURE_2D, texture);

  if(options.alignment) {
    gl.pixelStorei(gl.PACK_ALIGNMENT, options.alignment);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, options.alignment);
  }

  if(options.source !== undefined) {
    gl.texImage2D(
      gl.TEXTURE_2D,
      level,
      options.internalFormat || gl.RGBA,
      options.format || gl.RGBA,
      options.type || gl.UNSIGNED_BYTE,
      options.source.data
    );
  } else if(options.pixels !== undefined) {
    gl.texImage2D(
      gl.TEXTURE_2D,
      level,
      options.internalFormat || gl.RGBA,
      options.width,
      options.height,
      0, // border
      options.format || gl.RGBA,
      options.type || gl.UNSIGNED_BYTE,
      options.pixels
    );
  }

  if(options.premultiplyAlpha) {
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  }
  if(options.flipY) {
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  }
  if(options.wrapS !== undefined) {
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, options.wrapS);
  }
  if(options.wrapT !== undefined) {
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, options.wrapT);
  }
  if(options.minFilter !== undefined) {
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, options.minFilter);
  }
  if(options.magFilter !== undefined) {
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, options.magFilter);
  }
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, null);

  return {
    name: options.name,
    texture,
    index: textureIndex,
    width: options.width,
    height: options.height,
    level,
    setSource(source: ImageTextureSource) {
      gl.texImage2D(
        gl.TEXTURE_2D,
        level,
        options.internalFormat || gl.RGBA,
        options.format || gl.RGBA,
        options.type || gl.UNSIGNED_BYTE,
        source.data
      );
    },
    setPixels(texturePixels: ArrayBufferTextureSource) {
      gl.texImage2D(
        gl.TEXTURE_2D,
        level,
        options.internalFormat || gl.RGBA,
        texturePixels.width,
        texturePixels.height,
        0, // border
        options.format || gl.RGBA,
        options.type || gl.UNSIGNED_BYTE,
        texturePixels.data
      );
    },
    bind() {
      gl.activeTexture(gl.TEXTURE0 + textureIndex);
      gl.bindTexture(gl.TEXTURE_2D, texture);
    },
    unbind() {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, null);
    },
    destroy() {
      FREE_TEXTURE_INDICIES.add(textureIndex);
    }
  };
}

