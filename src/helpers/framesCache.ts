/*
 * https://github.com/morethanwords/tweb
 * Copyright (C) 2019-2021 Eduard Kuzmenko
 * https://github.com/morethanwords/tweb/blob/master/LICENSE
 */

import type {RLottieColor} from '../lib/rlottie/rlottiePlayer';
import {LRUMap} from './lruMap';
import {IS_MOBILE} from '../environment/userAgent';

export type FramesCacheMap = Map<number, Uint8ClampedArray>;
export type FramesCacheMapNew = Map<number, HTMLCanvasElement | ImageBitmap>;
export type FramesCacheMapURLs = Map<number, string>;
export type FramesCacheItem = {
  frames: FramesCacheMap,
  framesNew: FramesCacheMapNew,
  framesURLs: FramesCacheMapURLs,
  clearCache: () => void,
  counter: number
};

const DEFAULT_CACHE_SIZE = IS_MOBILE ? 128 : 128;

export class FramesCache {
  private cache: Map<string, FramesCacheItem>;

  constructor() {
    this.cache = new Map();
  }

  public static createCache(cacheSize: number = DEFAULT_CACHE_SIZE): FramesCacheItem {
    const cache: FramesCacheItem = {
      frames: new LRUMap<number, Uint8ClampedArray>(cacheSize),
      framesNew: new LRUMap<number, HTMLCanvasElement | ImageBitmap>(cacheSize),
      framesURLs: new LRUMap<number, string>(cacheSize),
      clearCache: () => {
        cache.framesNew.forEach((value) => {
          (value as ImageBitmap).close?.();
        });

        cache.frames.clear();
        cache.framesNew.clear();
        cache.framesURLs.clear();
      },
      counter: 0
    };

    return cache;
  }

  public getCache(name: string) {
    let cache = this.cache.get(name);
    if(!cache) {
      this.cache.set(name, cache = FramesCache.createCache());
    } else {
      // console.warn('[RLottieCache] cache will be reused', cache);
    }

    ++cache.counter;
    return cache;
  }

  public releaseCache(name: string) {
    const cache = this.cache.get(name);
    if(cache && !--cache.counter) {
      this.cache.delete(name);
      // console.warn('[RLottieCache] released cache', cache);
    }
  }

  public getCacheCounter(name: string) {
    const cache = this.cache.get(name);
    return cache?.counter;
  }

  public generateName(name: string, width: number, height: number, color: RLottieColor, toneIndex: number) {
    return [
      name,
      width,
      height,
      // color ? rgbaToHexa(color) : ''
      // color ? 'colored' : '',
      toneIndex || ''
    ].filter(Boolean).join('-');
  }
}

const framesCache = new FramesCache();

export default framesCache;
