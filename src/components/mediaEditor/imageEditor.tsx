import {createEffect, createSignal, on} from 'solid-js';
import {ImageChangeType, ImageChangeEvent, ImageSource, ImageState, ObjectLayer, AttachmentChangeAction} from './types';
import {DEFAULT_IMAGE_STATE} from './consts';
import {ImageEditorPreview} from './imageEditorPreview';
import {ImageEditorTab, ImageEditorTabs, TABS_CONFIG} from './imageEditorTabs';
import {ImageEditorManager} from './imageEditorManager';
import {ButtonIconTsx} from '../buttonIconTsx';

export function createImageState(source: ImageSource): ImageState {
  return {
    ...DEFAULT_IMAGE_STATE,
    source,
    width: source.width,
    height: source.height,
    translation: [source.width / 2, source.height / 2],
    origin: [-(source.width / 2), -(source.height / 2)]
  }
}

export interface MediaEditorProps {
  imgSource: ImageSource;
  onClose: () => void;
  onSave: (editedImage: ImageSource) => void;
}

export function ImageEditor(props: MediaEditorProps) {
  const [imageEditorManager] = createSignal(new ImageEditorManager());
  const [imageState, setImageState] = createSignal(createImageState(props.imgSource));
  const [canRedo, setCanRedu] = createSignal(false);
  const [canUndo, setCanUndo] = createSignal(false);
  const [currentLayerIndex, setCurrentLayerIndex] = createSignal(0);
  const [selectedTab, setSelectedTab] = createSignal(TABS_CONFIG[0]);

  createEffect(on(() => [props.imgSource], () => {
    const newImageState = createImageState(props.imgSource);

    setImageState(newImageState);
    imageEditorManager().pushState(newImageState);
  }));

  const onCanvasMounted = async(canvas: HTMLCanvasElement) => {
    const imageEditorManagerInstance = imageEditorManager();

    await imageEditorManagerInstance.init(canvas, imageState());
  };

  const onCanvasResized = (width: number, height: number) => {
    imageEditorManager().resizeCanvas(width, height);
  };

  const handleChangeEvent = (event: ImageChangeEvent): ImageState => {
    switch(event.type) {
      case ImageChangeType.filter: {
        return imageEditorManager().filter(event.value);
      }
      case ImageChangeType.aspectRatio: {
        return imageEditorManager().aspectRatio(event.value, event.animation);
      }
      case ImageChangeType.rotate: {
        return imageEditorManager().rotate(event.value, event.animation);
      }
      case ImageChangeType.flipHorisontaly: {
        return imageEditorManager().flipHorisontaly();
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

  const handleTabSelection = (tab: ImageEditorTab) => {
    setSelectedTab(tab);
  };

  return (
    <div class="image-editor">
      <ImageEditorPreview
        imageState={imageState()}
        currentLayerIndex={currentLayerIndex()}
        onCanvasMounted={onCanvasMounted}
        onCanvasResized={onCanvasResized}
        onImageChange={onImageChange}
        onLayerClick={onLayerClick}
        selectedTab={selectedTab()}
      />
      <ImageEditorTabs
        canUndo={canUndo()}
        canRedo={canRedo()}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onClose={handleClose}
        imageState={imageState()}
        currentLayerIndex={currentLayerIndex()}
        onImageChange={onImageChange}
        onTabSelected={handleTabSelection}
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
