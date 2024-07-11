import {createEffect, createSignal, on} from 'solid-js';
import {ImageChangeType, ImageChangeEvent, ImageSource, ImageState, ObjectLayer, AttachmentChangeAction} from './types';
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
  const [currentLayerIndex, setCurrentLayerIndex] = createSignal(0);
  const [showRotationControl, setShowRotationControl] = createSignal(false);

  createEffect(on(() => [props.imgSource, props.imgWidth, props.imgHeight], () => {
    const newImageState = createImageState(props.imgSource, props.imgWidth, props.imgHeight);

    setImageState(newImageState);
    imageEditorManager().pushState(newImageState);
  }));

  const onCanvasMounted = async(canvas: HTMLCanvasElement) => {
    const imageEditorManagerInstance = imageEditorManager();

    await imageEditorManagerInstance.init(canvas, imageState());
  };

  const handleChangeEvent = (event: ImageChangeEvent): ImageState => {
    switch(event.type) {
      case ImageChangeType.filter: {
        return imageEditorManager().filter(event.value);
      }
      case ImageChangeType.aspectRatio: {
        return imageEditorManager().aspectRatio(event.value);
      }
      case ImageChangeType.rotate: {
        return imageEditorManager().rotate(event.value);
      }
      case ImageChangeType.layer: {
        const state = imageEditorManager().getCurrentImageState();
        let newState: ImageState;

        if(event.action === AttachmentChangeAction.create) {
          const newLayers = [...state.layers, event.layer];
          newState = {
            ...state,
            layers: newLayers
          };
        } else if(event.action === AttachmentChangeAction.update) {
          const newLayers = state.layers.map((l, index) => index === event.layerIndex ? event.layer : l);
          newState = {
            ...state,
            layers: newLayers
          };
        } else if(event.action === AttachmentChangeAction.delete) {
          const newLayers = state.layers.filter((l, index) => index !== event.layerIndex);
          newState = {
            ...state,
            layers: newLayers
          };
        }

        imageEditorManager().pushState(newState);

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
    // const resultImage = await imageEditorManager().getCurrentImageSource();

    // props.onSave(resultImage);
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

  const onLayerClick = (layer: ObjectLayer, layerIndex: number) => {
    setCurrentLayerIndex(layerIndex);
  };

  return (
    <div class="image-editor">
      <ImageEditorPreview
        imageState={imageState()}
        currentLayerIndex={currentLayerIndex()}
        showRotationControl={showRotationControl()}
        onCanvasMounted={onCanvasMounted}
        onImageChange={onImageChange}
        onLayerClick={onLayerClick}
      />
      <ImageEditorTabsContainer
        canUndo={canUndo()}
        canRedo={canRedo()}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onClose={handleClose}
        imageState={imageState()}
        currentLayerIndex={currentLayerIndex()}
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

