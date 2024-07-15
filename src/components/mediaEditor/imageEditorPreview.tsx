import {JSX, onMount, createSignal, Show, onCleanup} from 'solid-js';
import {ImageLayer} from './types';
import {ImageEditorTab, TabType} from './imageEditorTabs';
import {ImageControlProps} from './controls/imageControl';
import {ImageRotationControl} from './controls/imageRotationControl';
import {ImageTextLayerControl} from './controls/imageTextLayerControl';
import {ImageConunterpartControl} from './controls/imageCounterpartControl';
import {DraggingSurfaceComponent, DraggingSurface} from './draggable/surface';

export interface ImagePreviewProps extends ImageControlProps {
  selectedTab: ImageEditorTab;
  onCanvasMounted: (canvas: HTMLCanvasElement) => void;
  onCanvasResized: (width: number, height: number) => void;
  onActiveLayerChange: (layer?: ImageLayer) => void;
}

export function ImageEditorPreview(props: ImagePreviewProps): JSX.Element {
  const [canvasRef, setCanvasRef] = createSignal<HTMLCanvasElement>();
  const [rootRef, setRootRef] = createSignal<HTMLDivElement>();
  const [resizeObserver, setResizeObserver] = createSignal<ResizeObserver>();
  const [draggingSurface, setDraggingSurface] = createSignal<DraggingSurface>();
  const isResizeTabSelected = () => props.selectedTab.tabId === TabType.RESIZE;
  const isTextTabSelected = () => props.selectedTab.tabId === TabType.TEXT;

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
        <Show when={isTextTabSelected()}>
          <ImageTextLayerControl
            surface={draggingSurface()}
            imageState={props.imageState}
            onImageChange={props.onImageChange}
            currentLayerIndex={props.currentLayerIndex}
            onActiveLayerChange={props.onActiveLayerChange}
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
