import {createSignal, For, onMount} from 'solid-js';
import {TextLayer, ImageLayer, ImageLayerType, StickerLayer} from '../types';
import {ImageControlProps} from './imageControl';
import {DraggingSurface} from '../draggable/surface';
import {DraggableText} from './draggableText';
import {DraggableSticker} from './draggableSticker';
import rootScope from '../../../lib/rootScope';
import LazyLoadQueue from '../../lazyLoadQueue';
import SuperStickerRenderer from '../../emoticonsDropdown/tabs/SuperStickerRenderer';

export interface DraggableObjectsProps extends ImageControlProps {
  surface: DraggingSurface;
  stickerRenderer: SuperStickerRenderer;
  onActiveLayerChange: (layer?: ImageLayer) => void;
}
export function DraggableObjects(props: DraggableObjectsProps) {
  const [elRef, setElRef] = createSignal<HTMLDivElement>();
  const [renderer, setRenderer] = createSignal<SuperStickerRenderer>()
  const textObjects = () => props.imageState.layers.filter(l => l.type === ImageLayerType.text) as TextLayer[];
  const stickerObjects = () => props.imageState.layers.filter(l => l.type === ImageLayerType.sticker) as StickerLayer[];

  const handleBackdropClick = (e: Event) => {
    if((e.target as HTMLDivElement) === elRef()) {
      props.onActiveLayerChange(null);
    }
  };

  onMount(() => {
    setRenderer(
      new SuperStickerRenderer({
        regularLazyLoadQueue: new LazyLoadQueue(),
        group: 'MEDIA-EDITOR',
        managers: rootScope.managers
      })
    );
  });

  return (
    <div class="image-editor__image-control draggable-objects"
      ref={(el) => setElRef(el)}
      onClick={handleBackdropClick}>
      <For each={textObjects()}>
        {(layer: TextLayer) => (
          <DraggableText
            surface={props.surface}
            layer={layer as TextLayer}
            isActive={layer === props.imageState.layers[props.currentLayerIndex]}
            onClick={() => props.onActiveLayerChange(layer)}
            onImageChange={props.onImageChange}
          />
        )}
      </For>
      <For each={stickerObjects()}>
        {(layer: StickerLayer) => (
          <DraggableSticker
            surface={props.surface}
            stickerRenderer={props.stickerRenderer}
            layer={layer as StickerLayer}
            isActive={layer === props.imageState.layers[props.currentLayerIndex]}
            onClick={() => props.onActiveLayerChange(layer)}
            onImageChange={props.onImageChange}
          />
        )}
      </For>
    </div>
  );
}
