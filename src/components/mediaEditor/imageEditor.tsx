import {createEffect, createSignal, on, batch, onCleanup, onMount, Show} from 'solid-js';
import LazyLoadQueue from '../lazyLoadQueue';
import {ButtonIconTsx} from '../buttonIconTsx';
import SuperStickerRenderer from '../emoticonsDropdown/tabs/SuperStickerRenderer';
import rootScope from '../../lib/rootScope';
import mediaSizes from '../../helpers/mediaSizes';
import debounce from '../../helpers/schedulers/debounce';
import {anyColorToRgbaColor, ColorFormatType} from '../../helpers/color';
import {
  ImageChangeType,
  ImageChangeEvent,
  ImageSource,
  ImageState,
  ObjectLayer,
  AttachmentChangeAction,
  ObjectLayerType,
  BrushStyle,
  BrushTouch
} from './types';
import {
  MAX_FONT_SIZE,
  DEFAULT_IMAGE_STATE,
  DEFAULT_TEXT_LAYER,
  NEON_BRUSH_BORDER_COLOR,
  NEON_BRUSH_BORDER_WIDTH,
  TRANPARENT_COLOR,
  DRAW_ARROW_CAP_AFTER_MS,
  IMAGE_EDITOR_MOBILE_WIDTH_THRESHOLD
} from './consts';
import {NavigationBar} from './navigationBar';
import {ImageEditorManager} from './imageEditorManager';
import {ImageEditorPreview} from './imageEditorPreview';
import {ImageEditorTabs, TABS_CONFIG, TabType} from './imageEditorTabs';
import {createImageElementTextureSource} from './webgl/helpers/webglTexture';
import {getLayerNextId, getRandomLayerStartPosition} from './helpers/layerHelper';
import {fitImageIntoCanvas, ScaleMode} from './helpers/aspectRatioHelper';
import {canDrawArrow, getArrowCapTouches} from './helpers/arrowBrushHelper';

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
  onSave: (compiledImage: Blob) => void;
}

export function ImageEditor(props: MediaEditorProps) {
  const [isMobile, setIsMobile] = createSignal(window.innerWidth <= IMAGE_EDITOR_MOBILE_WIDTH_THRESHOLD || mediaSizes.isMobile);
  const [stickerRenderer] = createSignal(new SuperStickerRenderer({
    regularLazyLoadQueue: new LazyLoadQueue(),
    group: 'MEDIA-EDITOR',
    managers: rootScope.managers
  }));
  const [imageEditorManager] = createSignal(new ImageEditorManager(stickerRenderer(), createImageState(props.imgSource)));
  const [imageState, setImageState] = createSignal(createImageState(props.imgSource));
  const [layersToRender, setLayersToRender] = createSignal([ObjectLayerType.backgroundImage]);
  const [currentLayerIndex, setCurrentLayerIndex] = createSignal(-1);
  const [selectedTabId, setSelectedTabId] = createSignal(isMobile() ? undefined : TABS_CONFIG[0].tabId);
  const [currentBrushSequence, setCurrentBrushSequence] = createSignal(0);
  const [canRedo, setCanRedu] = createSignal(false);
  const [canUndo, setCanUndo] = createSignal(false);

  onMount(() => {
    window.addEventListener('resize', onScreenResized);
    onScreenResized();
  });

  onCleanup(() => {
    window.removeEventListener('resize', onScreenResized);
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

  const onScreenResized = () => {
    setIsMobile(window.innerWidth <= IMAGE_EDITOR_MOBILE_WIDTH_THRESHOLD || mediaSizes.isMobile);
  };

  const onCanvasMounted = async(canvas: HTMLCanvasElement) => {
    imageEditorManager().init(canvas);

    onContainerResized(canvas.width, canvas.height);
  };

  const onContainerResized = (canvasWidth: number, canvasHeight: number) => {
    imageEditorManager().resizeCanvas(canvasWidth, canvasHeight);
    imageEditorManager().origin(-canvasWidth / 2, -canvasHeight / 2, false, {render: false});
    const newState = imageEditorManager().moveTo((canvasWidth / 2), (canvasHeight / 2), false, {render: true, layers: layersToRender()});

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
      case ImageChangeType.textLayerFontSize: {
        const state = imageEditorManager().getCurrentImageState();
        const fontSize = Math.min(event.fontSize, MAX_FONT_SIZE);
        const textLayer = {...state.layers.find(l => l.id === event.layerId)};
        if(textLayer.type === ObjectLayerType.text) {
          textLayer.fontSize = fontSize;
          // Math.min(16, Math.max(val / 3, 8));
          textLayer.padding = fontSize / 2;
          // Math.min(24, Math.max(val / 4, 8));
          textLayer.borderRadius = fontSize / 4;
          // Math.min(12, Math.max(val / 6, 4));
          textLayer.strokeWidth = fontSize / 6;
        }

        return handleChangeEvent({
          type: ImageChangeType.layer,
          action: AttachmentChangeAction.update,
          layer: textLayer
        });
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
            newLayerState.translation = getRandomLayerStartPosition(
              canvas.width / 4,
              canvas.height / 4,
              canvas.width - canvas.width / 4,
              canvas.height - canvas.height / 2
            );
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
          sequenceId: currentBrushSequence(),
          color: {...state.drawLayer.color},
          style: state.drawLayer.style,
          size: state.drawLayer.size,
          borderColor: NEON_BRUSH_BORDER_COLOR,
          borderWidth: NEON_BRUSH_BORDER_WIDTH,
          ...event.touch
        };
        if(state.drawLayer.style === BrushStyle.arrow && !event.preventDrawingArrowCap) {
          drawArrowCapIfNeededDebounced();
        }
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
        if(state.drawLayer.style === BrushStyle.eraser) {
          newTouch.color = TRANPARENT_COLOR;
        }
        updateCurrentBrushSequenceBounced();

        return imageEditorManager().brushTouch(newTouch, {render: true, layers: layersToRender()});
      }
    }
  };

  const drawArrowCapIfNeededDebounced = debounce(() => {
    const state = imageEditorManager().getCurrentImageState();
    const brushTouches = state.drawLayer.touches;
    const shouldDrawArrow = canDrawArrow(brushTouches);

    if(!shouldDrawArrow) {
      return;
    }

    const arrowCapTouches = getArrowCapTouches(state.drawLayer, brushTouches);
    for(const touch of arrowCapTouches) {
      handleChangeEvent({
        type: ImageChangeType.drawTouch,
        touch,
        // to not create an infinity loop of arrow cap drawings.
        preventDrawingArrowCap: true
      });
    }
  }, DRAW_ARROW_CAP_AFTER_MS, false, true);

  const updateCurrentBrushSequenceBounced = debounce(() => {
    setCurrentBrushSequence(v => v + 1);
  }, DRAW_ARROW_CAP_AFTER_MS, false, true);

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
    } else if(!isMobile() && layer.type === ObjectLayerType.sticker) {
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
    if(!tabId || [TabType.TEXT, TabType.DRAW, TabType.STICKER].includes(tabId)) {
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
    <div class="image-editor" classList={{'mobile': isMobile()}}>
      <Show when={isMobile()}>
        <NavigationBar
          canUndo={canUndo()}
          canRedo={canRedo()}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onSave={handleSave}
          onClose={handleClose}
        />
      </Show>
      <ImageEditorPreview
        isMobile={isMobile()}
        imageState={imageState()}
        currentLayerIndex={currentLayerIndex()}
        selectedTabId={selectedTabId()}
        stickerRenderer={stickerRenderer()}
        onCanvasMounted={onCanvasMounted}
        onContainerResized={onContainerResized}
        onImageChange={onImageChange}
        onActiveLayerChange={onActiveLayerChange}
      />
      <ImageEditorTabs
        isMobile={isMobile()}
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
      <Show when={!isMobile()}>
        <div class="image-editor__save-button">
          <ButtonIconTsx
            class="btn-circle btn-corner"
            icon="check"
            onClick={handleSave}
          />
        </div>
      </Show>
    </div>
  )
}
