import {JSX, children, createSignal, onCleanup, onMount, Show, batch, createEffect, on} from 'solid-js';
import {DraggingSurface, DragEventType, GrabEvent} from './surface';
import clamp from '../../../helpers/number/clamp';
import {IconTsx} from '../../iconTsx';
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
  class?: string;
  ref?: (el: HTMLDivElement) => void;
  surface: DraggingSurface;
  active: boolean;
  movable: boolean;
  resizable: boolean;
  rotatable: boolean;
  removable: boolean;
  translation: [number, number];
  scale: [number, number];
  rotation: number;
  origin: [number, number];
  onClick?: (e: Event) => void;
  onMove?: (translation: [number, number]) => void;
  onResize?: (scale: [number, number], elRect?: DOMRect) => void;
  onRotate?: (rotation: number) => void;
  onRemove?: () => void;
}
export function Draggable(props: DraggableProps) {
  const [elRef, setElRef] = createSignal<HTMLDivElement>();
  const [mode, _setCurrentMode] = createSignal<DraggableMode>(DraggableMode.move);
  const [startPos, setStartPos] = createSignal<[number, number]>();
  const [startAngle, setStartAngle] = createSignal(0);
  const [isDragging, setIsDragging] = createSignal(false);
  const [translation, setTranslation] = createSignal(props.translation);
  const [scale, setScale] = createSignal(props.scale);
  const [rotation, setRotation] = createSignal(props.rotation);
  const [origin, setOrigin] = createSignal(props.origin);
  const [selectedResizeAnchor, setSelectedResizeAnchor] = createSignal<HTMLDivElement>();
  const surface = () => props.surface;
  const c = children(() => props.children);

  onMount(() => {
    surface().subscribe(DragEventType.DragStart, onDragStart);
    surface().subscribe(DragEventType.DragMove, onDragMove);
    surface().subscribe(DragEventType.DragEnd, onDragEnd);
    updateElement();
  });

  onCleanup(() => {
    surface().unsubscribe(DragEventType.DragStart, onDragStart);
    surface().unsubscribe(DragEventType.DragMove, onDragMove);
    surface().unsubscribe(DragEventType.DragEnd, onDragEnd);

    document.documentElement.style.cursor = '';
  });

  createEffect(on(() => props.translation, () => {
    setTranslation(props.translation);
    updateElement();
  }));

  createEffect(on(() => props.scale, () => {
    setScale(props.scale);
    updateElement();
  }));

  createEffect(on(() => props.rotation, () => {
    setRotation(props.rotation);
    updateElement();
  }));

  createEffect(on(() => props.origin, () => {
    setOrigin(props.origin);
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
    }
  };

  const onDragEnd = (pos: GrabEvent) => {
    if(!props.active) {
      return;
    }

    if(isDragging()) {
      dragHandler(pos.x, pos.y, true);
    }

    batch(() => {
      setStartPos(undefined);
      setIsDragging(false);
      setCurrentMode(undefined);
    });
    elRef().style.cursor = 'grab';
    document.documentElement.style.cursor = '';
  }

  const updateElement = () => {
    const el = elRef();
    const translationX = (translation()[0] + origin()[0]) / window.devicePixelRatio;
    const translationY = (translation()[1] + origin()[1]) / window.devicePixelRatio;

    el.style.position = 'absolute';
    el.style.top = '0';
    el.style.left = '0';
    el.style.display = 'block';
    el.style.cursor = 'grab';
    el.style.transform = `translateX(${translationX}px) translateY(${translationY}px) rotateZ(${rotation()}deg) scaleX(${scale()[0]}) scaleY(${scale()[1]})`;

    if(mode() === DraggableMode.move) {
      elRef().style.transformOrigin = 'top left';
    } else {
      elRef().style.transformOrigin = 'center';
    }
  };

  const dragHandler = (pageX: number, pageY: number, emitChangeEvent: boolean) => {
    const [startX, startY] = startPos();
    const rootRect = surface().element.getBoundingClientRect();
    const elRect = elRef().getBoundingClientRect();
    const eventX = clamp(pageX - rootRect.left, 0, rootRect.width);
    const eventY = clamp(pageY - rootRect.top, 0, rootRect.height);
    const deltaX = (eventX - startX) * window.devicePixelRatio;
    const deltaY = (eventY - startY) * window.devicePixelRatio;
    const direction = getLineDirection([startX, startY], [eventX, eventY]);
    const draggingMode = mode();
    const anchorCenter = {
      x: elRect.left + elRect.width / 2,
      y: elRect.top + elRect.height / 2
    };
    const angle = Math.atan2(eventX - anchorCenter.x, -(eventY - anchorCenter.y)) * 180 / Math.PI;

    if(draggingMode === DraggableMode.move) {
      moveHandler(deltaX, deltaY, direction, angle, emitChangeEvent);
    } else if(draggingMode === DraggableMode.resize) {
      resizeHandler(deltaX, deltaY, direction, angle, emitChangeEvent);
    } else if(draggingMode === DraggableMode.rotate) {
      rotateHandler(deltaX, deltaY, direction, angle, emitChangeEvent);
    }

    setStartPos([eventX, eventY]);
    setStartAngle(angle);
  };

  const moveHandler = (deltaX: number, deltaY: number, direction: Direction, angle: number, emitChangeEvent: boolean) => {
    const currentTranslation = translation();
    const newTranslation: [number, number] = [currentTranslation[0] + deltaX, currentTranslation[1] + deltaY];

    setTranslation(newTranslation);

    if(emitChangeEvent) {
      const isChanged = newTranslation[0] !== props.translation[0] || newTranslation[1] !== props.translation[1];

      if(isChanged) {
        props.onMove?.(newTranslation);
      }
    }
  };

  const resizeHandler = (deltaX: number, deltaY: number, direction: Direction, angle: number, emitChangeEvent: boolean) => {
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
      props.onResize?.([scaleX, scaleY], elRef().getBoundingClientRect());
    }
  };

  const rotateHandler = (deltaX: number, deltaY: number, direction: Direction, angle: number, emitChangeEvent: boolean) => {
    const newAngle = rotation() + angle - startAngle();
    setRotation(newAngle);

    if(emitChangeEvent) {
      props.onRotate?.(newAngle);
    }
  };

  const setCurrentMode = (mode: DraggableMode) => {
    _setCurrentMode(mode);
    if(mode === DraggableMode.move) {
      elRef().style.transformOrigin = 'top left';
    } else {
      elRef().style.transformOrigin = 'center';
    }
  }

  const onElementClick = (e: Event) => {
    if(e.target === elRef() || e.target === c()) {
      setCurrentMode(DraggableMode.move);
    }

    props.onClick?.(e);
  };

  const onResizeAnchorClick = (e: MouseEvent | TouchEvent) => {
    e.stopImmediatePropagation();
    setCurrentMode(DraggableMode.resize);
    setSelectedResizeAnchor(e.target as HTMLDivElement);

    document.documentElement.style.cursor = (e.target as HTMLDivElement).style.cursor;
    props.onClick?.(e);
  };

  const onRotateAnchorClick = (e: MouseEvent | TouchEvent) => {
    e.stopImmediatePropagation();
    setCurrentMode(DraggableMode.rotate);

    document.documentElement.style.cursor = (e.target as HTMLDivElement).style.cursor;
    props.onClick?.(e);
  };

  const onRemoveClick = (e: MouseEvent | TouchEvent) => {
    e.stopImmediatePropagation();

    props.onRemove?.();
  };

  return (
    <div ref={(el) => {
      setElRef(el);
      props.ref?.(el);
    }}
    class={['draggable-object', props.class || ''].join(' ')}
    classList={{'active': props.active}}
    onMouseDown={onElementClick}>
      <Show when={props.removable}>
        <div class="draggable-object__remove-icon-wrapper"
          onTouchStart={onRemoveClick}
          onMouseDown={onRemoveClick}>
          <IconTsx class="draggable-object__remove-icon" icon="close"/>
        </div>
      </Show>
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
          onMouseDown={onRotateAnchorClick}>
          <IconTsx class="rotate-anchor__icon" icon="rotate_left"/>
        </div>
      </Show>
      {c()}
    </div>
  );
}
