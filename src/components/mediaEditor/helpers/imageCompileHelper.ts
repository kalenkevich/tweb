import {DrawLayer, ImageState, StickerLayer, TextLayer} from '../types';
import {renderTextLayerMultiline} from './textHelper';
import {Document} from '../../../layer';
import rootScope from '../../../lib/rootScope';
import wrapSticker from '../../wrappers/sticker';
import lottieLoader from '../../../lib/rlottie/lottieLoader';
import RLottiePlayer from '../../../lib/rlottie/rlottiePlayer';
import appDownloadManager from '../../../lib/appManagers/appDownloadManager';
import getStickerEffectThumb from '../../../lib/appManagers/utils/stickers/getStickerEffectThumb';
import {createImageElementTextureSource, ImageElementTextureSource} from '../webgl/helpers/webglTexture';

export function precompileTextObjects(
  canvasWidth: number,
  canvasHeight: number,
  imageState: ImageState,
  textObjects: TextLayer[]
): Promise<TextLayer[]> {
  return Promise.all(
    textObjects.map(textObj => renderTextLayerMultiline(textObj.text, textObj).then(texture => {
      return {
        ...adjustObject(canvasWidth, canvasHeight, imageState, textObj),
        texture,
        width: texture.width,
        height: texture.height
      } as TextLayer;
    }))
  );
}

export interface AnimatedStickerData {
  el: HTMLElement;
  doc: Document.document;
  object: StickerLayer;
  sourceData: Blob;
  fps: number;
  totalFrames: number;
  animationPlayer: RLottiePlayer;
}

export interface StaticStickerData {
  el: HTMLElement;
  doc: Document.document;
  object: StickerLayer;
  sourceData: Blob;
}

export interface PrecompiledStickersInfo {
  staticStickers: StaticStickerData[];
  animatedStickers: AnimatedStickerData[];
}

export async function precompileStickerObjects(
  canvasWidth: number,
  canvasHeight: number,
  imageState: ImageState,
  stickerObjects: StickerLayer[]
): Promise<PrecompiledStickersInfo> {
  const staticStickers: StaticStickerData[] = [];
  const animatedStickers: AnimatedStickerData[] = [];

  await Promise.all(
    stickerObjects.map(stickerObj => rootScope.managers.appDocsManager.getDoc(stickerObj.stickerId).then(async(doc) => {
      const el = document.createElement('div');
      const sourceData = await appDownloadManager.downloadMedia({
        media: doc,
        thumb: getStickerEffectThumb(doc)
      });

      if(doc.sticker === 2 && doc.animated === true) {
        let fps: number;
        let totalFrames: number;
        const animationPlayer = await lottieLoader.loadAnimationWorker({
          container: el,
          loop: false,
          autoplay: false,
          animationData: sourceData,
          width: 512,
          height: 512,
          name: 'doc' + doc.id,
          needUpscale: true,
          toneIndex: -1,
          sync: false,
          group: 'none',
          initFrame: 0
        });
        await new Promise<void>((resolve) => {
          animationPlayer.addEventListener('ready', (stickerTotalFrames: number, stickerFps: number) => {
            fps = stickerFps;
            totalFrames = stickerTotalFrames;
            animationPlayer.stop();
            resolve();
          });
        });

        animatedStickers.push({
          doc,
          object: adjustObject(canvasWidth, canvasHeight, imageState, stickerObj) as StickerLayer,
          el,
          sourceData,
          fps,
          totalFrames,
          animationPlayer
        });
      } else {
        const staticStickerInfo = {
          doc,
          object: adjustObject(canvasWidth, canvasHeight, imageState, stickerObj) as StickerLayer,
          el,
          sourceData
        };
        const texture = await renderStaticSticker(staticStickerInfo);
        staticStickerInfo.object.texture = texture;
        staticStickers.push(staticStickerInfo);
      }
    }))
  );

  return {
    staticStickers,
    animatedStickers
  };
}

export async function renderStaticSticker(staticStickerInfo: StaticStickerData): Promise<ImageElementTextureSource> {
  await wrapSticker({
    doc: staticStickerInfo.doc,
    div: staticStickerInfo.el,
    group: 'none',
    width: staticStickerInfo.object.width * window.devicePixelRatio,
    height: staticStickerInfo.object.height * window.devicePixelRatio
  });
  const img = staticStickerInfo.el.children[0] as HTMLImageElement;

  await new Promise<void>((resolve) => {
    if(img.complete) {
      resolve();
    } else {
      img.addEventListener('load', () => resolve());
    }
  });

  return createImageElementTextureSource(img);
}

export async function renderAnimatedStickerFrame(animatedSticker: AnimatedStickerData, frameIndex: number): Promise<ImageElementTextureSource> {
  return new Promise<ImageElementTextureSource>((resolve) => {
    const frame = frameIndex % animatedSticker.totalFrames;
    animatedSticker.animationPlayer.playPart({
      from: frame,
      to: frame,
      callback: () => {
        const texture = createImageElementTextureSource(animatedSticker.animationPlayer.canvas[0] as HTMLCanvasElement);
        resolve(texture);
      }
    });
  });
}

export function adjustObject(
  canvasWidth: number,
  canvasHeight: number,
  imageState: ImageState,
  obj: TextLayer | StickerLayer
): TextLayer | StickerLayer {
  const scaleX = imageState.resultWidth / canvasWidth;
  const scaleY = imageState.resultHeight / canvasHeight;

  return {
    ...obj,
    width: obj.width * window.devicePixelRatio,
    height: obj.height * window.devicePixelRatio,
    translation: [
      obj.translation[0] * scaleX,
      obj.translation[1] * scaleY
    ] as [number, number],
    origin:[
      obj.origin[0],
      obj.origin[1]
    ] as [number, number],
    scale: [scaleX, scaleY] as [number, number]
  }
}

export function adjustDrawLayer(
  canvasWidth: number,
  canvasHeight: number,
  imageState: ImageState,
  drawLayer: DrawLayer
): DrawLayer {
  const scaleX = imageState.resultWidth / canvasWidth;
  const scaleY = imageState.resultHeight / canvasHeight;

  return {
    ...drawLayer,
    touches: drawLayer.touches.map(t => {
      return {
        ...t,
        x: t.x * scaleX,
        y: t.y * scaleY,
        size: t.size * scaleX
      }
    })
  };
}
