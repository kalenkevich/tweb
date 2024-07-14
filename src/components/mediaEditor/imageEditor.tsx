import {createEffect, createSignal, on, batch} from 'solid-js';
import {ImageChangeType, ImageChangeEvent, ImageSource, ImageState, ImageLayer, AttachmentChangeAction} from './types';
import {DEFAULT_DRAW_LAYER, DEFAULT_IMAGE_STATE, DEFAULT_TEXT_LAYER, DEFAULT_STICKER_LAYER} from './consts';
import {ImageEditorPreview} from './imageEditorPreview';
import {ImageEditorTab, ImageEditorTabs, TABS_CONFIG, TabType} from './imageEditorTabs';
import {ImageEditorManager} from './imageEditorManager';
import {ButtonIconTsx} from '../buttonIconTsx';

let currentLayerId = 0;
const getLayerNextId = () => currentLayerId++;

export function createImageState(source: ImageSource): ImageState {
  return {
    ...DEFAULT_IMAGE_STATE,
    source,
    width: source.width,
    height: source.height,
    // Set image origin as the center of the image
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
  const [currentLayerIndex, setCurrentLayerIndex] = createSignal(-1);
  const [selectedTab, setSelectedTab] = createSignal(TABS_CONFIG[0]);

  createEffect(on(() => [props.imgSource], () => {
    const newImageState = createImageState(props.imgSource);

    setImageState(newImageState);
    imageEditorManager().pushState(newImageState);
  }));

  const onCanvasMounted = async(canvas: HTMLCanvasElement) => {
    imageEditorManager().init(canvas, imageState());

    // Move image to center
    const newState = handleChangeEvent({
      type: ImageChangeType.move,
      deltaX: canvas.width / 2,
      deltaY: canvas.height / 2
    });
    setImageState(newState);
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
      case ImageChangeType.move: {
        return imageEditorManager().move(event.deltaX, event.deltaY, event.animation);
      }
      case ImageChangeType.resize: {
        return imageEditorManager().resize(event.scaleX, event.scaleY, event.animation);
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
          const newLayers = state.layers.map((l) => l.id === event.layer.id ? event.layer : l);
          newState = {
            ...state,
            layers: newLayers
          };
        } else if(event.action === AttachmentChangeAction.delete) {
          const newLayers = state.layers.filter((l) => l.id !== event.layer.id);
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

  const onActiveLayerChange = (layer: ImageLayer) => {
    const index = imageState().layers.findIndex(l => l === layer);

    setCurrentLayerIndex(index);
  };

  const handleTabSelection = (tab: ImageEditorTab) => {
    let layerIndex = currentLayerIndex();
    const newState = {
      ...imageState()
    };
    const lastLayer = newState.layers[layerIndex];
    // remove layer if it was untouched
    if(lastLayer && !lastLayer.isDirty) {
      newState.layers = [...newState.layers.splice(layerIndex)];
      layerIndex--;
    }

    // add default layer
    if(tab.tabId === TabType.TEXT) {
      // const {} = measureText();
      newState.layers.push({
        ...DEFAULT_TEXT_LAYER,
        id: getLayerNextId()
      });
      layerIndex++;
    } else if(tab.tabId === TabType.PAINT) {
      newState.layers.push({
        ...DEFAULT_DRAW_LAYER,
        id: getLayerNextId()
      });
      layerIndex++;
    } else if(tab.tabId === TabType.STICKER) {
      newState.layers.push({
        ...DEFAULT_STICKER_LAYER,
        id: getLayerNextId()
      });
      layerIndex++;
    }

    batch(() => {
      setImageState(newState);
      setSelectedTab(tab);
      setCurrentLayerIndex(layerIndex);
    });
  };

  return (
    <div class="image-editor">
      <ImageEditorPreview
        imageState={imageState()}
        currentLayerIndex={currentLayerIndex()}
        onCanvasMounted={onCanvasMounted}
        onCanvasResized={onCanvasResized}
        onImageChange={onImageChange}
        onActiveLayerChange={onActiveLayerChange}
        selectedTab={selectedTab()}
      />
      <ImageEditorTabs
        selectedTab={selectedTab()}
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
