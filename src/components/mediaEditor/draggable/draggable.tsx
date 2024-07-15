import {JSX, children, createSignal, createEffect, on, onCleanup, onMount} from 'solid-js';
import {DraggingSurface, DragEventType, GrabEvent} from './surface';
import clamp from '../../../helpers/number/clamp';

export interface DraggableProps {
  children: JSX.Element;
  enabled: boolean;
  surface: DraggingSurface;
  translation: [number, number];
  scale: [number, number];
  rotation: number;
  onClick: () => void;
  onChange: (translation: [number, number]) => void;
}
export function Draggable(props: DraggableProps) {
  const [elRef, setElRef] = createSignal<HTMLDivElement>();
  const [startPos, setStartPos] = createSignal<[number, number]>();
  const [translation, setTranslation] = createSignal(props.translation);
  const [isDragging, setIsDragging] = createSignal(false);
  const isDraggingEnabled = () => props.enabled;
  const surface = () => props.surface;
  const scale = () => props.scale;
  const rotation = () => props.rotation;
  const c = children(() => props.children);

  onMount(() => {
    surface().subscribe(DragEventType.DragStart, onDragStart);
    surface().subscribe(DragEventType.DragMove, onDragMove);
    surface().subscribe(DragEventType.DragEnd, onDragEnd);
  });

  onCleanup(() => {
    surface().unsubscribe(DragEventType.DragStart, onDragStart);
    surface().unsubscribe(DragEventType.DragMove, onDragMove);
    surface().unsubscribe(DragEventType.DragEnd, onDragEnd);
  });

  createEffect(on(() => props.translation, (newVal) => {
    setTranslation(newVal);
    updateElement();
  }));

  createEffect(on(() => [
    props.scale,
    props.rotation
  ], () => {
    updateElement();
  }));

  const onDragStart = (pos: GrabEvent) => {
    if(!isDraggingEnabled()) {
      return;
    }

    const rootRect = surface().element.getBoundingClientRect();
    const eventX = clamp(pos.x - rootRect.left, 0, rootRect.width);
    const eventY = clamp(pos.y - rootRect.top, 0, rootRect.height);
    setStartPos([eventX, eventY]);
    setIsDragging(true);
    document.documentElement.style.cursor = elRef().style.cursor = 'grabbing';
  };

  const onDragMove = (pos: GrabEvent) => {
    if(!isDraggingEnabled()) {
      return;
    }

    if(isDragging()) {
      moveHandler(pos.x, pos.y, false);
    }
    updateElement();
    document.documentElement.style.cursor = elRef().style.cursor = 'grabbing';
  };

  const onDragEnd = (pos: GrabEvent) => {
    if(!isDraggingEnabled()) {
      return;
    }

    if(isDragging()) {
      moveHandler(pos.x, pos.y, true);
    }
    setStartPos(undefined);
    setIsDragging(false);
    elRef().style.cursor = 'grab';
    document.documentElement.style.cursor = '';
  }

  const updateElement = () => {
    elRef().style.position = 'absolute';
    elRef().style.top = '0';
    elRef().style.left = '0';
    elRef().style.display = 'block';
    elRef().style.cursor = 'grab';
    const translationX = (translation()[0] - elRef().offsetWidth / 2) / window.devicePixelRatio;
    const translationY = (translation()[1] - elRef().offsetHeight / 2) / window.devicePixelRatio;
    elRef().style.transform = `translateX(${translationX}px) translateY(${translationY}px) rotateZ(${rotation()}deg) scaleX(${scale()[0]}) scaleY(${scale()[1]})`;
  };

  const moveHandler = (pageX: number, pageY: number, emitChangeEvent: boolean) => {
    const [startX, startY] = startPos();
    const rootRect = surface().element.getBoundingClientRect();
    const eventX = clamp(pageX - rootRect.left, 0, rootRect.width);
    const eventY = clamp(pageY - rootRect.top, 0, rootRect.height);
    const deltaX = (eventX - startX) * window.devicePixelRatio;
    const deltaY = (eventY - startY) * window.devicePixelRatio;

    setStartPos([eventX, eventY]);
    setTranslation([translation()[0] + deltaX, translation()[1] + deltaY]);

    if(emitChangeEvent) {
      props.onChange(translation());
    }
  };

  return (
    <div ref={(el) => setElRef(el)} onClick={props.onClick}>
      {c()}
    </div>
  );
}
