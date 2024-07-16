import {JSX, onMount, createSignal, Show, onCleanup, batch} from 'solid-js';
import {ObjectLayer} from './types';
import {TabType} from './imageEditorTabs';
import {ImageControlProps} from './controls/imageControl';
import {ImageRotationControl} from './controls/imageRotationControl';
import {DraggableObjects} from './controls/draggableObjects';
import {ImageConunterpartControl} from './controls/imageCounterpartControl';
import {DraggingSurfaceComponent, DraggingSurface} from './draggable/surface';
import {DrawableSurface} from './controls/drawableSurface';
import SuperStickerRenderer from '../emoticonsDropdown/tabs/SuperStickerRenderer';

export interface ImagePreviewProps extends ImageControlProps {
  selectedTabId: TabType;
  stickerRenderer: SuperStickerRenderer;
  onCanvasMounted: (canvas: HTMLCanvasElement) => void;
  onCanvasResized: (width: number, height: number) => void;
  onActiveLayerChange: (layer?: ObjectLayer) => void;
}

export function ImageEditorPreview(props: ImagePreviewProps): JSX.Element {
  const [canvasRef, setCanvasRef] = createSignal<HTMLCanvasElement>();
  const [rootRef, setRootRef] = createSignal<HTMLDivElement>();
  const [resizeObserver, setResizeObserver] = createSignal<ResizeObserver>();
  const [draggingSurface, setDraggingSurface] = createSignal<DraggingSurface>();
  const isResizeTabSelected = () => props.selectedTabId === TabType.RESIZE;
  const isDrawTabSelected = () => props.selectedTabId === TabType.PAINT;
  const showDraggableObjects = () => [TabType.TEXT, TabType.STICKER, TabType.PAINT].includes(props.selectedTabId);

  onMount(() => {
    const [width, height] = [rootRef().offsetWidth, rootRef().offsetHeight];
    const canvas = canvasRef();
    canvas.width = width;
    canvas.height = height;

    props.onCanvasMounted(canvas);

    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(canvas, {box: 'content-box'});
    setResizeObserver(resizeObserver);
  });

  onCleanup(() => {
    resizeObserver().disconnect();
  });

  const onResize = () => {
    props.onCanvasResized(rootRef().offsetWidth, rootRef().offsetHeight);
  };

  return (
    <div class="image-editor__preview-container" ref={el => setRootRef(el)}>
      <DraggingSurfaceComponent onSurfaceReady={setDraggingSurface}>
        <canvas
          class="preview-container-canvas"
          ref={(el) => setCanvasRef(el)}>
        </canvas>
        <Show when={isResizeTabSelected()}>
          <ImageConunterpartControl
            surface={draggingSurface()}
            imageState={props.imageState}
            onImageChange={props.onImageChange}
            currentLayerIndex={props.currentLayerIndex}
          />
        </Show>
        <Show when={showDraggableObjects()}>
          <DraggableObjects
            surface={draggingSurface()}
            stickerRenderer={props.stickerRenderer}
            imageState={props.imageState}
            onImageChange={props.onImageChange}
            currentLayerIndex={props.currentLayerIndex}
            onActiveLayerChange={props.onActiveLayerChange}
          />
        </Show>
        <Show when={isDrawTabSelected()}>
          <DrawableSurface
            isActive={true}
            surface={draggingSurface()}
            imageState={props.imageState}
            onImageChange={props.onImageChange}
          />
        </Show>
      </DraggingSurfaceComponent>
      <Show when={isResizeTabSelected()}>
        <ImageRotationControl
          imageState={props.imageState}
          onImageChange={props.onImageChange}
          currentLayerIndex={props.currentLayerIndex}
        />
      </Show>
    </div>
  )
}
