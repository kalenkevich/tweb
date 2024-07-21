import {createSignal, createEffect, on, onMount, onCleanup} from 'solid-js';
import {ImageChangeType, StickerLayer, AttachmentChangeAction, ImageChangeEvent} from '../types';
import {Draggable} from '../draggable/draggable';
import {DraggingSurface} from '../draggable/surface';
import rootScope from '../../../lib/rootScope';
import {MyDocument} from '../../../lib/appManagers/appDocsManager';
import SuperStickerRenderer from '../../emoticonsDropdown/tabs/SuperStickerRenderer';

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
  const [origin, setOrigin] = createSignal<[number, number]>([
    -props.layer.width / 2,
    -props.layer.height / 2
  ]);
  const layer = () => props.layer;

  createEffect(on(() => props.isActive, (isActive) => {
    setActiveInternalState(isActive);
  }));

  createEffect(on(() => [props.layer.width, props.layer.height], () => {
    setOrigin([
      -props.layer.width / 2,
      -props.layer.height / 2
    ]);
  }));

  const onClick = () => {
    setActiveInternalState(true);
    props.onClick();
  };

  return (
    <Draggable
      surface={props.surface}
      active={isActiveInternal()}
      movable={true}
      resizable={true}
      rotatable={true}
      removable={true}
      translation={layer().translation}
      scale={layer().scale}
      rotation={layer().rotation}
      origin={origin()}
      onClick={onClick}
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
        const newWidth = layer().width * scale[0];
        const newHeight = layer().width * scale[0];

        props.onImageChange({
          type: ImageChangeType.layer,
          layer: {
            ...layer(),
            width: newWidth,
            height: newHeight,
            origin: [-newWidth / 2, -newHeight / 2]
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
      }}
      onRemove={() => {
        props.onImageChange({
          type: ImageChangeType.layer,
          layer: layer(),
          action: AttachmentChangeAction.delete
        });
      }}>
      <SuperSticker
        animate={true}
        stickerRenderer={props.stickerRenderer}
        stickerId={layer().stickerId}
        width={layer().width}
        height={layer().height}
      />
    </Draggable>
  );
}
