import {createEffect, createSignal, on, batch} from 'solid-js';
import {ImageChangeType, ImageChangeEvent, ImageSource, ImageState, ImageLayer, AttachmentChangeAction, ImageLayerType} from './types';
import {DEFAULT_DRAW_LAYER, DEFAULT_IMAGE_STATE, DEFAULT_TEXT_LAYER, DEFAULT_STICKER_LAYER} from './consts';
import {ImageEditorPreview} from './imageEditorPreview';
import {ImageEditorTab, ImageEditorTabs, TABS_CONFIG, TabType} from './imageEditorTabs';
import {ImageEditorManager} from './imageEditorManager';
import {ButtonIconTsx} from '../buttonIconTsx';
import {fitImageIntoCanvas, ScaleMode} from './helpers/aspectRatioHelper';
import {createImageElementTextureSource} from './webgl/helpers/webglTexture';
import {renderTextLayer} from './helpers/textHelper';

let currentLayerId = 0;
const getLayerNextId = () => currentLayerId++;

export function createImageState(source: ImageSource): ImageState {
  const texture = createImageElementTextureSource(source, source.width, source.height);
  return {
    ...DEFAULT_IMAGE_STATE,
    source,
    texture,
    width: source.width,
    height: source.height,
    originalWidth: source.width,
    originalHeight: source.height
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

    const state = imageState();
    const scale = fitImageIntoCanvas(
      ScaleMode.contain,
      state.originalWidth,
      state.originalHeight,
      canvas.width,
      canvas.height,
      DEFAULT_IMAGE_STATE.aspectRatio
    );

    // Move to center and fit the image
    imageEditorManager().origin(-(state.originalWidth / 2), -(state.originalHeight / 2), false);
    imageEditorManager().moveTo(canvas.width / 2, canvas.height / 2, false);
    const newState = imageEditorManager().resize(scale[0], scale[1], false);

    setImageState(newState);
  };

  const onCanvasResized = (canvasWidth: number, canvasHeight: number) => {
    imageEditorManager().resizeCanvas(canvasWidth, canvasHeight);

    const state = imageState();
    const canvas = imageEditorManager().getCanvas();
    const [scaleX, scaleY] = fitImageIntoCanvas(
      ScaleMode.contain,
      state.originalWidth,
      state.originalHeight,
      canvas.width,
      canvas.height,
      state.aspectRatio
    );

    // Move to center and fit the image
    imageEditorManager().origin(-(state.originalWidth / 2), -(state.originalHeight / 2), false);
    imageEditorManager().moveTo(canvas.width / 2, canvas.height / 2, false);
    imageEditorManager().resize(scaleX, scaleY, false);
  };

  const handleChangeEvent = (event: ImageChangeEvent): ImageState => {
    const state = imageEditorManager().getCurrentImageState();
    switch(event.type) {
      case ImageChangeType.filter: {
        return imageEditorManager().filter(event.value);
      }
      case ImageChangeType.aspectRatio: {
        const canvas = imageEditorManager().getCanvas();
        const [scaleX, scaleY] = fitImageIntoCanvas(
          ScaleMode.contain,
          state.originalWidth,
          state.originalHeight,
          canvas.clientWidth,
          canvas.clientHeight,
          event.value
        );

        return imageEditorManager().resize(scaleX, scaleY, event.animation);
      }
      case ImageChangeType.rotate: {
        return imageEditorManager().rotate(event.value, event.animation);
      }
      case ImageChangeType.move: {
        const state = imageEditorManager().getCurrentImageState();
        return imageEditorManager().moveTo(state.translation[0] + event.deltaX, state.translation[1] + event.deltaY, event.animation);
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

          // if(event.layer.type === ImageLayerType.text && !!event.layer.text) {
          //   renderTextLayer(event.layer.text, event.layer).then(texture => {
          //     event.layer.texture = texture;
          //     event.layer.origin = [-(texture.width / 2) / window.devicePixelRatio, -(texture.height / 2) / window.devicePixelRatio];

          //     imageEditorManager().pushState(newState);
          //     imageEditorManager().triggerRerender({renderAllLayers: true})
          //   });
          // }
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
    const resultImage = await imageEditorManager().compileImage();

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

  const onActiveLayerChange = (layer?: ImageLayer) => {
    if(!layer) {
      setCurrentLayerIndex(-1);
    } else {
      const index = imageState().layers.findIndex(l => l === layer);

      setCurrentLayerIndex(index);
    }
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

    const canvas = imageEditorManager().getCanvas();
    const layerTranslation: [number, number] = [
      canvas.width / 2,
      canvas.height / 2
    ];

    // add default layer
    if(tab.tabId === TabType.TEXT) {
      newState.layers.push({
        ...DEFAULT_TEXT_LAYER,
        id: getLayerNextId(),
        translation: layerTranslation
      });
      layerIndex++;
    } else if(tab.tabId === TabType.PAINT) {
      newState.layers.push({
        ...DEFAULT_DRAW_LAYER,
        id: getLayerNextId(),
        translation: layerTranslation
      });
      layerIndex++;
    } else if(tab.tabId === TabType.STICKER) {
      newState.layers.push({
        ...DEFAULT_STICKER_LAYER,
        id: getLayerNextId(),
        translation: layerTranslation
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
