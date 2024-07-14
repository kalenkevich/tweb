import {JSX, onMount, createSignal, Show} from 'solid-js';
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
  onActiveLayerChange: (layer: ImageLayer) => void;
}

export function ImageEditorPreview(props: ImagePreviewProps): JSX.Element {
  const [canvasRef, setCanvasRef] = createSignal<HTMLCanvasElement>();
  const [rootRef, setRootRef] = createSignal<HTMLDivElement>();
  const [draggingSurface, setDraggingSurface] = createSignal<DraggingSurface>();
  const isResizeTabSelected = () => props.selectedTab.tabId === TabType.RESIZE;
  const isTextTabSelected = () => props.selectedTab.tabId === TabType.TEXT;

  onMount(() => {
    const [width, height] = [rootRef().offsetWidth, rootRef().offsetHeight];
    canvasRef().width = width;
    canvasRef().height = height;

    props.onCanvasMounted(canvasRef());
  });

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
