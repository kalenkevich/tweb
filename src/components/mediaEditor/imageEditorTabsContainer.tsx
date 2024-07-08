import {For, createSignal} from 'solid-js';
import {i18n} from '../../lib/langPack';
import {ImageControlProps} from './controls/imageControl';
import {ImageFilterControl} from './controls/imageFilterControl';
import {ImageEditControl} from './controls/imageEditControl';
import {ImageTextControl} from './controls/imageTextControl';
import {ImagePaintControl} from './controls/imagePaintControl';
import {ImageStickerControl} from './controls/imageStickerControl';
import {ButtonIconTsx} from '../buttonIconTsx';

export const TABS_CONFIG = [{
  name: i18n('ImageEditor.Enhance'),
  icon: 'enhance_media',
  asImgeIcon: true,
  component: (props: ImageControlProps) => (
    <ImageFilterControl
      imageState={props.imageState}
      onImageChange={props.onImageChange}
    />
  )
}, {
  name: i18n('ImageEditor.Edit'),
  icon: 'crop',
  asImgeIcon: true,
  component: (props: ImageControlProps) => (
    <ImageEditControl
      imageState={props.imageState}
      onImageChange={props.onImageChange}
    />
  )
}, {
  name: i18n('ImageEditor.Text'),
  icon: 'text',
  asImgeIcon: true,
  component: (props: ImageControlProps) => (
    <ImageTextControl
      imageState={props.imageState}
      onImageChange={props.onImageChange}
    />
  )
}, {
  name: i18n('ImageEditor.Paint'),
  icon: 'brush',
  asImgeIcon: true,
  component: (props: ImageControlProps) => (
    <ImagePaintControl
      imageState={props.imageState}
      onImageChange={props.onImageChange}
    />
  )
}, {
  name: i18n('ImageEditor.Stickers'),
  icon: 'smile',
  asImgeIcon: true,
  component: (props: ImageControlProps) => (
    <ImageStickerControl
      imageState={props.imageState}
      onImageChange={props.onImageChange}
    />
  )
}];

export interface ImageEditorTabsContainerProps extends ImageControlProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClose: () => void;
}

export function ImageEditorTabsContainer(props: ImageEditorTabsContainerProps) {
  const [selectedTab, setSelectedTab] = createSignal(TABS_CONFIG[0]);

  return (
    <div class="image-editor__tabs-container">
      <div class="tabs-header">
        <ButtonIconTsx
          class="tabs-header__close"
          icon="close"
          onClick={() => props.onClose()}
        />
        <h3 class="tabs-header__title">
          {i18n('ImageEditor.Edit')}
        </h3>
        <div class="tabs-header__undo-redu-buttons">
          <ButtonIconTsx
            icon="undo"
            disabled={!props.canUndo}
            asImgIcon={true}
            onClick={() => props.onUndo()}
          />
          <ButtonIconTsx
            icon="redo"
            disabled={!props.canRedo}
            asImgIcon={true}
            onClick={() => props.onRedo()}
          />
        </div>
      </div>
      <div class="tab-icons">
        <For each={TABS_CONFIG}>
          {(tabConfig) => (
            <div class="tab-icon__container">
              <ButtonIconTsx
                icon={tabConfig.icon}
                asImgIcon={tabConfig.asImgeIcon}
                onClick={() => setSelectedTab(tabConfig)}
              />
              {tabConfig === selectedTab() && <div class="selected-highlight"></div>}
            </div>
          )}
        </For>
      </div>
      <div class="tab-body ">
        {selectedTab().component(props)}
      </div>
    </div>
  );
}
