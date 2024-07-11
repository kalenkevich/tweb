import {JSX, createSignal, onMount} from 'solid-js';
import {ImageControlProps} from './imageControl';
import rootScope from '../../../lib/rootScope';
import StickersTab from '../../emoticonsDropdown/tabs/stickers';
import {EmoticonsDropdown} from '../../emoticonsDropdown';

export interface ImageStickerControlProps extends ImageControlProps {}
export function ImageStickerControl(props: ImageStickerControlProps): JSX.Element {
  const [ref, setRef] = createSignal<HTMLDivElement>();

  onMount(() => {
    const emoticonsDropdown = new EmoticonsDropdown({
      customParentElement: ref(),
      tabsToRender: [new StickersTab(rootScope.managers)],
      onMount: (el) => {
        el.style.height = `${ref().offsetHeight}px`;
        el.style.maxHeight = `${ref().offsetHeight}px`;
        el.style.setProperty('--height', `${ref().offsetHeight}px`);
      },
      onMediaClicked: (e) => {
        console.log('sticker clicked', e);
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
