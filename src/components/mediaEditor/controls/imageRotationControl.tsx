import {JSX, For, createSignal, onMount, Show, createEffect, on, onCleanup} from 'solid-js';
import {ImageChangeType, FlipImageDirection} from '../types';
import {ImageControlProps} from './imageControl';
import {ButtonIconTsx} from '../../buttonIconTsx';
import {IconTsx} from '../../iconTsx';
import clamp from '../../../helpers/number/clamp';
import attachGrabListeners from '../../../helpers/dom/attachGrabListeners';

export const ROTATE_CARUSEL_HEIGHT = 60;
export const ROTATE_CARUSEL_PADDING = 20;
export const ROTATE_CARUSEL_ACTUAL_HEIGHT = ROTATE_CARUSEL_HEIGHT + ROTATE_CARUSEL_PADDING;

const getRangeBasedOnWidth = (width: number): number => {
  if(width >= 0 && width <= 400) {
    return 15;
  }

  if(width > 400 && width <= 800) {
    return 30;
  }

  if(width > 800 && width <= 1200) {
    return 45;
  }

  return 90;
}

const generateStepsFromAngle = (centerAngle: number, range: number = 90, stepMilestone: number = 15) => {
  const result = [];

  for(let i = centerAngle - range; i <= centerAngle + range; i++) {
    let angle = centerAngle + i;
    if(angle >= 360) {
      angle = -(angle % 360);
    } else if(angle <= -360) {
      angle = -(angle % 360);
    }

    result.push({
      value: angle,
      milestole: angle % stepMilestone === 0,
      center: i === centerAngle,
      opacity: 1.1 - Math.abs(i - centerAngle) / range
    });
  }

  return result;
}

export interface ImageRotationControlProps extends ImageControlProps {}

export function ImageRotationControl(props: ImageRotationControlProps): JSX.Element {
  const [currentAngle, setCurrentAngle] = createSignal(props.imageState.rotation);
  const [caruselRef, setCaruselRef] = createSignal<HTMLDivElement>();
  const [rootRef, setRootRef] = createSignal<HTMLDivElement>();
  const [startPosX, setStartPos] = createSignal<number | undefined>();
  const [startAngle, setStartAngle] = createSignal<number | undefined>();
  const [steps, setSteps] = createSignal([]);

  createEffect(on(() => props.imageState.rotation, (val) => {
    setCurrentAngle(val);
    updateSteps();
  }));

  onMount(() => {
    window.addEventListener('resize', updateSteps);

    rootRef().style.setProperty('--rotation-control-height', `${ROTATE_CARUSEL_HEIGHT}px`);

    if(props.isMobile) {
      rootRef().style.setProperty('--rotation-control-padding-top', `${ROTATE_CARUSEL_PADDING / 2}px`);
      rootRef().style.setProperty('--rotation-control-padding-bottom', `${ROTATE_CARUSEL_PADDING / 2}px`);
    } else {
      rootRef().style.setProperty('--rotation-control-padding-top', `${0}px`);
      rootRef().style.setProperty('--rotation-control-padding-bottom', `${ROTATE_CARUSEL_PADDING}px`);
    }

    attachGrabListeners(caruselRef() as any, (pos) => {
      onGrabStart();

      const caruselRect = caruselRef().getBoundingClientRect();
      const eventX = clamp(pos.x - caruselRect.left, 0, caruselRect.width);
      setStartPos(eventX);
      setStartAngle(currentAngle());
    }, (pos) => {
      caruselRotateHandler(pos.x);
    }, () => {
      onGrabEnd();
    });

    setTimeout(() => {
      updateSteps();
    }, 0);
  });

  onCleanup(() => {
    window.removeEventListener('resize', updateSteps);
  });

  const caruselRotateHandler = (pageX: number) => {
    const caruselRect = caruselRef().getBoundingClientRect();
    const eventX = clamp(pageX - caruselRect.left, 0, caruselRect.width);
    const deltaX = (eventX - startPosX()) / window.devicePixelRatio;
    const angleDelta = Math.floor(180 * (deltaX / caruselRect.width));

    const newAngle = startAngle() - angleDelta;
    setCurrentAngle(newAngle);
    updateSteps();
    props.onImageChange({
      type: ImageChangeType.rotate,
      value: newAngle
    });
  };

  const updateSteps = () => {
    setSteps(generateStepsFromAngle(currentAngle() / 2, getRangeBasedOnWidth(rootRef().offsetWidth)));
  };

  const onGrabStart = () => {
    document.documentElement.style.cursor = caruselRef().style.cursor = 'grabbing';
  };

  const onGrabEnd = () => {
    caruselRef().style.cursor = 'grab';
    document.documentElement.style.cursor = '';
  };

  return (
    <div class="image-editor__image-control rotation-control" ref={(el) => setRootRef(el)}>
      <div class="rotation-control__container">
        <ButtonIconTsx
          icon="rotate"
          asSvgIcon={true}
          onClick={() => {
            props.onImageChange({
              type: ImageChangeType.rotate,
              value: currentAngle() - 90,
              animation: true
            });
          }}
        />
        <div class="angle-carusel" ref={el => setCaruselRef(el)}>
          <div class="center-mark">
            <IconTsx icon="angle-carusel-center-mark" asSvgIcon={true}/>
          </div>
          <For each={steps()}>
            {(step) => (
              <span class="step">
                <div class="step__label"
                  style={{opacity: step.opacity}}>
                  <Show when={step.milestole} fallback={''}>
                    {step.value}
                    <span class="degree-char">°</span>
                  </Show>
                </div>
                <div class="step__circle" classList={{
                  'milestone': step.milestole,
                  'center': step.center
                }}></div>
              </span>
            )}
          </For>
        </div>
        <ButtonIconTsx
          icon="flip"
          asSvgIcon={true}
          onClick={() => {
            props.onImageChange({
              type: ImageChangeType.flip,
              alignment: FlipImageDirection.horisontal,
              animation: true
            });
          }}
        />
      </div>
    </div>
  );
}
