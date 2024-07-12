import {createSignal, createEffect, on, onMount, children, JSX, For, Show} from 'solid-js';
import {ImageChangeType} from '../types';
import {ImageControlProps} from './imageControl';
import {ImageState} from '../types';
import clamp from '../../../helpers/number/clamp';
import attachGrabListeners from '../../../helpers/dom/attachGrabListeners';

export interface ImageConunterpartControlProps extends ImageControlProps {
  enabled: boolean;
  children?: JSX.Element;
}

const GRID_ROWS_COUNT = 4;
const GRID_COLUMNS_COUNT = 4;

enum ImageEventType {
  none = 'none',
  move = 'move',
  resize = 'resize'
}

enum ResizeType {
  leftTop = 'left_top',
  leftRight = 'left_right',
  bottomLeft = 'bottom_left',
  bottomRight = 'bottom_right'
}

const RESIZE_TYPE_CURSOR_NAME_MAP = {
  [ResizeType.leftTop]: 'nwse-resize',
  [ResizeType.leftRight]: 'nesw-resize',
  [ResizeType.bottomLeft]: 'nesw-resize',
  [ResizeType.bottomRight]: 'nwse-resize'
};

export function ImageConunterpartControl(props: ImageConunterpartControlProps) {
  const isEnabled = () => props.enabled;
  const [eventType, setEventType] = createSignal(ImageEventType.none);
  const [rootEl, setRootEl] = createSignal<HTMLDivElement>();
  const [elRef, setElRef] = createSignal<HTMLDivElement>();
  const [startPos, setStartPos] = createSignal<[number, number]>();
  const c = children(() => props.children);

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
      resizeType: ResizeType.leftTop,
      style: {
        ...commonStyles,
        'cursor': 'nwse-resize',
        'top': '-4px',
        'left': '-4px'
      }
    }, {
      resizeType: ResizeType.leftRight,
      style: {
        ...commonStyles,
        'cursor': 'nesw-resize',
        'top': '-4px',
        'right': '-4px'
      }
    }, {
      resizeType: ResizeType.bottomLeft,
      style: {
        ...commonStyles,
        'cursor': 'nesw-resize',
        'top': `${height - 4}px`,
        'left': '-4px'
      }
    }, {
      resizeType: ResizeType.bottomRight,
      style: {
        ...commonStyles,
        'cursor': 'nwse-resize',
        'top': `${height - 4}px`,
        'right': '-4px'
      }
    }]
  };

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

      const target: HTMLDivElement = pos.event.target as any;
      if(target.dataset['resize']) {
        const cursorStyle = RESIZE_TYPE_CURSOR_NAME_MAP[target.dataset['resize'] as ResizeType];

        setEventType(ImageEventType.resize);
        document.documentElement.style.cursor = elRef().style.cursor = cursorStyle;
      } else {
        setEventType(ImageEventType.move);
        document.documentElement.style.cursor = elRef().style.cursor = 'grabbing';
      }

      const rootRect = rootEl().getBoundingClientRect();
      const eventX = clamp(pos.x - rootRect.left, 0, rootRect.width);
      const eventY = clamp(pos.y - rootRect.top, 0, rootRect.height);
      setStartPos([eventX, eventY]);
    }, (pos) => {
      if(!isEnabled()) {
        return;
      }

      if(eventType() === ImageEventType.move) {
        imageMoveHandler(pos.x, pos.y);
      } else if(eventType() === ImageEventType.resize) {
        imageResizeHandler(pos.x, pos.y);
      }
    }, () => {
      if(!isEnabled()) {
        return;
      }

      setStartPos(undefined);
      setEventType(ImageEventType.none);

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

  const imageResizeHandler = (pageX: number, pageY: number) => {
    const [startX, startY] = startPos();
    const rootRect = rootEl().getBoundingClientRect();
    const elRect = elRef().getBoundingClientRect();
    const eventX = clamp(pageX - rootRect.left, 0, rootRect.width);
    const eventY = clamp(pageY - rootRect.top, 0, rootRect.height);
    const scaleX = elRect.width / (elRect.width - (eventX - startX));
    const scaleY = elRect.height / (elRect.height + (eventY - startY));

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
    elRef().style.width = `${state.width / window.devicePixelRatio}px`;
    elRef().style.height = `${state.height / window.devicePixelRatio}px`;
    const translationX = (state.translation[0] + state.origin[0]) / window.devicePixelRatio;
    const translationY = (state.translation[1] + state.origin[1]) / window.devicePixelRatio;
    elRef().style.transform = `translateX(${translationX}px) translateY(${translationY}px) rotateZ(${state.rotateAngle}deg) scaleX(${state.scale[0]}) scaleY(${state.scale[1]})`;

    rootEl().querySelectorAll('.image-grid__resize').forEach(el => {
      (el as HTMLDivElement).style.transform = `scaleX(${1/state.scale[0]}) scaleY(${1/state.scale[1]})`;
    })
  };

  const onGrabEnd = () => {
    elRef().style.cursor = 'grab';
    document.documentElement.style.cursor = '';
  };

  return (
    <div class="conunterpart-control-wrapper" ref={el => setRootEl(el)}>
      {c()}
      <div class="image-conunterpart" ref={el => setElRef(el)}>
        <Show when={isEnabled()}>
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
        </Show>
      </div>
    </div>
  );
}
