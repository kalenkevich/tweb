import {For, Show, JSX, createSignal, onMount} from 'solid-js';
import {ButtonIconTsx} from '../buttonIconTsx';
import {i18n} from '../../lib/langPack';
import rootScope from '../../lib/rootScope';
import StickersTab from '../emoticonsDropdown/tabs/stickers';
import {EmoticonsDropdown, DROPDOWN_HEIGHT} from '../emoticonsDropdown';
import cloneDOMRect from '../../helpers/dom/cloneDOMRect';
import {DEFAULT_STICKER_LAYER} from './consts';
import {ImageChangeType, AttachmentChangeAction} from './types';
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
  const [elRef, setElRef] = createSignal<HTMLDivElement>();
  const [emoticonsDropdown, setEmoticonsDropdown] = createSignal<EmoticonsDropdown>();
  const selectedTabId = () => props.selectedTabId;
  const isTabSelected = () => !!props.selectedTabId;
  const isTabNotSelected = () => !props.selectedTabId;
  const selectedTab = () => TABS_CONFIG.find(t => t.tabId === props.selectedTabId);

  onMount(() => {
    setEmoticonsDropdown(new EmoticonsDropdown({
      customParentElement: elRef(),
      tabsToRender: [new StickersTab(rootScope.managers)],
      stayAlwaysOpen: false,
      fullHeight: false,
      customWidth: window.innerWidth,
      getOpenPosition: () => {
        const rect = elRef().getBoundingClientRect();
        const cloned = cloneDOMRect(rect);
        cloned.left = 0;
        cloned.top = -DROPDOWN_HEIGHT;
        return cloned;
      },
      onMediaClicked: (e) => {
        const el = e.target as HTMLDivElement;
        const stickerId = el.dataset['docId'];

        props.onImageChange({
          type: ImageChangeType.layer,
          layerId: -1,
          layer: {
            ...DEFAULT_STICKER_LAYER,
            width: el.offsetWidth,
            height: el.offsetHeight,
            stickerId
          },
          action: AttachmentChangeAction.create,
          appearInRandomSpot: true
        });

        emoticonsDropdown().onButtonClick();
      }
    }));
  });

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
        <div class="image-editor__tabs-container" ref={el => setElRef(el)}>
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
                    onClick={() => {
                      if(config.tabId === TabType.STICKER) {
                        emoticonsDropdown().onButtonClick();
                      } else {
                        props.onTabSelected(config.tabId);
                      }
                    }}
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
