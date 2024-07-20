import {JSX, createSignal, onMount} from 'solid-js';
import {ImageControlProps} from './imageControl';
import {ImageChangeType, AttachmentChangeAction} from '../types';
import {DEFAULT_STICKER_LAYER} from '../consts';
import rootScope from '../../../lib/rootScope';
import mediaSizes from '../../../helpers/mediaSizes';
import StickersTab from '../../emoticonsDropdown/tabs/stickers';
import {EmoticonsDropdown} from '../../emoticonsDropdown';
import {getLayerNextId} from '../helpers/layerHelper';

export interface ImageStickerControlProps extends ImageControlProps {}
export function ImageStickerControl(props: ImageStickerControlProps): JSX.Element {
  const [ref, setRef] = createSignal<HTMLDivElement>();

  onMount(() => {
    const emoticonsDropdown = new EmoticonsDropdown({
      customParentElement: ref(),
      tabsToRender: [new StickersTab(rootScope.managers)],
      stayAlwaysOpen: true,
      fullHeight: true,
      onMount: (el) => {
        el.style.height = `${ref().offsetHeight}px`;
        el.style.maxHeight = `${ref().offsetHeight}px`;
        el.style.setProperty('--height', `${ref().offsetHeight}px`);
      },
      onMediaClicked: (e) => {
        const el = e.target as HTMLDivElement;
        const stickerId = el.dataset['docId'];

        props.onImageChange({
          type: ImageChangeType.layer,
          layer: {
            ...DEFAULT_STICKER_LAYER,
            id: getLayerNextId(),
            width: el.offsetWidth,
            height: el.offsetHeight,
            stickerId
          },
          action: AttachmentChangeAction.create,
          appearInRandomSpot: true
        });
      }
    });
    emoticonsDropdown.onButtonClick();
  });

  return (
    <div class="image-editor__stickers-control stickers-image-control"
      ref={(el) => setRef(el)}>
    </div>
  );
}
