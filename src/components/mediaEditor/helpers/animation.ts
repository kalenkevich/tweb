export interface PositionAnimationOptions {
  durationInSec?: number;
  easeLinearity?: number;
}

export const DEFAULT_ANIMATION_OPTIONS: PositionAnimationOptions = {
  durationInSec: 0.25,
  easeLinearity: 0.5
}

export const easeOut = (t: number, power: number): number => {
  return 1 - Math.pow(1 - t, power);
};

export type AnimationStep = (progress: number) => void;

export function easyAnimation(
  step: AnimationStep,
  done: () => void = () => {},
  animationOptions: PositionAnimationOptions = DEFAULT_ANIMATION_OPTIONS): number {
  const durationInSec = animationOptions.durationInSec || 0.25;
  const easeOutPower = 1 / Math.max(animationOptions.easeLinearity || 0.5, 0.2);

  const startTime = +new Date();
  const runInAnimationFrame = () => {
    const elapsed = +new Date() - startTime;
    const durationInMs = durationInSec * 1000;

    if(elapsed < durationInMs) {
      step(easeOut(elapsed / durationInMs, easeOutPower));
      requestAnimationFrame(runInAnimationFrame);
    } else {
      done();
    }
  }

  return requestAnimationFrame(runInAnimationFrame);
}
