import {For, createSignal, JSX} from 'solid-js';
import {i18n} from '../../lib/langPack';
import {ImageControlProps} from './controls/imageControl';
import {ImageFilterControl} from './controls/imageFilterControl';
import {ImageResizeControl} from './controls/imageResizeControl';
import {ImageTextControl} from './controls/imageTextControl';
import {ImageDrawControl} from './controls/imageDrawControl';
import {ImageStickerControl} from './controls/imageStickerControl';
import {ButtonIconTsx} from '../buttonIconTsx';

export enum TabType {
  ENHANCE,
  RESIZE,
  TEXT,
  DRAW,
  STICKER
}

export interface ImageEditorTab {
  tabId: TabType;
  name: string | HTMLElement;
  icon: string;
  asSvgIcon: boolean;
  component: (props: ImageControlProps) => JSX.Element,
};

export const TABS_CONFIG: ImageEditorTab[] = [{
  tabId: TabType.ENHANCE,
  name: i18n('ImageEditor.Enhance'),
  icon: 'enhance_media',
  asSvgIcon: true,
  component: (props: ImageControlProps) => (
    <ImageFilterControl
      imageState={props.imageState}
      onImageChange={props.onImageChange}
      currentLayerIndex={props.currentLayerIndex}
    />
  )
}, {
  tabId: TabType.RESIZE,
  name: i18n('ImageEditor.Edit'),
  icon: 'crop',
  asSvgIcon: true,
  component: (props: ImageControlProps) => (
    <ImageResizeControl
      imageState={props.imageState}
      onImageChange={props.onImageChange}
      currentLayerIndex={props.currentLayerIndex}
    />
  )
}, {
  tabId: TabType.TEXT,
  name: i18n('ImageEditor.Text'),
  icon: 'text',
  asSvgIcon: true,
  component: (props: ImageControlProps) => (
    <ImageTextControl
      imageState={props.imageState}
      onImageChange={props.onImageChange}
      currentLayerIndex={props.currentLayerIndex}
    />
  )
}, {
  tabId: TabType.DRAW,
  name: i18n('ImageEditor.Paint'),
  icon: 'brush',
  asSvgIcon: true,
  component: (props: ImageControlProps) => (
    <ImageDrawControl
      imageState={props.imageState}
      onImageChange={props.onImageChange}
      currentLayerIndex={props.currentLayerIndex}
    />
  )
}, {
  tabId: TabType.STICKER,
  name: i18n('ImageEditor.Stickers'),
  icon: 'smile',
  asSvgIcon: true,
  component: (props: ImageControlProps) => (
    <ImageStickerControl
      imageState={props.imageState}
      onImageChange={props.onImageChange}
      currentLayerIndex={props.currentLayerIndex}
    />
  )
}];

export interface ImageEditorTabsProps extends ImageControlProps {
  selectedTabId: TabType;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClose: () => void;
  onTabSelected: (tabId: TabType) => void;
}

export function ImageEditorTabs(props: ImageEditorTabsProps) {
  const selectedTabId = () => props.selectedTabId;
  const selectedTab = () => TABS_CONFIG.find(t => t.tabId === props.selectedTabId);

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
            <div class="tab-icon__container" classList={{'tab-icon__selected': tabConfig.tabId === selectedTabId()}}>
              <ButtonIconTsx
                icon={tabConfig.icon}
                asSvgIcon={tabConfig.asSvgIcon}
                onClick={() => {
                  props.onTabSelected(tabConfig.tabId);
                }}
              />
              <div class="tab-icon__highlight"></div>
            </div>
          )}
        </For>
      </div>
      <div class="tab-body">
        {selectedTab().component(props)}
      </div>
    </div>
  );
}
