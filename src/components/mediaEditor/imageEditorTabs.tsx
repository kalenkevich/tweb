import {For, Show, JSX} from 'solid-js';
import {ButtonIconTsx} from '../buttonIconTsx';
import {i18n} from '../../lib/langPack';
import {ImageControlProps} from './controls/imageControl';
import {ImageFilterControl} from './controls/imageFilterControl';
import {ImageResizeControl} from './controls/imageResizeControl';
import {ImageTextControl} from './controls/imageTextControl';
import {ImageDrawControl} from './controls/imageDrawControl';
import {ImageStickerControl} from './controls/imageStickerControl';

export enum TabType {
  ENHANCE = 'enhance',
  RESIZE = 'resize',
  TEXT = 'text',
  DRAW = 'draw',
  STICKER = 'sticker'
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
      isMobile={props.isMobile}
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
      isMobile={props.isMobile}
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
      isMobile={props.isMobile}
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
      isMobile={props.isMobile}
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
      isMobile={props.isMobile}
      imageState={props.imageState}
      onImageChange={props.onImageChange}
      currentLayerIndex={props.currentLayerIndex}
    />
  )
}];

export interface ImageEditorTabsProps extends ImageControlProps {
  isMobile: boolean;
  selectedTabId: TabType | undefined;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClose: () => void;
  onTabSelected: (tabId: TabType) => void;
}

export function ImageEditorTabs(props: ImageEditorTabsProps) {
  const selectedTabId = () => props.selectedTabId;
  const isTabSelected = () => !!props.selectedTabId;
  const isTabNotSelected = () => !props.selectedTabId;
  const selectedTab = () => TABS_CONFIG.find(t => t.tabId === props.selectedTabId);

  return (
    <>
      <Show when={!props.isMobile}>
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
      </Show>
      <Show when={props.isMobile}>
        <div class="image-editor__tabs-container">
          <Show when={isTabSelected()}>
            <div class="tab-content">
              <ButtonIconTsx
                icon="arrow_prev"
                onClick={() => props.onTabSelected(undefined)}
              />
              {selectedTab()?.component(props)}
            </div>
          </Show>
          <Show when={isTabNotSelected()}>
            <div class="tabs-header">
              <For each={TABS_CONFIG}>
                {(config) => (
                  <ButtonIconTsx
                    icon={config.icon}
                    asSvgIcon={config.asSvgIcon}
                    onClick={() => props.onTabSelected(config.tabId)}
                  />
                )}
              </For>
            </div>
          </Show>
        </div>
      </Show>
    </>
  );
}
