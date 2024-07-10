import {createEffect, createSignal} from 'solid-js';

import {ImageChangeType, ImageChangeEvent, ImageSource, ImageState, ImageAttachment, AttachmentChangeAction} from './types';
import {DEFAULT_IMAGE_STATE} from './consts';
import {ImageEditorPreview} from './imageEditorPreview';
import {ImageEditorTabsContainer} from './imageEditorTabsContainer';
import {ImageEditorManager} from './imageEditorManager';
import {ButtonIconTsx} from '../buttonIconTsx';

export function createImageState(source: ImageSource, width: number, height: number): ImageState {
  return {
    ...DEFAULT_IMAGE_STATE,
    source,
    width,
    height
  }
}

export interface MediaEditorProps {
  imgSource: ImageSource;
  imgWidth: number;
  imgHeight: number;
  onClose: () => void;
  onSave: (editedImage: ImageSource) => void;
}

export function ImageEditor(props: MediaEditorProps) {
  const [imageEditorManager] = createSignal(new ImageEditorManager());
  const [imageState, setImageState] = createSignal(createImageState(props.imgSource, props.imgWidth, props.imgHeight));
  const [canRedo, setCanRedu] = createSignal(false);
  const [canUndo, setCanUndo] = createSignal(false);
  const [currentAttachmentIndex, setCurrentAttachmentIndex] = createSignal(0);
  const [showRotationControl, setShowRotationControl] = createSignal(false);

  createEffect(() => {
    const newImageState = createImageState(props.imgSource, props.imgWidth, props.imgHeight);

    setImageState(newImageState);
    imageEditorManager().pushState(newImageState);
  });

  const onCanvasMounted = async(canvas: HTMLCanvasElement) => {
    const imageEditorManagerInstance = imageEditorManager();

    await imageEditorManagerInstance.init(canvas, imageState());
  };

  const handleChangeEvent = (event: ImageChangeEvent): ImageState => {
    switch(event.type) {
      case ImageChangeType.enhance: {
        return imageEditorManager().enhance(event.value);
      }
      case ImageChangeType.brightness: {
        return imageEditorManager().brightness(event.value);
      }
      case ImageChangeType.contrast: {
        return imageEditorManager().contrast(event.value);
      }
      case ImageChangeType.saturation: {
        return imageEditorManager().saturation(event.value);
      }
      case ImageChangeType.warmth: {
        return imageEditorManager().warmth(event.value);
      }
      case ImageChangeType.fade: {
        return imageEditorManager().fade(event.value);
      }
      case ImageChangeType.highlights: {
        return imageEditorManager().highlights(event.value);
      }
      case ImageChangeType.shadows: {
        return imageEditorManager().shadows(event.value);
      }
      case ImageChangeType.vignette: {
        return imageEditorManager().vignette(event.value);
      }
      case ImageChangeType.grain: {
        return imageEditorManager().grain(event.value);
      }
      case ImageChangeType.sharpen: {
        return imageEditorManager().sharpen(event.value);
      }
      case ImageChangeType.aspectRatio: {
        return imageEditorManager().aspectRatio(event.value);
      }
      case ImageChangeType.rotate: {
        return imageEditorManager().rotate(event.value);
      }
      case ImageChangeType.attachment: {
        const state = imageEditorManager().getCurrentImageState();
        let newState: ImageState;

        if(event.action === AttachmentChangeAction.create) {
          const newAttachments = [...state.attachments, event.attachment];
          newState = {
            ...state,
            attachments: newAttachments
          };
        } else if(event.action === AttachmentChangeAction.update) {
          const newAttachments = state.attachments.map((at, index) => index === event.attachmentIndex ? event.attachment : at);
          newState = {
            ...state,
            attachments: newAttachments
          };

          imageEditorManager().pushState(newState);
        } else if(event.action === AttachmentChangeAction.delete) {
          const newAttachments = state.attachments.filter((at, index) => index !== event.attachmentIndex);
          newState = {
            ...state,
            attachments: newAttachments
          };

          imageEditorManager().pushState(newState);
        }

        return newState;
      }
    }
  };

  const onImageChange = (imageChangeEvent: ImageChangeEvent) => {
    const newState = handleChangeEvent(imageChangeEvent);

    setImageState(newState);
    setCanUndo(imageEditorManager().canUndo());
    setCanRedu(imageEditorManager().canRedo());
  };

  const handleClose = () => {
    // show confirmation popup.
    props.onClose();
  };

  const handleSave = async() => {
    const resultImage = await imageEditorManager().getCurrentImageSource();

    props.onSave(resultImage);
  };

  const handleUndo = () => {
    const newState = imageEditorManager().undo();
    setImageState(newState);
    setCanUndo(imageEditorManager().canUndo());
    setCanRedu(imageEditorManager().canRedo());
  };

  const handleRedo = () => {
    const newState = imageEditorManager().redo();
    setImageState(newState);
    setCanUndo(imageEditorManager().canUndo());
    setCanRedu(imageEditorManager().canRedo());
  };

  const onAttachmentClick = (attachment: ImageAttachment, attachmentIndex: number) => {
    setCurrentAttachmentIndex(attachmentIndex);
  };

  return (
    <div class="image-editor">
      <ImageEditorPreview
        imageState={imageState()}
        currentAttachmentIndex={currentAttachmentIndex()}
        showRotationControl={showRotationControl()}
        onCanvasMounted={onCanvasMounted}
        onImageChange={onImageChange}
        onAttachmentClick={onAttachmentClick}
      />
      <ImageEditorTabsContainer
        canUndo={canUndo()}
        canRedo={canRedo()}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onClose={handleClose}
        imageState={imageState()}
        currentAttachmentIndex={currentAttachmentIndex()}
        onImageChange={onImageChange}
      />
      <div class="image-editor__save-button">
        <ButtonIconTsx
          class="btn-circle btn-corner"
          icon="check"
          onClick={handleSave}
        />
      </div>
    </div>
  )
}

