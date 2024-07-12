import {createSignal, createEffect, on, onMount, children, JSX} from 'solid-js';
import {ImageChangeType} from '../types';
import {ImageControlProps} from './imageControl';
import {ImageState} from '../types';
import clamp from '../../../helpers/number/clamp';
import attachGrabListeners from '../../../helpers/dom/attachGrabListeners';

export interface ImageConunterpartControlProps extends ImageControlProps {
  enabled: boolean;
  children?: JSX.Element;
}

export function ImageConunterpartControl(props: ImageConunterpartControlProps) {
  const isEnabled = () => props.enabled;
  const [rootEl, setRootEl] = createSignal<HTMLDivElement>();
  const [elRef, setElRef] = createSignal<HTMLDivElement>();
  const [startPos, setStartPos] = createSignal<[number, number]>();
  const c = children(() => props.children);

  onMount(() => {
    updateElement(props.imageState);

    rootEl().style.position = 'relative';
    rootEl().style.display = 'block';
    rootEl().style.width = '100%';
    rootEl().style.height = '100%';

    attachGrabListeners(rootEl() as any, (pos) => {
      if(!isEnabled()) {
        return;
      }

      onGrabStart();

      const rootRect = rootEl().getBoundingClientRect();
      const eventX = clamp(pos.x - rootRect.left, 0, rootRect.width);
      const eventY = clamp(pos.y - rootRect.top, 0, rootRect.height);
      setStartPos([eventX, eventY]);
    }, (pos) => {
      if(isEnabled()) {
        imageMoveHandler(pos.x, pos.y);
      }
    }, () => {
      if(!isEnabled()) {
        return;
      }
      setStartPos(undefined);

      onGrabEnd();
    });
  });

  createEffect(on(() => props.enabled, (enabled) => {
    if(enabled) {
      elRef().style.cursor = 'grab';
    } else {
      elRef().style.cursor = '';
    }
  }));

  createEffect(on(() => props.imageState, (currentImageState) => {
    updateElement(currentImageState);
  }));

  const imageMoveHandler = (pageX: number, pageY: number) => {
    const [startX, startY] = startPos();
    const rootRect = rootEl().getBoundingClientRect();
    const eventX = clamp(pageX - rootRect.left, 0, rootRect.width);
    const eventY = clamp(pageY - rootRect.top, 0, rootRect.height);
    const deltaX = (eventX - startX);
    const deltaY = (eventY - startY);

    setStartPos([eventX, eventY]);
    props.onImageChange({
      type: ImageChangeType.move,
      deltaX,
      deltaY,
      animation: false
    });
  };

  const updateElement = (state: ImageState) => {
    elRef().style.position = 'absolute';
    elRef().style.top = '0';
    elRef().style.left = '0';
    elRef().style.display = 'block';
    elRef().style.width = `${state.width / window.devicePixelRatio}px`;
    elRef().style.height = `${state.height / window.devicePixelRatio}px`;
    const translationX = (state.translation[0] + state.origin[0]) / window.devicePixelRatio;
    const translationY = (state.translation[1] + state.origin[1]) / window.devicePixelRatio;
    elRef().style.transform = `translateX(${translationX}px) translateY(${translationY}px) rotateZ(${state.rotateAngle}deg) scaleX(${state.scale[0]}) scaleY(${state.scale[1]})`;
  };

  const onGrabStart = () => {
    document.documentElement.style.cursor = elRef().style.cursor = 'grabbing';
  };

  const onGrabEnd = () => {
    elRef().style.cursor = 'grab';
    document.documentElement.style.cursor = '';
  };

  return (
    <div class="conunterpart-control-wrapper" ref={el => setRootEl(el)}>
      {c()}
      <div class="image-conunterpart" ref={el => setElRef(el)}></div>
    </div>
  );
}
