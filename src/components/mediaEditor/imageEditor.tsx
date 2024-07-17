import {createEffect, createSignal, on, batch, onCleanup} from 'solid-js';
import rootScope from '../../lib/rootScope';
import LazyLoadQueue from '../lazyLoadQueue';
import SuperStickerRenderer from '../emoticonsDropdown/tabs/SuperStickerRenderer';

import {ImageChangeType, ImageChangeEvent, ImageSource, ImageState, ObjectLayer, AttachmentChangeAction, ObjectLayerType, BrushStyle, BrushTouch} from './types';
import {DEFAULT_IMAGE_STATE, DEFAULT_TEXT_LAYER, NEON_BRUSH_BORDER_COLOR, NEON_BRUSH_BORDER_WIDTH} from './consts';
import {ImageEditorPreview} from './imageEditorPreview';
import {ImageEditorTabs, TABS_CONFIG, TabType} from './imageEditorTabs';
import {ImageEditorManager} from './imageEditorManager';
import {ButtonIconTsx} from '../buttonIconTsx';
import {fitImageIntoCanvas, ScaleMode} from './helpers/aspectRatioHelper';
import {createImageElementTextureSource} from './webgl/helpers/webglTexture';
import {getLayerNextId, getRandomLayerStartPosition} from './helpers/layerHelper';
import {anyColorToRgbaColor, ColorFormatType} from '../../helpers/color';

export function createImageState(source: ImageSource): ImageState {
  const texture = createImageElementTextureSource(source, source.width, source.height);
  return {
    ...DEFAULT_IMAGE_STATE,
    layers: [],
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
  const [stickerRenderer, setStickerRenderer] = createSignal(new SuperStickerRenderer({
    regularLazyLoadQueue: new LazyLoadQueue(),
    group: 'MEDIA-EDITOR',
    managers: rootScope.managers
  }));
  const [imageEditorManager] = createSignal(new ImageEditorManager(stickerRenderer(), createImageState(props.imgSource)));
  const [imageState, setImageState] = createSignal(createImageState(props.imgSource));
  const [canRedo, setCanRedu] = createSignal(false);
  const [canUndo, setCanUndo] = createSignal(false);
  const [layersToRender, setLayersToRender] = createSignal([ObjectLayerType.backgroundImage]);
  const [currentLayerIndex, setCurrentLayerIndex] = createSignal(-1);
  const [selectedTabId, setSelectedTabId] = createSignal(TABS_CONFIG[0].tabId);

  onCleanup(() => {
    imageEditorManager().destroy();
  });

  createEffect(on(() => [props.imgSource], () => {
    const newImageState = createImageState(props.imgSource);

    setImageState(newImageState);
    imageEditorManager().pushState(newImageState);
  }));

  createEffect(() => {
    imageEditorManager().triggerRerender({render: true, layers: layersToRender()});
  });

  const onCanvasMounted = async(canvas: HTMLCanvasElement) => {
    imageEditorManager().init(canvas);

    const state = imageEditorManager().getCurrentImageState();
    const scale = fitImageIntoCanvas(
      ScaleMode.contain,
      state.originalWidth,
      state.originalHeight,
      canvas.width,
      canvas.height,
      DEFAULT_IMAGE_STATE.aspectRatio
    );

    // Move to center and fit the image
    imageEditorManager().origin(-state.originalWidth / 2, -state.originalHeight / 2, false);
    const newState = imageEditorManager().moveTo(canvas.width / 2, canvas.height / 2, false);
    // const newState = imageEditorManager().resize(scale[0], scale[1], false, {render: true, layers: layersToRender()});

    setImageState(newState);
  };

  const onCanvasResized = (canvasWidth: number, canvasHeight: number) => {
    imageEditorManager().resizeCanvas(canvasWidth, canvasHeight);

    const state = imageEditorManager().getCurrentImageState();
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
    imageEditorManager().origin(-state.originalWidth / 2, -state.originalHeight / 2, false, {render: true, layers: layersToRender()});
    const newState = imageEditorManager().moveTo(canvas.width / 2, canvas.height / 2, false, {render: true, layers: layersToRender()});
    // imageEditorManager().resize(scaleX, scaleY, false, {render: true, layers: layersToRender()});

    setImageState(newState);
  };

  const handleChangeEvent = (event: ImageChangeEvent): ImageState => {
    const state = imageEditorManager().getCurrentImageState();
    switch(event.type) {
      case ImageChangeType.filter: {
        return imageEditorManager().filter(event.value, {render: true, layers: layersToRender()});
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

        return imageEditorManager().resize(scaleX, scaleY, event.animation, {render: true, layers: layersToRender()});
      }
      case ImageChangeType.rotate: {
        return imageEditorManager().rotate(event.value, event.animation, {render: true, layers: layersToRender()});
      }
      case ImageChangeType.move: {
        const state = imageEditorManager().getCurrentImageState();
        return imageEditorManager().moveTo(
          state.translation[0] + event.deltaX,
          state.translation[1] + event.deltaY,
          event.animation,
          {render: true, layers: layersToRender()}
        );
      }
      case ImageChangeType.resize: {
        return imageEditorManager().resize(event.scaleX, event.scaleY, event.animation, {render: true, layers: layersToRender()});
      }
      case ImageChangeType.flip: {
        return imageEditorManager().flipHorisontaly(event.animation, {render: true, layers: layersToRender()});
      }
      case ImageChangeType.layer: {
        const state = imageEditorManager().getCurrentImageState();
        let newState: ImageState;

        if(event.action === AttachmentChangeAction.create) {
          const newLayerState = {
            ...event.layer,
            id: getLayerNextId()
          };
          if(event.appearInRandomSpot) {
            const canvas = imageEditorManager().getCanvas();
            newLayerState.translation = getRandomLayerStartPosition(canvas.width, canvas.height);
          }
          const newLayers = [...state.layers, newLayerState];
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

        imageEditorManager().pushState(newState, {render: false});

        return newState;
      }
      case ImageChangeType.drawLayer: {
        const state = imageEditorManager().getCurrentImageState();
        const newState: ImageState = {
          ...state,
          drawLayer: {
            ...state.drawLayer,
            ...event.layer
          }
        };
        imageEditorManager().pushState(newState, {render: false});

        return newState;
      }
      case ImageChangeType.drawTouch: {
        const state = imageEditorManager().getCurrentImageState();
        const newTouch: BrushTouch = {
          x: event.touchX,
          y: event.touchY,
          color: {...state.drawLayer.color},
          style: state.drawLayer.style,
          size: state.drawLayer.size,
          borderColor: NEON_BRUSH_BORDER_COLOR,
          borderWidth: NEON_BRUSH_BORDER_WIDTH
        };
        if(state.drawLayer.style === BrushStyle.brush) {
          const rgba = anyColorToRgbaColor(newTouch.color);
          newTouch.size *= 2;
          rgba[3] /= 2;
          newTouch.color = {
            type: ColorFormatType.rgba,
            value: rgba
          };
        }
        if(state.drawLayer.style === BrushStyle.neon) {
          newTouch.color = NEON_BRUSH_BORDER_COLOR;
          newTouch.borderColor = {...state.drawLayer.color};
        }

        return imageEditorManager().brushTouch(newTouch, {render: true, layers: layersToRender()});
      }
    }
  };

  const onImageChange = (imageChangeEvent: ImageChangeEvent) => {
    const newState = handleChangeEvent(imageChangeEvent);

    batch(() => {
      setImageState(newState);
      setCanUndo(imageEditorManager().canUndo());
      setCanRedu(imageEditorManager().canRedo());
    });
  };

  const handleClose = () => {
    // show confirmation popup.
    props.onClose();
  };

  const handleSave = async() => {
    const resultImage = await imageEditorManager().compileImage({render: true, layers: 'all'});

    // props.onSave(resultImage);
  };

  const handleUndo = () => {
    const newState = imageEditorManager().undo();

    batch(() => {
      setImageState(newState);
      setCanUndo(imageEditorManager().canUndo());
      setCanRedu(imageEditorManager().canRedo());
    });
  };

  const handleRedo = () => {
    const newState = imageEditorManager().redo();

    batch(() => {
      setImageState(newState);
      setCanUndo(imageEditorManager().canUndo());
      setCanRedu(imageEditorManager().canRedo());
    });
  };

  const onActiveLayerChange = (layer?: ObjectLayer) => {
    if(!layer) {
      setCurrentLayerIndex(-1);
      return;
    }

    const index = imageEditorManager().getCurrentImageState().layers.findIndex(l => l === layer);
    if(layer.type === ObjectLayerType.text) {
      setSelectedTabId(TabType.TEXT);
    } else if(layer.type === ObjectLayerType.sticker) {
      setSelectedTabId(TabType.STICKER);
    }

    setCurrentLayerIndex(index);
  };

  const handleTabSelection = (tabId: TabType) => {
    const state = imageEditorManager().getCurrentImageState();
    let newActiveLayerIndex = -1;
    let newState = state;

    // remove all text layers if it was untouched
    const currentLayers = [...state.layers];
    for(const layer of currentLayers) {
      if(layer.type === ObjectLayerType.text && !layer.isDirty) {
        newState = handleChangeEvent({
          type: ImageChangeType.layer,
          action: AttachmentChangeAction.delete,
          layer
        });
      }
    }

    // add default layer
    if(tabId === TabType.TEXT) {
      newState = handleChangeEvent({
        type: ImageChangeType.layer,
        action: AttachmentChangeAction.create,
        layer: DEFAULT_TEXT_LAYER,
        appearInRandomSpot: true
      });
      // set new text layer as active
      newActiveLayerIndex = newState.layers.length - 1;
    }

    const layersToRender = [ObjectLayerType.backgroundImage];
    if([TabType.TEXT, TabType.DRAW, TabType.STICKER].includes(tabId)) {
      layersToRender.push(ObjectLayerType.draw);
    }

    batch(() => {
      setImageState(newState);
      setSelectedTabId(tabId);
      setCurrentLayerIndex(newActiveLayerIndex);
      setLayersToRender(layersToRender);
    });
  };

  return (
    <div class="image-editor">
      <ImageEditorPreview
        imageState={imageState()}
        currentLayerIndex={currentLayerIndex()}
        selectedTabId={selectedTabId()}
        stickerRenderer={stickerRenderer()}
        onCanvasMounted={onCanvasMounted}
        onCanvasResized={onCanvasResized}
        onImageChange={onImageChange}
        onActiveLayerChange={onActiveLayerChange}
      />
      <ImageEditorTabs
        selectedTabId={selectedTabId()}
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
