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
import {fitImageIntoElement} from './helpers/aspectRatioHelper';

export interface ImagePreviewProps extends ImageControlProps {
  selectedTabId: TabType;
  stickerRenderer: SuperStickerRenderer;
  onCanvasMounted: (canvas: HTMLCanvasElement) => void;
  onContainerResized: (width: number, height: number) => void;
  onActiveLayerChange: (layer?: ObjectLayer) => void;
}

export function ImageEditorPreview(props: ImagePreviewProps): JSX.Element {
  const [rootRef, setRootRef] = createSignal<HTMLDivElement>();
  const [canvasWrapperRef, setCanvasWrapperRef] = createSignal<HTMLDivElement>();
  const [canvasRef, setCanvasRef] = createSignal<HTMLCanvasElement>();
  const [resizeObserver, setResizeObserver] = createSignal<ResizeObserver>();
  const [draggingSurface, setDraggingSurface] = createSignal<DraggingSurface>();
  const isResizeTabSelected = () => props.selectedTabId === TabType.RESIZE;
  const isDrawTabSelected = () => props.selectedTabId === TabType.DRAW;
  const showDraggableObjects = () => [TabType.TEXT, TabType.STICKER, TabType.DRAW].includes(props.selectedTabId);
  const canvasWidth = () => canvasRef().width;
  const canvasHeight = () => canvasRef().height;

  onMount(() => {
    fitCanvasIntoParent();
    props.onCanvasMounted(canvasRef());

    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(rootRef(), {box: 'content-box'});
    setResizeObserver(resizeObserver);
  });

  onCleanup(() => {
    resizeObserver().disconnect();
  });

  const fitCanvasIntoParent = () => {
    const [elWidth, elHeight] = [rootRef().offsetWidth, rootRef().offsetHeight];
    const canvasWrapper = canvasWrapperRef();
    const canvas = canvasRef();
    const [canvasWidth, canvasHeight] = fitImageIntoElement(
      props.imageState.originalWidth,
      props.imageState.originalHeight,
      elWidth,
      elHeight
    );
    canvas.width = canvasWidth * window.devicePixelRatio;
    canvas.height = canvasHeight * window.devicePixelRatio;
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;
    canvasWrapper.style.width = `${canvasWidth}px`;
    canvasWrapper.style.height = `${canvasHeight}px`;
  };

  const onResize = () => {
    const canvas = canvasRef();
    fitCanvasIntoParent();

    props.onContainerResized(canvas.width, canvas.height);
  };

  return (
    <div class="image-editor__preview-container" ref={el => setRootRef(el)}>
      <div class="preview-container-working-area--wrapper">
        <div class="preview-container-working-area" ref={el => setCanvasWrapperRef(el)}>
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
                surface={draggingSurface()}
                imageState={props.imageState}
                onImageChange={props.onImageChange}
              />
            </Show>
          </DraggingSurfaceComponent>
        </div>
      </div>
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
