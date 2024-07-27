import {createSignal, createEffect, on, onMount, onCleanup} from 'solid-js';
import {ImageChangeType, StickerLayer, AttachmentChangeAction, ImageChangeEvent} from '../types';
import {Draggable} from '../draggable/draggable';
import {DraggingSurface} from '../draggable/surface';
import rootScope from '../../../lib/rootScope';
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

  onMount(() => {
    rerenderSticker();
  });

  createEffect(on(() => [props.width, props.height], () => {
    elRef().style.width = `${props.width}px`;
    elRef().style.height = `${props.height}px`;
  }));

  createEffect(on(() => props.animate, (animate) => {
    if(animate) {
      props.stickerRenderer.observeAnimated(elRef());
    } else {
      props.stickerRenderer.unobserveAnimated(elRef());
    }
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
  animatedStickers: boolean;
  layer: StickerLayer;
  isActive: boolean;
  onClick: () => void;
  onImageChange: (imageChangeEvent: ImageChangeEvent) => void;
}
export function DraggableSticker(props: DraggableStickerProps) {
  const [isActiveInternal, setActiveInternalState] = createSignal(props.isActive);
  const layer = () => props.layer;

  createEffect(on(() => props.isActive, (isActive) => {
    setActiveInternalState(isActive);
  }));

  const onClick = () => {
    setActiveInternalState(true);
    props.onClick();
  };

  const handleResize = (scale: [number, number]) => {
    const l = layer();
    const newWidth = l.width * scale[0];
    const newHeight = l.width * scale[0];

    const center = [
      l.translation[0] - l.origin[0],
      l.translation[1] - l.origin[1]
    ];
    const origin = [-newWidth / 2, -newHeight / 2] as [number, number];
    const translation = [
      center[0] + origin[0],
      center[1] + origin[1]
    ] as [number, number];

    props.onImageChange({
      type: ImageChangeType.layer,
      layerId: layer().id,
      layer: {
        width: newWidth,
        height: newHeight,
        translation,
        origin
      },
      action: AttachmentChangeAction.update
    });
  }

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
      origin={layer().origin}
      onClick={onClick}
      onMove={(translation: [number, number]) => {
        props.onImageChange({
          type: ImageChangeType.layer,
          layerId: layer().id,
          layer: {
            translation
          },
          action: AttachmentChangeAction.update
        });
      }}
      onResize={handleResize}
      onRotate={(rotation: number) => {
        props.onImageChange({
          type: ImageChangeType.layer,
          layerId: layer().id,
          layer: {
            rotation
          },
          action: AttachmentChangeAction.update
        });
      }}
      onRemove={() => {
        props.onImageChange({
          type: ImageChangeType.layer,
          layerId: layer().id,
          action: AttachmentChangeAction.delete
        });
      }}>
      <SuperSticker
        animate={props.animatedStickers}
        stickerRenderer={props.stickerRenderer}
        stickerId={layer().stickerId}
        width={layer().width}
        height={layer().height}
      />
    </Draggable>
  );
}
