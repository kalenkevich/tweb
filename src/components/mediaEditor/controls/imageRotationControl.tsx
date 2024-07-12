import {JSX, For, createSignal, onMount, Show, createEffect, on} from 'solid-js';
import {ImageChangeType} from '../types';
import {ImageControlProps} from './imageControl';
import {ButtonIconTsx} from '../../buttonIconTsx';
import {IconTsx} from '../../iconTsx';
import clamp from '../../../helpers/number/clamp';
import attachGrabListeners from '../../../helpers/dom/attachGrabListeners';

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
  const [currentAngle, setCurrentAngle] = createSignal(props.imageState.rotateAngle);
  const [caruselRef, setCaruselRef] = createSignal<HTMLDivElement>();
  const [startPosX, setStartPos] = createSignal<number | undefined>();
  const [startAngle, setStartAngle] = createSignal<number | undefined>();
  const steps = () => generateStepsFromAngle(currentAngle() / 2);

  createEffect(on(() => props.imageState.rotateAngle, (val) => {
    setCurrentAngle(val);
  }))

  onMount(() => {
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
  });

  const caruselRotateHandler = (pageX: number) => {
    const caruselRect = caruselRef().getBoundingClientRect();
    const eventX = clamp(pageX - caruselRect.left, 0, caruselRect.width);
    const deltaX = (eventX - startPosX()) / window.devicePixelRatio;
    const angleDelta = Math.floor(180 * (deltaX / caruselRect.width));

    const newAngle = startAngle() - angleDelta;
    setCurrentAngle(newAngle);
    props.onImageChange({
      type: ImageChangeType.rotate,
      value: newAngle
    });
  };

  const onGrabStart = () => {
    document.documentElement.style.cursor = caruselRef().style.cursor = 'grabbing';
  };

  const onGrabEnd = () => {
    caruselRef().style.cursor = 'grab';
    document.documentElement.style.cursor = '';
  };

  return (
    <div class="image-editor__image-control rotation-control">
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
              type: ImageChangeType.flipHorisontaly
            });
          }}
        />
      </div>
    </div>
  );
}
