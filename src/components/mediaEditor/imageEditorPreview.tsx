import {JSX, onMount, createSignal} from 'solid-js';
import {ImageControlProps} from './controls/imageControl';
import {ImageRotationControl} from './controls/imageRotationControl';
import {ImageAttachment} from './types';

export interface ImagePreviewProps extends ImageControlProps {
  showRotationControl: boolean;
  onCanvasMounted: (canvas: HTMLCanvasElement) => void;
  onAttachmentClick: (attachment: ImageAttachment, index: number) => void;
}

export function ImageEditorPreview(props: ImagePreviewProps): JSX.Element {
  const {
    imageState,
    onImageChange,
    onCanvasMounted,
    currentAttachmentIndex,
    showRotationControl
  } = props;

  const [canvasRef, setCanvasRef] = createSignal<HTMLCanvasElement>();

  onMount(() => {
    onCanvasMounted(canvasRef());
  });

  return (
    <div class="image-editor__preview-container">
      <canvas
        class="preview-container-canvas"
        ref={(el) => setCanvasRef(el)}>
      </canvas>
      {showRotationControl && <ImageRotationControl
        imageState={imageState}
        onImageChange={onImageChange}
        currentAttachmentIndex={currentAttachmentIndex}
      />}
    </div>
  )
}
