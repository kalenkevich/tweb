import {JSX, onMount, createSignal} from 'solid-js';
import {ImageControlProps} from './controls/imageControl';
import {ImageRotationControl} from './controls/imageRotationControl';
import {ObjectLayer} from './types';

export interface ImagePreviewProps extends ImageControlProps {
  showRotationControl: boolean;
  onCanvasMounted: (canvas: HTMLCanvasElement) => void;
  onLayerClick: (layer: ObjectLayer, index: number) => void;
}

export function ImageEditorPreview(props: ImagePreviewProps): JSX.Element {
  const [canvasRef, setCanvasRef] = createSignal<HTMLCanvasElement>();
  const [rootRef, setRootRef] = createSignal<HTMLDivElement>();

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
      {props.showRotationControl && <ImageRotationControl
        imageState={props.imageState}
        onImageChange={props.onImageChange}
        currentLayerIndex={props.currentLayerIndex}
      />}
    </div>
  )
}
