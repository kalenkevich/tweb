import {createSignal, onMount, onCleanup, createEffect, on} from 'solid-js';
import {ImageChangeEvent, ImageState, ImageChangeType} from '../types';
import {DraggingSurface, DragEventType, GrabEvent} from '../draggable/surface';
import clamp from '../../../helpers/number/clamp';
import {anyColorToHexColor} from '../../../helpers/color';

export interface DrawableSurfaceProps {
  surface: DraggingSurface;
  imageState: ImageState;
  onImageChange: (imageChangeEvent: ImageChangeEvent) => void;
}

export function DrawableSurface(props: DrawableSurfaceProps) {
  const surface = () => props.surface;
  const brushColor = () => anyColorToHexColor(props.imageState.drawLayer.color);
  const brushSize = () => props.imageState.drawLayer.size;
  const [brushEl, setBrushEl] = createSignal<HTMLDivElement>();

  onMount(() => {
    surface().subscribe(DragEventType.DragMove, emitTouchEvent);
    surface().element.addEventListener('mousemove', onMouseMove);
    surface().element.addEventListener('mouseenter', setCursorStyle);
    surface().element.addEventListener('mouseleave', restoreCursorStyle);
    setupBrushStyle();
  });

  onCleanup(() => {
    surface().unsubscribe(DragEventType.DragMove, emitTouchEvent);
    surface().element.removeEventListener('mousemove', onMouseMove);
    surface().element.removeEventListener('mouseenter', setCursorStyle);
    surface().element.removeEventListener('mouseleave', restoreCursorStyle);
  });

  createEffect(on(() => [
    props.imageState.drawLayer.color.value,
    props.imageState.drawLayer.size
  ], () => updateBrushStyle()));

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
      touch: {
        x: touchX,
        y: touchY
      }
    });
  };

  const setupBrushStyle = () => {
    const el = brushEl();

    el.style.position = 'absolute';
    el.style.display = 'block';
    el.style.width = `${brushSize()}px`;
    el.style.height = `${brushSize()}px`;
    el.style.borderRadius = '50%';
    el.style.backgroundColor = brushColor();
    el.style.border = `1px solid #000000`;
  };

  const updateBrushStyle = () => {
    const el = brushEl();
    el.style.width = `${brushSize()}px`;
    el.style.height = `${brushSize()}px`;
    el.style.backgroundColor = brushColor();
  };

  const updateBrushPos = (x: number, y: number) => {
    const el = brushEl();
    const halfSize = brushSize() / 2;
    el.style.display = 'block';
    el.style.left = `${x - halfSize}px`;
    el.style.top = `${y - halfSize}px`;
  };

  const setCursorStyle = () => {
    const el = brushEl();
    if(el) {
      el.style.cursor = 'none';
      document.documentElement.style.cursor = 'none';
    }
  };

  const restoreCursorStyle = () => {
    const el = brushEl();
    if(el) {
      el.style.display = 'none';
    }

    document.documentElement.style.cursor = 'auto';
  };

  return (
    <div ref={el => setBrushEl(el)}
      class="drawable-surface__brush">
    </div>
  );
}
