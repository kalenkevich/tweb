import {createSignal, createEffect, on, onMount} from 'solid-js';
import {ImageChangeType, StickerLayer, AttachmentChangeAction, ImageChangeEvent} from '../types';
import {DRAGGABLE_OBJECT_TOP_BOTTOM_PADDING, DRAGGABLE_OBJECT_TOP_LEFT_RIGHT} from '../consts';
import {Draggable} from '../draggable/draggable';
import {DraggingSurface} from '../draggable/surface';
import rootScope from '../../../lib/rootScope';
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

  onMount(() => {
    rerenderSticker();
  });

  const rerenderSticker = async() => {
    const el = elRef();
    const renderer = props.stickerRenderer;

    el.style.width = `${props.width}px`;
    el.style.height = `${props.height}px`;
    const doc = await rootScope.managers.appDocsManager.getDoc(props.stickerId);
    renderer.renderSticker(doc, el);

    if(props.animate) {
      renderer.observeAnimated(el);
    }
  };

  return (
    <div ref={((el) => setElRef(el))}></div>
  );
}

export interface DraggableStickerProps {
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
  const draggingModeEnabled = () => isActiveInternal();
  const layer = () => props.layer;

  createEffect(on(() => props.isActive, (isActive) => {
    setActiveInternalState(isActive);
  }));

  const onWrapperMouseDown = (e: Event) => {
    if(e.target === removeWrapperEl()) {
      props.onImageChange({
        type: ImageChangeType.layer,
        layer: layer(),
        action: AttachmentChangeAction.delete
      });
    } else {
      setActiveInternalState(true);
      props.onClick();
    }
  };

  return (
    <Draggable
      surface={props.surface}
      enabled={draggingModeEnabled()}
      translation={layer().translation}
      scale={layer().scale}
      rotation={layer().rotation}
      onChange={(translation: [number, number]) => {
        props.onImageChange({
          type: ImageChangeType.layer,
          layer: {
            ...layer(),
            translation
          },
          action: AttachmentChangeAction.update
        });
      }}>
      <div class="draggable-object draggable-sticker"
        classList={{'active': isActiveInternal()}}
        style={{'padding': `${DRAGGABLE_OBJECT_TOP_BOTTOM_PADDING}px ${DRAGGABLE_OBJECT_TOP_LEFT_RIGHT}px`}}
        onMouseDown={onWrapperMouseDown}>
        <div class="draggable-object__remove-icon-wrapper" ref={el => setRemoveWrapperEl(el)}>
          <IconTsx class="draggable-object__remove-icon" icon="close"/>
        </div>
        <SuperSticker
          stickerRenderer={props.stickerRenderer}
          width={layer().width}
          height={layer().height}
          stickerId={layer().stickerId}
          animate={true}
        />
      </div>
    </Draggable>
  );
}
