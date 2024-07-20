import {JSX, children, createSignal, createEffect, on, onCleanup, onMount, Show, batch} from 'solid-js';
import {DraggingSurface, DragEventType, GrabEvent} from './surface';
import clamp from '../../../helpers/number/clamp';
import {getLineDirection, Direction} from '../helpers/mathHelper';

export enum DraggableMode {
  move = 'move',
  resize = 'resize',
  rotate = 'rotate'
}

export enum ResizeAnchorPosition {
  topLeft = 'topLeft',
  topRight = 'topRight',
  bottomLeft = 'bottomLeft',
  bottomRight = 'bottomRight'
}

export interface DraggableProps {
  children: JSX.Element;
  surface: DraggingSurface;
  active: boolean;
  movable: boolean;
  resizable: boolean;
  rotatable: boolean;
  translation: [number, number];
  scale: [number, number];
  rotation: number;
  onClick?: () => void;
  onMove: (translation: [number, number]) => void;
  onResize: (scale: [number, number]) => void;
  onRotate: (rotation: number) => void;
}
export function Draggable(props: DraggableProps) {
  const [elRef, setElRef] = createSignal<HTMLDivElement>();
  const [mode, setCurrentMode] = createSignal<DraggableMode>(DraggableMode.move);
  const [startPos, setStartPos] = createSignal<[number, number]>();
  const [isDragging, setIsDragging] = createSignal(false);
  const [translation, setTranslation] = createSignal(props.translation);
  const [scale, setScale] = createSignal(props.scale);
  const [selectedResizeAnchor, setSelectedResizeAnchor] = createSignal<HTMLDivElement>();
  const surface = () => props.surface;
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
    const rootRect = surface().element.getBoundingClientRect();
    const eventX = clamp(pos.x - rootRect.left, 0, rootRect.width);
    const eventY = clamp(pos.y - rootRect.top, 0, rootRect.height);

    batch(() => {
      setStartPos([eventX, eventY]);
      setIsDragging(true);
    });

    document.documentElement.style.cursor = elRef().style.cursor = 'grabbing';
  };

  const onDragMove = (pos: GrabEvent) => {
    if(!props.active) {
      return;
    }

    if(isDragging()) {
      dragHandler(pos.x, pos.y, false);
      updateElement();
      document.documentElement.style.cursor = elRef().style.cursor = 'grabbing';
    } else {
      console.log();
    }
  };

  const onDragEnd = (pos: GrabEvent) => {
    if(!props.active) {
      return;
    }

    if(isDragging()) {
      dragHandler(pos.x, pos.y, true);
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

  const dragHandler = (pageX: number, pageY: number, emitChangeEvent: boolean) => {
    const [startX, startY] = startPos();
    const rootRect = surface().element.getBoundingClientRect();
    const eventX = clamp(pageX - rootRect.left, 0, rootRect.width);
    const eventY = clamp(pageY - rootRect.top, 0, rootRect.height);
    const deltaX = (eventX - startX) * window.devicePixelRatio;
    const deltaY = (eventY - startY) * window.devicePixelRatio;
    const direction = getLineDirection([startX, startY], [eventX, eventY]);
    const draggingMode = mode();

    if(draggingMode === DraggableMode.move) {
      moveHandler(deltaX, deltaY, emitChangeEvent);
    } else if(draggingMode === DraggableMode.resize) {
      resizeHandler(deltaX, deltaY, direction, emitChangeEvent);
    } else if(draggingMode === DraggableMode.rotate) {
      rotateHandler(deltaX, deltaY, emitChangeEvent);
    }

    setStartPos([eventX, eventY]);
  };

  const moveHandler = (deltaX: number, deltaY: number, emitChangeEvent: boolean) => {
    const newTranslation: [number, number] = [translation()[0] + deltaX, translation()[1] + deltaY];

    setTranslation(newTranslation);

    if(emitChangeEvent) {
      props.onMove(newTranslation);
    }
  };

  const resizeHandler = (deltaX: number, deltaY: number, direction: Direction, emitChangeEvent: boolean) => {
    const elWidth = elRef().offsetWidth;
    const elHeight = elRef().offsetHeight;
    const deltaScaleX = Math.abs(deltaX) / elWidth;
    const deltaScaleY = Math.abs(deltaY) / elHeight;
    const deltaScale = Math.min(deltaScaleX, deltaScaleY);
    const pos = selectedResizeAnchor().dataset['anchorPosition'] as ResizeAnchorPosition;
    let scaleX = scale()[0];
    let scaleY = scale()[1];

    if(pos === ResizeAnchorPosition.topLeft) {
      if(direction === Direction.topLeft) {
        scaleX += deltaScale;
        scaleY += deltaScale;
      } else if(direction === Direction.bottomRight) {
        scaleX -= deltaScale;
        scaleY -= deltaScale;
      }
    } else if(pos === ResizeAnchorPosition.topRight) {
      if(direction === Direction.topRight) {
        scaleX += deltaScale;
        scaleY += deltaScale;
      } else if(direction === Direction.bottomLeft) {
        scaleX -= deltaScale;
        scaleY -= deltaScale;
      }
    } else if(pos === ResizeAnchorPosition.bottomRight) {
      if(direction === Direction.bottomRight) {
        scaleX += deltaScale;
        scaleY += deltaScale;
      } else if(direction === Direction.topLeft) {
        scaleX -= deltaScale;
        scaleY -= deltaScale;
      }
    } else if(pos === ResizeAnchorPosition.bottomLeft) {
      if(direction === Direction.bottomLeft) {
        scaleX += deltaScale;
        scaleY += deltaScale;
      } else if(direction === Direction.bottomRight) {
        scaleX -= deltaScale;
        scaleY -= deltaScale;
      }
    }

    setScale([scaleX, scaleY]);

    if(emitChangeEvent) {
      props.onResize([scaleX, scaleY]);
    }
  };

  const rotateHandler = (deltaX: number, deltaY: number, emitChangeEvent: boolean) => {

  };

  const onClick = (e: Event) => {
    if(e.target === elRef()) {
      setCurrentMode(DraggableMode.move);
    }

    props.onClick?.();
  };

  const onResizeAnchorClick = (e: MouseEvent | TouchEvent) => {
    let x;
    let y;
    if((e as TouchEvent).touches || (e as TouchEvent).changedTouches) {
      const touch = (e as TouchEvent).touches[0] || (e as TouchEvent).changedTouches[0];
      x = touch.clientX;
      y = touch.clientY;
    } else {
      x = (e as MouseEvent).clientX;
      y = (e as MouseEvent).clientY;
    }

    setCurrentMode(DraggableMode.resize);
    setSelectedResizeAnchor(e.target as HTMLDivElement);

    document.documentElement.style.cursor = (e.target as HTMLDivElement).style.cursor;
  };

  const onRotateAnchorClick = () => {
    setCurrentMode(DraggableMode.resize);
  };

  return (
    <div ref={(el) => setElRef(el)}
      class="draggable-object"
      onMouseDown={onClick}>
      <Show when={props.resizable}>
        <div class="resize-anchor resize-anchor--top-left"
          data-anchor-position={ResizeAnchorPosition.topLeft}
          onMouseDown={onResizeAnchorClick}
          onTouchStart={onResizeAnchorClick}>
        </div>
        <div class="resize-anchor resize-anchor--top-right"
          data-anchor-position={ResizeAnchorPosition.topRight}
          onMouseDown={onResizeAnchorClick}
          onTouchStart={onResizeAnchorClick}>
        </div>
        <div class="resize-anchor resize-anchor--bottom-left"
          data-anchor-position={ResizeAnchorPosition.bottomLeft}
          onMouseDown={onResizeAnchorClick}
          onTouchStart={onResizeAnchorClick}>
        </div>
        <div class="resize-anchor resize-anchor--bottom-right"
          data-anchor-position={ResizeAnchorPosition.bottomRight}
          onMouseDown={onResizeAnchorClick}
          onTouchStart={onResizeAnchorClick}>
        </div>
      </Show>
      <Show when={props.rotatable}>
        <div class="rotate-anchor"
          onMouseDown={onRotateAnchorClick}></div>
      </Show>
      {c()}
    </div>
  );
}
