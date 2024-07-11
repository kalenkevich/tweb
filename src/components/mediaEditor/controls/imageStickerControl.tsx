import {JSX, createSignal} from 'solid-js';
import {ImageControlProps} from './imageControl';
import rootScope from '../../../lib/rootScope';
import StickersTab from '../../emoticonsDropdown/tabs/stickers';

function StickersTabTsx() {
  const [stickers] = createSignal(
    new StickersTab(rootScope.managers)
  )

  return <>{stickers().container}</>
}

export interface ImageStickerControlProps extends ImageControlProps {}
export function ImageStickerControl(props: ImageStickerControlProps): JSX.Element {
  return (
    <div class="image-editor__stickers-control stickers-image-control">
      <div style={{'margin-top': '24px', 'height': '100%'}}>
        <StickersTabTsx/>
      </div>
    </div>
  );
}
