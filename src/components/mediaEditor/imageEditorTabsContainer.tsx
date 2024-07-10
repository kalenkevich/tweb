import {For, createSignal} from 'solid-js';
import {i18n} from '../../lib/langPack';
import {ImageControlProps} from './controls/imageControl';
import {ImageFilterControl} from './controls/imageFilterControl';
import {ImageResizeControl} from './controls/imageResizeControl';
import {ImageTextControl} from './controls/imageTextControl';
import {ImageDrawControl} from './controls/imageDrawControl';
import {ImageStickerControl} from './controls/imageStickerControl';
import {ButtonIconTsx} from '../buttonIconTsx';

export const TABS_CONFIG = [{
  name: i18n('ImageEditor.Enhance'),
  icon: 'enhance_media',
  asSvgIcon: true,
  component: (props: ImageControlProps) => (
    <ImageFilterControl
      imageState={props.imageState}
      onImageChange={props.onImageChange}
      currentAttachmentIndex={props.currentAttachmentIndex}
    />
  )
}, {
  name: i18n('ImageEditor.Edit'),
  icon: 'crop',
  asSvgIcon: true,
  component: (props: ImageControlProps) => (
    <ImageResizeControl
      imageState={props.imageState}
      onImageChange={props.onImageChange}
      currentAttachmentIndex={props.currentAttachmentIndex}
    />
  )
}, {
  name: i18n('ImageEditor.Text'),
  icon: 'text',
  asSvgIcon: true,
  component: (props: ImageControlProps) => (
    <ImageTextControl
      imageState={props.imageState}
      onImageChange={props.onImageChange}
      currentAttachmentIndex={props.currentAttachmentIndex}
    />
  )
}, {
  name: i18n('ImageEditor.Paint'),
  icon: 'brush',
  asSvgIcon: true,
  component: (props: ImageControlProps) => (
    <ImageDrawControl
      imageState={props.imageState}
      onImageChange={props.onImageChange}
      currentAttachmentIndex={props.currentAttachmentIndex}
    />
  )
}, {
  name: i18n('ImageEditor.Stickers'),
  icon: 'smile',
  asSvgIcon: true,
  component: (props: ImageControlProps) => (
    <ImageStickerControl
      imageState={props.imageState}
      onImageChange={props.onImageChange}
      currentAttachmentIndex={props.currentAttachmentIndex}
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
            asSvgIcon={true}
            onClick={() => props.onUndo()}
          />
          <ButtonIconTsx
            icon="redo"
            disabled={!props.canRedo}
            asSvgIcon={true}
            onClick={() => props.onRedo()}
          />
        </div>
      </div>
      <div class="tab-icons">
        <For each={TABS_CONFIG}>
          {(tabConfig) => (
            <div class="tab-icon__container" classList={{'tab-icon__selected': tabConfig === selectedTab()}}>
              <ButtonIconTsx
                icon={tabConfig.icon}
                asSvgIcon={tabConfig.asSvgIcon}
                onClick={() => setSelectedTab(tabConfig)}
              />
              <div class="tab-icon__highlight"></div>
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
