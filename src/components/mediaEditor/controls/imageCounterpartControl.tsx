import {createSignal, createEffect, on, onMount, For, onCleanup} from 'solid-js';
import {ImageChangeType} from '../types';
import {ImageControlProps} from './imageControl';
import {ImageState} from '../types';
import clamp from '../../../helpers/number/clamp';
import {DraggingSurface, DragEventType, GrabEvent} from '../draggable/surface';

export interface ImageConunterpartControlProps extends ImageControlProps {
  surface: DraggingSurface;
}

const GRID_ROWS_COUNT = 4;
const GRID_COLUMNS_COUNT = 4;

enum ImageEventType {
  none = 'none',
  move = 'move',
  resize = 'resize'
}

enum ResizeDirection {
  topLeft = 'top_left',
  topRight = 'top_right',
  bottomLeft = 'bottom_left',
  bottomRight = 'bottom_right'
}

const RESIZE_DIRECTION_CURSOR_NAME_MAP = {
  [ResizeDirection.topLeft]: 'nwse-resize',
  [ResizeDirection.topRight]: 'nesw-resize',
  [ResizeDirection.bottomLeft]: 'nesw-resize',
  [ResizeDirection.bottomRight]: 'nwse-resize'
};

export function ImageConunterpartControl(props: ImageConunterpartControlProps) {
  const [eventType, setEventType] = createSignal(ImageEventType.none);
  const [resizeDirection, setResizeDirection] = createSignal<ResizeDirection>()
  const [elRef, setElRef] = createSignal<HTMLDivElement>();
  const [startPos, setStartPos] = createSignal<[number, number]>();
  const surface = () => props.surface;

  createEffect(on(() => props.surface, () => {
    surface().subscribe(DragEventType.DragStart, onDragStart);
    surface().subscribe(DragEventType.DragMove, onDragMove);
    surface().subscribe(DragEventType.DragEnd, onDragEnd);

    return () => {
      surface().unsubscribe(DragEventType.DragStart, onDragStart);
      surface().unsubscribe(DragEventType.DragMove, onDragMove);
      surface().unsubscribe(DragEventType.DragEnd, onDragEnd);
    };
  }));

  onCleanup(() => {
    surface().unsubscribe(DragEventType.DragStart, onDragStart);
    surface().unsubscribe(DragEventType.DragMove, onDragMove);
    surface().unsubscribe(DragEventType.DragEnd, onDragEnd);
  });

  createEffect(on(() => props.imageState, (currentImageState) => {
    updateElement(currentImageState);
  }));

  onMount(() => {
    updateElement(props.imageState);
  });

  const gridRows = (count = GRID_ROWS_COUNT) => {
    const result = [];
    const width = elRef().offsetWidth;
    const height = elRef().offsetHeight;
    const step = height / (count - 1);
    let currentY = 0;

    for(let i = 0; i < count; i++) {
      result.push({
        style: {
          display: 'block',
          position: 'absolute',
          background: 'rgba(255, 255, 255, 0.3)',
          width: `${width}px`,
          height: '1px',
          top: `${currentY}px`,
          left: '0px'
        }
      });

      currentY += step;
    }

    return result;
  };

  const gridColumns = (count = GRID_COLUMNS_COUNT) => {
    const result = [];
    const width = elRef().offsetWidth;
    const height = elRef().offsetHeight;
    const step = width / (count - 1);
    let currentX = 0;

    for(let i = 0; i < count; i++) {
      result.push({
        style: {
          display: 'block',
          position: 'absolute',
          background: 'rgba(255, 255, 255, 0.3)',
          height: `${height}px`,
          width: '1px',
          top: '0px',
          left: `${currentX}px`
        }
      });

      currentX += step;
    }

    return result;
  };

  const resizeHandlers = () => {
    const height = elRef().offsetHeight;
    const commonStyles = {
      'display': 'block',
      'position': 'absolute',
      'background': 'rgba(255, 255, 255, 1.0)',
      'height': '8px',
      'width': '8px',
      'border-radius': '50%'
    };

    return [{
      resizeType: ResizeDirection.topLeft,
      style: {
        ...commonStyles,
        'cursor': 'nwse-resize',
        'top': '-4px',
        'left': '-4px'
      }
    }, {
      resizeType: ResizeDirection.topRight,
      style: {
        ...commonStyles,
        'cursor': 'nesw-resize',
        'top': '-4px',
        'right': '-4px'
      }
    }, {
      resizeType: ResizeDirection.bottomLeft,
      style: {
        ...commonStyles,
        'cursor': 'nesw-resize',
        'top': `${height - 4}px`,
        'left': '-4px'
      }
    }, {
      resizeType: ResizeDirection.bottomRight,
      style: {
        ...commonStyles,
        'cursor': 'nwse-resize',
        'top': `${height - 4}px`,
        'right': '-4px'
      }
    }]
  };

  const onDragStart = (pos: GrabEvent) => {
    const target: HTMLDivElement = pos.event.target as any;
    const resizeDirection = target.dataset['resize'] as ResizeDirection;
    if(resizeDirection) {
      const cursorStyle = RESIZE_DIRECTION_CURSOR_NAME_MAP[resizeDirection];

      setEventType(ImageEventType.resize);
      setResizeDirection(resizeDirection);
      document.documentElement.style.cursor = elRef().style.cursor = cursorStyle;
    } else {
      setEventType(ImageEventType.move);
      document.documentElement.style.cursor = elRef().style.cursor = 'grabbing';
    }

    const rootRect = surface().element.getBoundingClientRect();
    const eventX = clamp(pos.x - rootRect.left, 0, rootRect.width);
    const eventY = clamp(pos.y - rootRect.top, 0, rootRect.height);
    setStartPos([eventX, eventY]);
  };

  const onDragMove = (pos: GrabEvent) => {
    if(eventType() === ImageEventType.move) {
      imageMoveHandler(pos.x, pos.y);
    } else if(eventType() === ImageEventType.resize) {
      imageResizeHandler(pos.x, pos.y);
    }
    document.documentElement.style.cursor = elRef().style.cursor = 'grabbing';
  };

  const onDragEnd = (pos: GrabEvent) => {
    setStartPos(undefined);
    setEventType(ImageEventType.none);
    setResizeDirection(undefined);
    elRef().style.cursor = 'grab';
    document.documentElement.style.cursor = '';
  }

  const imageMoveHandler = (pageX: number, pageY: number) => {
    const [startX, startY] = startPos();
    const rootRect = surface().element.getBoundingClientRect();
    const eventX = clamp(pageX - rootRect.left, 0, rootRect.width);
    const eventY = clamp(pageY - rootRect.top, 0, rootRect.height);
    const deltaX = (eventX - startX) * window.devicePixelRatio;
    const deltaY = (eventY - startY) * window.devicePixelRatio;

    setStartPos([eventX, eventY]);
    props.onImageChange({
      type: ImageChangeType.move,
      deltaX,
      deltaY,
      animation: false
    });
  };

  const imageResizeHandler = (pageX: number, pageY: number) => {
    const [startX, startY] = startPos();
    const rootRect = surface().element.getBoundingClientRect();
    const elRect = elRef().getBoundingClientRect();
    const eventX = clamp(pageX - rootRect.left, 0, rootRect.width);
    const eventY = clamp(pageY - rootRect.top, 0, rootRect.height);
    const invertX = [ResizeDirection.topLeft, ResizeDirection.bottomLeft].includes(resizeDirection()) ? 1 : -1;
    const invertY = [ResizeDirection.topLeft, ResizeDirection.topRight].includes(resizeDirection()) ? 1 : -1;
    const deltaX = (eventX - startX) * window.devicePixelRatio;
    const deltaY = (eventY - startY) * window.devicePixelRatio;

    if(deltaX === 0 && deltaY === 0) {
      return;
    }

    const scaleX = elRect.width / (elRect.width + invertX * deltaX);
    const scaleY = elRect.height / (elRect.height + invertY * deltaY);

    props.onImageChange({
      type: ImageChangeType.resize,
      scaleX,
      scaleY,
      animation: false
    });
  };

  const updateElement = (state: ImageState) => {
    elRef().style.position = 'absolute';
    elRef().style.top = '0';
    elRef().style.left = '0';
    elRef().style.display = 'block';
    elRef().style.cursor = 'grab';
    elRef().style.width = `${state.width / window.devicePixelRatio}px`;
    elRef().style.height = `${state.height / window.devicePixelRatio}px`;
    const translationX = (state.translation[0] + state.origin[0]) / window.devicePixelRatio;
    const translationY = (state.translation[1] + state.origin[1]) / window.devicePixelRatio;
    elRef().style.transform = `translateX(${translationX}px) translateY(${translationY}px) rotateZ(${state.rotateAngle}deg) scaleX(${state.scale[0]}) scaleY(${state.scale[1]})`;

    elRef().querySelectorAll('.image-grid__resize').forEach(el => {
      (el as HTMLDivElement).style.transform = `scaleX(${1/state.scale[0]}) scaleY(${1/state.scale[1]})`;
    })
  };

  return (
    <div class="image-conunterpart" ref={el => setElRef(el)}>
      <div class="image-grid" style={{'position': 'relative'}}>
        <For each={gridRows()}>
          {(row) => (
            <div class="image-grid__row" style={row.style as any}></div>
          )}
        </For>
        <For each={gridColumns()}>
          {(column) => (
            <div class="image-grid__column" style={column.style as any}></div>
          )}
        </For>
        <For each={resizeHandlers()}>
          {(resizeHander) => (
            <div class="image-grid__resize"
              data-resize={resizeHander.resizeType}
              style={resizeHander.style as any}>
            </div>
          )}
        </For>
      </div>
    </div>
  );
}
