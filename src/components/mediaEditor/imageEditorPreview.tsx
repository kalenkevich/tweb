import {JSX, onMount, createSignal, Show, onCleanup, on, createEffect} from 'solid-js';
import {ObjectLayer} from './types';
import {TabType} from './imageEditorTabs';
import {ImageControlProps} from './controls/imageControl';
import {ImageRotationControl, ROTATE_CARUSEL_HEIGHT} from './controls/imageRotationControl';
import {DraggableObjects} from './controls/draggableObjects';
import {ImageCropperComponent} from './controls/imageCropper';
import {DraggingSurfaceComponent, DraggingSurface} from './draggable/surface';
import {DrawableSurface} from './controls/drawableSurface';
import SuperStickerRenderer from '../emoticonsDropdown/tabs/SuperStickerRenderer';
import {fitImageIntoElement} from './helpers/aspectRatioHelper';
import {easyAnimation} from './helpers/animation';

export interface ImagePreviewProps extends ImageControlProps {
  selectedTabId: TabType | undefined;
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
  const showDraggableObjects = () => !props.selectedTabId || [TabType.TEXT, TabType.STICKER, TabType.DRAW].includes(props.selectedTabId);

  onMount(() => {
    const [cw, ch] = fitCanvasIntoParent();
    updateCanvasResolution(cw, ch);

    props.onCanvasMounted(canvasRef());

    const resizeObserver = new ResizeObserver(() => onResize());
    resizeObserver.observe(rootRef(), {box: 'content-box'});
    setResizeObserver(resizeObserver);
  });

  onCleanup(() => {
    resizeObserver().disconnect();
  });

  createEffect(on(() => props.selectedTabId, () => {
    onResize(!props.isMobile);
  }));

  const fitCanvasIntoParent = () => {
    const root = rootRef();
    const elWidth = root.offsetWidth;
    const elHeight = root.offsetHeight - (isResizeTabSelected() ? ROTATE_CARUSEL_HEIGHT * window.devicePixelRatio : 0);

    return fitImageIntoElement(
      props.imageState.originalWidth,
      props.imageState.originalHeight,
      elWidth,
      elHeight
    );
  };

  const onResize = (animation: boolean = false) => {
    const canvas = canvasRef();
    const originalWidth = canvas.width / window.devicePixelRatio;
    const originalHeight = canvas.height / window.devicePixelRatio;
    const [newCanvasWidth, newCanvasHeight] = fitCanvasIntoParent();

    if(originalWidth === canvas.width && originalHeight === newCanvasHeight) {
      return;
    }

    if(animation) {
      const deltaWidth = newCanvasWidth - originalWidth;
      const deltaHeight = newCanvasHeight - originalHeight;
      easyAnimation((progress: number) => {
        const stepWidth = originalWidth + deltaWidth * progress;
        const stepHeight = originalHeight + deltaHeight * progress;

        updateCanvasResolution(stepWidth, stepHeight);
        props.onContainerResized(canvas.width, canvas.height);
      });
    } else {
      updateCanvasResolution(newCanvasWidth, newCanvasHeight);
      props.onContainerResized(canvas.width, canvas.height);
    }
  };

  const updateCanvasResolution = (width: number, height: number) => {
    const canvas = canvasRef();
    const canvasWrapper = canvasWrapperRef();

    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    canvasWrapper.style.width = `${width}px`;
    canvasWrapper.style.height = `${height}px`;
  };

  return (
    <div class="image-editor__preview-container" ref={el => setRootRef(el)}>
      <div class="preview-container-working-area--wrapper">
        <div class="preview-container-working-area" ref={el => setCanvasWrapperRef(el)}>
          <DraggingSurfaceComponent isMobile={props.isMobile} onSurfaceReady={setDraggingSurface}>
            <canvas
              class="preview-container-canvas"
              ref={(el) => setCanvasRef(el)}>
            </canvas>
            <Show when={isResizeTabSelected()}>
              <ImageCropperComponent
                isMobile={props.isMobile}
                surface={draggingSurface()}
                imageState={props.imageState}
                onImageChange={props.onImageChange}
                currentLayerIndex={props.currentLayerIndex}
              />
            </Show>
            <Show when={showDraggableObjects()}>
              <DraggableObjects
                isMobile={props.isMobile}
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
                isMobile={props.isMobile}
                surface={draggingSurface()}
                imageState={props.imageState}
                onImageChange={props.onImageChange}
              />
            </Show>
          </DraggingSurfaceComponent>
        </div>
      </div>
      <ImageRotationControl
        visible={isResizeTabSelected()}
        isMobile={props.isMobile}
        imageState={props.imageState}
        onImageChange={props.onImageChange}
        currentLayerIndex={props.currentLayerIndex}
      />
    </div>
  )
}
