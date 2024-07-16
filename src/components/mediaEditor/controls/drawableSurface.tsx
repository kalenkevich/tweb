import {createSignal, onMount, onCleanup, createEffect, on} from 'solid-js';
import {ImageChangeEvent, ImageState, ImageChangeType} from '../types';
import {DraggingSurface, DragEventType, GrabEvent} from '../draggable/surface';
import clamp from '../../../helpers/number/clamp';
import {anyColorToHexColor} from '../../../helpers/color';

export interface DrawableSurfaceProps {
  surface: DraggingSurface;
  imageState: ImageState;
  isActive: boolean;
  onImageChange: (imageChangeEvent: ImageChangeEvent) => void;
}

export function DrawableSurface(props: DrawableSurfaceProps) {
  const surface = () => props.surface;
  const isActive = () => props.isActive;
  const brushColor = () => anyColorToHexColor(props.imageState.drawLayer.color);
  const brushSize = () => props.imageState.drawLayer.size;
  const [brushEl, setBrushEl] = createSignal<HTMLDivElement>();

  onMount(() => {
    surface().subscribe(DragEventType.DragStart, onDragStart);
    surface().subscribe(DragEventType.DragMove, onDragMove);
    surface().subscribe(DragEventType.DragEnd, onDragEnd);
    surface().element.addEventListener('mousemove', onMouseMove);
  });

  onCleanup(() => {
    surface().unsubscribe(DragEventType.DragStart, onDragStart);
    surface().unsubscribe(DragEventType.DragMove, onDragMove);
    surface().unsubscribe(DragEventType.DragEnd, onDragEnd);
    surface().element.removeEventListener('mousemove', onMouseMove);
  });

  createEffect(on(() => [
    props.imageState.drawLayer.color,
    props.imageState.drawLayer.size
  ], () => {
    updateBrushStyle();
  }));

  const onDragStart = (e: GrabEvent) => {
    if(!isActive()) {
      return;
    }

    // emitTouchEvent(e);
  };

  const onDragMove = (e: GrabEvent) => {
    if(!isActive()) {
      return;
    }

    emitTouchEvent(e);
  };

  const onDragEnd = (e: GrabEvent) => {
    if(!isActive()) {
      return;
    }
  };

  const onMouseMove = (e: MouseEvent) => {
    const rootRect = surface().element.getBoundingClientRect();
    const mouseX = clamp(e.pageX - rootRect.left, 0, rootRect.width);
    const mouseY = clamp(e.pageY - rootRect.top, 0, rootRect.height);

    updateBrushPos(mouseX, mouseY);
  };

  const emitTouchEvent = (e: GrabEvent) => {
    const rootRect = surface().element.getBoundingClientRect();
    const touchX = clamp(e.x - rootRect.left, 0, rootRect.width);
    const touchY = clamp(e.y - rootRect.top, 0, rootRect.height);

    updateBrushPos(touchX, touchY);

    props.onImageChange({
      type: ImageChangeType.drawTouch,
      touchX,
      touchY
    });
  };

  const updateBrushStyle = () => {
    const el = brushEl();
    el.style.position = 'absolute';
    el.style.top = '0px';
    el.style.left = '0px';
    el.style.display = 'block';
    el.style.width = `${brushSize()}px`;
    el.style.height = `${brushSize()}px`;
    el.style.borderRadius = '50%';
    el.style.backgroundColor = brushColor();
    el.style.border = `1px solid #000000`;
  };

  const updateBrushPos = (x: number, y: number) => {
    const el = brushEl();
    const halfSize = brushSize() / 2;
    el.style.left = `${x - halfSize}px`;
    el.style.top = `${y - halfSize}px`;
  };

  return (
    <div ref={el => setBrushEl(el)}
      class="drawable-surface__brush">
    </div>
  );
}
