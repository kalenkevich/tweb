import {createSignal, createEffect, on, onMount, onCleanup} from 'solid-js';
import {ImageChangeType, StickerLayer, AttachmentChangeAction, ImageChangeEvent} from '../types';
import {DRAGGABLE_OBJECT_TOP_BOTTOM_PADDING, DRAGGABLE_OBJECT_TOP_LEFT_RIGHT} from '../consts';
import {Draggable} from '../draggable/draggable';
import {DraggingSurface} from '../draggable/surface';
import rootScope from '../../../lib/rootScope';
import {MyDocument} from '../../../lib/appManagers/appDocsManager';
import SuperStickerRenderer from '../../emoticonsDropdown/tabs/SuperStickerRenderer';
import {IconTsx} from '../../iconTsx';

export interface SuperStickerProps {
  stickerId: string;
  width: number;
  height: number;
  stickerRenderer: SuperStickerRenderer;
  animate: boolean;
}
export function SuperSticker(props: SuperStickerProps) {
  const [elRef, setElRef] = createSignal<HTMLDivElement>();
  const [doc, setDoc] = createSignal<MyDocument>();

  onMount(() => {
    rerenderSticker();
  });

  createEffect(on(() => [props.width, props.height], () => {
    elRef().style.width = `${props.width}px`;
    elRef().style.height = `${props.height}px`;
  }));

  onCleanup(() => {
    if(props.animate) {
      props.stickerRenderer.unobserveAnimated(elRef());
    }
  });

  const rerenderSticker = async() => {
    const el = elRef();
    const renderer = props.stickerRenderer;

    el.style.width = `${props.width}px`;
    el.style.height = `${props.height}px`;
    const doc = await rootScope.managers.appDocsManager.getDoc(props.stickerId);
    renderer.renderSticker(doc, el, undefined, undefined, props.width * window.devicePixelRatio, props.height * window.devicePixelRatio);

    if(props.animate) {
      renderer.observeAnimated(el);
    }
  };

  return (
    <div ref={((el) => setElRef(el))}></div>
  );
}

export interface DraggableStickerProps {
  isMobile: boolean;
  surface: DraggingSurface;
  stickerRenderer: SuperStickerRenderer;
  layer: StickerLayer;
  isActive: boolean;
  onClick: () => void;
  onImageChange: (imageChangeEvent: ImageChangeEvent) => void;
}
export function DraggableSticker(props: DraggableStickerProps) {
  const [isActiveInternal, setActiveInternalState] = createSignal(props.isActive);
  const [removeWrapperEl, setRemoveWrapperEl] = createSignal<HTMLDivElement>();
  const layer = () => props.layer;

  onMount(() => {
    window.addEventListener('keyup', onKeyUp);
  });

  onCleanup(() => {
    window.removeEventListener('keyup', onKeyUp);
  });

  createEffect(on(() => props.isActive, (isActive) => {
    setActiveInternalState(isActive);
  }));

  const onWrapperMouseDown = (e: Event) => {
    if(e.target === removeWrapperEl()) {
      removeObject();
    } else {
      setActiveInternalState(true);
      props.onClick();
    }
  };

  const onKeyUp = (e: KeyboardEvent) => {
    const isBackspaceKey = e.key === 'Backspace';

    if(isBackspaceKey && isActiveInternal()) {
      removeObject();
    }
  };

  const removeObject = () => {
    props.onImageChange({
      type: ImageChangeType.layer,
      layer: layer(),
      action: AttachmentChangeAction.delete
    });
  };

  return (
    <Draggable
      surface={props.surface}
      active={isActiveInternal()}
      movable={true}
      resizable={true}
      rotatable={true}
      translation={layer().translation}
      scale={layer().scale}
      rotation={layer().rotation}
      onMove={(translation: [number, number]) => {
        props.onImageChange({
          type: ImageChangeType.layer,
          layer: {
            ...layer(),
            translation
          },
          action: AttachmentChangeAction.update
        });
      }}
      onResize={(scale: [number, number]) => {
        props.onImageChange({
          type: ImageChangeType.layer,
          layer: {
            ...layer(),
            width: layer().width * scale[0],
            height: layer().height * scale[1]
          },
          action: AttachmentChangeAction.update
        });
      }}
      onRotate={(rotation: number) => {
        props.onImageChange({
          type: ImageChangeType.layer,
          layer: {
            ...layer(),
            rotation
          },
          action: AttachmentChangeAction.update
        });
      }}>
      <div class="draggable-object draggable-sticker"
        classList={{'active': isActiveInternal()}}
        onTouchStart={onWrapperMouseDown}
        onMouseDown={onWrapperMouseDown}>
        <div class="draggable-object__remove-icon-wrapper" ref={el => setRemoveWrapperEl(el)}>
          <IconTsx class="draggable-object__remove-icon" icon="close"/>
        </div>
        <SuperSticker
          animate={true}
          stickerRenderer={props.stickerRenderer}
          stickerId={layer().stickerId}
          width={layer().width}
          height={layer().height}
        />
      </div>
    </Draggable>
  );
}
