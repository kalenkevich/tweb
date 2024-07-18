import {JSX, children, createSignal, createEffect, on, onCleanup, onMount, batch} from 'solid-js';
import {DraggingSurface, DragEventType, GrabEvent} from './surface';
import clamp from '../../../helpers/number/clamp';

export interface ResizibleProps {
  children: JSX.Element;
  enabled: boolean;
  surface: DraggingSurface;
  scale: [number, number];
  width: number;
  height: number;
  onChange: (translation: [number, number]) => void;
}
export function Resizible(props: ResizibleProps) {
  const [elRef, setElRef] = createSignal<HTMLDivElement>();
  const [startPos, setStartPos] = createSignal<[number, number]>();
  const [scale, setScale] = createSignal(props.scale);
  const [isResing, setIsResing] = createSignal(false);
  const isResizeEnabled = () => props.enabled;
  const surface = () => props.surface;
  const c = children(() => props.children);
  const width = () => props.width;
  const height = () => props.height;

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

  createEffect(on(() => props.scale, (newVal) => {
    setScale(newVal);
  }));

  const onDragStart = (pos: GrabEvent) => {
    const rootRect = surface().element.getBoundingClientRect();
    const eventX = clamp(pos.x - rootRect.left, 0, rootRect.width);
    const eventY = clamp(pos.y - rootRect.top, 0, rootRect.height);
    setStartPos([eventX, eventY]);
    setIsResing(true);
  };

  const onDragMove = (pos: GrabEvent) => {
    // if(!isResizeEnabled()) {
    //   return;
    // }

    if(isResing()) {
      resizeHandler(pos.x, pos.y, true);
    }
  };

  const onDragEnd = (pos: GrabEvent) => {
    // if(!isResizeEnabled()) {
    //   return;
    // }

    if(isResing()) {
      resizeHandler(pos.x, pos.y, true);
    }
    setStartPos(undefined);
    setIsResing(false);
  }

  const resizeHandler = (pageX: number, pageY: number, emitChangeEvent: boolean) => {
    const [startX, startY] = startPos();
    const rootRect = surface().element.getBoundingClientRect();
    const eventX = clamp(pageX - rootRect.left, 0, rootRect.width);
    const eventY = clamp(pageY - rootRect.top, 0, rootRect.height);
    const deltaX = (eventX - startX) * window.devicePixelRatio;
    const deltaY = (eventY - startY) * window.devicePixelRatio;

    const newScale: [number, number] = [scale()[0] + deltaX / width(), scale()[1] + deltaY / height()];

    batch(() => {
      setStartPos([eventX, eventY]);
      setScale(newScale);
    });

    if(emitChangeEvent) {
      props.onChange(newScale);
    }
  };

  return (
    <div ref={(el) => setElRef(el)}>
      {c()}
    </div>
  );
}
