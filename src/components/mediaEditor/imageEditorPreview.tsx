import {JSX, onMount, createSignal, Show, createEffect} from 'solid-js';
import {ImageControlProps} from './controls/imageControl';
import {ImageRotationControl} from './controls/imageRotationControl';
import {ObjectLayer} from './types';
import {ImageEditorTab, TabType} from './imageEditorTabs';

export interface ImagePreviewProps extends ImageControlProps {
  selectedTab: ImageEditorTab;
  onCanvasMounted: (canvas: HTMLCanvasElement) => void;
  onCanvasResized: (width: number, height: number) => void;
  onLayerClick: (layer: ObjectLayer, index: number) => void;
}

export function ImageEditorPreview(props: ImagePreviewProps): JSX.Element {
  const [canvasRef, setCanvasRef] = createSignal<HTMLCanvasElement>();
  const [rootRef, setRootRef] = createSignal<HTMLDivElement>();
  const isSelectedTabResize = () => props.selectedTab.tabId === TabType.RESIZE;

  onMount(() => {
    const [width, height] = [rootRef().offsetWidth, rootRef().offsetHeight];
    canvasRef().width = width;
    canvasRef().height = height;

    props.onCanvasMounted(canvasRef());
  });

  return (
    <div class="image-editor__preview-container" ref={el => setRootRef(el)}>
      <canvas
        class="preview-container-canvas"
        ref={(el) => setCanvasRef(el)}>
      </canvas>
      <Show when={isSelectedTabResize()}>
        <ImageRotationControl
          imageState={props.imageState}
          onImageChange={props.onImageChange}
          currentLayerIndex={props.currentLayerIndex}
        />
      </Show>
    </div>
  )
}
