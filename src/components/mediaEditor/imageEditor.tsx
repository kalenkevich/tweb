import {createEffect, createSignal, on, batch, onCleanup, onMount, Show} from 'solid-js';
import LazyLoadQueue from '../lazyLoadQueue';
import {ButtonIconTsx} from '../buttonIconTsx';
import SuperStickerRenderer from '../emoticonsDropdown/tabs/SuperStickerRenderer';
import rootScope from '../../lib/rootScope';
import mediaSizes from '../../helpers/mediaSizes';
import debounce from '../../helpers/schedulers/debounce';
import {anyColorToRgbaColor, ColorFormatType} from '../../helpers/color';
import themeController from '../../helpers/themeController';
import {
  ImageChangeType,
  ImageChangeEvent,
  ImageSource,
  ImageState,
  ObjectLayer,
  AttachmentChangeAction,
  ObjectLayerType,
  BrushStyle,
  BrushTouch,
  ImageAspectRatio
} from './types';
import {
  MAX_FONT_SIZE,
  DEFAULT_IMAGE_STATE,
  DEFAULT_TEXT_LAYER,
  NEON_BRUSH_BORDER_COLOR,
  NEON_BRUSH_BORDER_WIDTH,
  TRANPARENT_COLOR,
  DRAW_ARROW_CAP_AFTER_MS,
  IMAGE_EDITOR_MOBILE_WIDTH_THRESHOLD,
  WHITE_COLOR_HEX,
  BLACK_COLOR_HEX
} from './consts';
import {NavigationBar} from './navigationBar';
import {ImageEditorManager} from './imageEditorManager';
import {ImageEditorPreview} from './imageEditorPreview';
import {ImageEditorTabs, TABS_CONFIG, TabType} from './imageEditorTabs';
import {createImageElementTextureSource} from './webgl/helpers/webglTexture';
import {getLayerNextId, getRandomLayerStartPosition} from './helpers/layerHelper';
import {canDrawArrow, getArrowCapTouches} from './helpers/arrowBrushHelper';

const a = document.createElement('a');
document.body.appendChild(a);
a.style.display = 'none';
function saveBlobAsFile(blob: Blob, fileName: string) {
  const url = window.URL.createObjectURL(blob);
  a.href = url;
  a.download = fileName;
  a.click();
  window.URL.revokeObjectURL(url);
}

function Preloader() {
  return (
    <div class="preloader">
      <svg xmlns="http://www.w3.org/2000/svg" class="preloader-circular" viewBox="25 25 50 50">
        <circle class="preloader-path" cx="50" cy="50" r="20" fill="none" stroke-miterlimit="10"/>
      </svg>
    </div>
  );
}

export function createImageState(source: ImageSource): ImageState {
  const texture = createImageElementTextureSource(source, source.width, source.height);
  return {
    ...DEFAULT_IMAGE_STATE,
    layers: [],
    source,
    texture,
    resultWidth: source.width,
    resultHeight: source.height,
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
  const [imageEditorManager] = createSignal(new ImageEditorManager(createImageState(props.imgSource)));
  const [imageState, setImageState] = createSignal(createImageState(props.imgSource));
  const [layersToRender, setLayersToRender] = createSignal([ObjectLayerType.backgroundImage]);
  const [currentLayerIndex, setCurrentLayerIndex] = createSignal(-1);
  const [selectedTabId, setSelectedTabId] = createSignal(isMobile() ? undefined : TABS_CONFIG[0].tabId);
  const [currentBrushSequence, setCurrentBrushSequence] = createSignal(0);
  const [canRedo, setCanRedu] = createSignal(false);
  const [canUndo, setCanUndo] = createSignal(false);
  const [compileInProgress, setCompileInProgress] = createSignal(false);
  const showSaveButton = () => !isMobile() && selectedTabId() !== TabType.RESIZE;

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
    imageEditorManager().resizeCanvas(canvasWidth, canvasHeight, {render: false});
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
        const state = imageEditorManager().getCurrentImageState();

        return imageEditorManager().pushState({
          ...state,
          aspectRatio: event.value
        }, {render: false});
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
      case ImageChangeType.crop: {
        const state = imageEditorManager().crop(
          event.x,
          event.y,
          event.width,
          event.height,
          event.animation,
          {render: true, layers: layersToRender()}
        );

        return imageEditorManager().pushState({
          ...state,
          aspectRatio: ImageAspectRatio.original
        }, {render: false});
      }
      case ImageChangeType.flip: {
        const state = imageEditorManager().getCurrentImageState();

        return imageEditorManager().resize(-state.scale[0], state.scale[1], event.animation, {render: true, layers: layersToRender()});
      }
      case ImageChangeType.layerTranslation: {
        const layer = {...state.layers.find(l => l.id === event.layerId)};

        if(event.translation[0] === layer.translation[0] && event.translation[1] === layer.translation[1]) {
          return state;
        }

        return handleChangeEvent({
          type: ImageChangeType.layer,
          action: AttachmentChangeAction.update,
          layerId: event.layerId,
          layer: {
            ...layer,
            translation: event.translation
          }
        });
      }
      case ImageChangeType.layerOrigin: {
        const layer = {...state.layers.find(l => l.id === event.layerId)};

        if(event.origin[0] === layer.origin[0] && event.origin[1] === layer.origin[1]) {
          return state;
        }

        return handleChangeEvent({
          type: ImageChangeType.layer,
          action: AttachmentChangeAction.update,
          layerId: event.layerId,
          layer: {
            ...layer,
            origin: event.origin,
            translation: event.translation
          }
        });
      }
      case ImageChangeType.textLayerFontSize: {
        const state = imageEditorManager().getCurrentImageState();
        const fontSize = Math.min(event.fontSize, MAX_FONT_SIZE);
        const textLayer = {...state.layers.find(l => l.id === event.layerId)};
        if(textLayer.type === ObjectLayerType.text) {
          textLayer.fontSize = fontSize;
          textLayer.padding = fontSize / 2;
          textLayer.borderRadius = fontSize / 4;
          textLayer.strokeWidth = fontSize / 6;
        }

        return handleChangeEvent({
          type: ImageChangeType.layer,
          action: AttachmentChangeAction.update,
          layerId: event.layerId,
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
              canvas.width * 0.25,
              canvas.height * 0.25,
              canvas.width * 0.75,
              canvas.height * 0.75
            );
          }
          const newLayers = [...state.layers, newLayerState];
          newState = {
            ...state,
            layers: newLayers as ObjectLayer[]
          };
        } else if(event.action === AttachmentChangeAction.update) {
          const newLayers = state.layers.map((l) => l.id === event.layerId ? ({...l, ...event.layer}) : l);
          newState = {
            ...state,
            layers: newLayers as ObjectLayer[]
          };
        } else if(event.action === AttachmentChangeAction.delete) {
          const newLayers = state.layers.filter((l) => l.id !== event.layerId);
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
    setCompileInProgress(true);

    const blob = await imageEditorManager().compileImage({render: true, layers: 'all'});
    setCompileInProgress(false);

    props.onSave(blob);
  };

  const handleUndo = () => {
    const newState = imageEditorManager().undo({render: true, layers: layersToRender()});

    batch(() => {
      setImageState(newState);
      setCanUndo(imageEditorManager().canUndo());
      setCanRedu(imageEditorManager().canRedo());
    });
  };

  const handleRedo = () => {
    const newState = imageEditorManager().redo({render: true, layers: layersToRender()});

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
    if(index === currentLayerIndex()) {
      return;
    }

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
          layerId: layer.id,
          action: AttachmentChangeAction.delete
        });
      }
    }

    // add default layer
    if(tabId === TabType.TEXT) {
      newState = handleChangeEvent({
        type: ImageChangeType.layer,
        action: AttachmentChangeAction.create,
        layerId: -1,
        layer: {
          ...DEFAULT_TEXT_LAYER,
          color: themeController.isNight() ? WHITE_COLOR_HEX : BLACK_COLOR_HEX,
          strokeColor: themeController.isNight() ? BLACK_COLOR_HEX : WHITE_COLOR_HEX,
          secondColor: themeController.isNight() ? BLACK_COLOR_HEX : WHITE_COLOR_HEX
        },
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
      <Show when={compileInProgress()}>
        <div class="image-editor__loading-backdrop"></div>
      </Show>
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
        animatedStickers={!compileInProgress()}
        onSave={handleSave}
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
      <Show when={showSaveButton()}>
        <div class="image-editor__save-button">
          <Show when={compileInProgress()}>
            <div class="preloade-wrapper">
              <Preloader/>
            </div>
          </Show>
          <ButtonIconTsx
            disabled={compileInProgress()}
            class="btn-circle btn-corner"
            icon={compileInProgress() ? 'empty' : 'check'}
            onClick={handleSave}
          />
        </div>
      </Show>
    </div>
  )
}
