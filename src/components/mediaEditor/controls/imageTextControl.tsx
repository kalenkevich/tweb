import {JSX, For, Show} from 'solid-js';
import {i18n} from '../../../lib/langPack';
import {ImageChangeType, TextAlignment, TextStyle, TextLayer, AttachmentChangeAction} from '../types';
import {QUICK_PALLETE_COLORS, QUICK_PALLETE_COLORS_NIGHT, WHITE_COLOR_HEX, BLACK_COLOR_HEX, DEFAULT_TEXT_LAYER, MAX_FONT_SIZE} from '../consts';
import {ImageControlProps} from './imageControl';
import {Color, ColorFormatType, anyColorToHexColor} from '../../../helpers/color';
import {ColorPickerV2, ColorPickerV2Mobile} from '../../colorPickerV2';
import {RangeSelectorTsx} from '../../rangeSelectorTsx';
import {SvgIconType} from '../../iconSvg';
import RowTsx from '../../rowTsx';
import {ButtonIconTsx} from '../../buttonIconTsx';
import {IconButtonToggler, IconConfig} from '../common/iconButtonToggler';
import {Select} from '../common/select';
import {MobileRangeSelector} from '../common/mobileRangeSelector';
import themeController from '../../../helpers/themeController';

const TEXT_ALIGNMENT_CONTROL_CONFIG: IconConfig[] = [{
  icon: 'text_alignment_left' as SvgIconType,
  asSvgIcon: true,
  square: true,
  value: TextAlignment.left
}, {
  icon: 'text_alignment_center' as SvgIconType,
  asSvgIcon: true,
  square: true,
  value: TextAlignment.center
}, {
  icon: 'text_alignment_right' as SvgIconType,
  asSvgIcon: true,
  square: true,
  value: TextAlignment.right
}];

const TEXT_STYLE_CONTROL_CONFIG: IconConfig[] = [{
  icon: 'text_style_fill' as SvgIconType,
  asSvgIcon: true,
  square: true,
  value: TextStyle.default
}, {
  icon: 'text_style_stroke' as SvgIconType,
  asSvgIcon: true,
  square: true,
  value: TextStyle.stroke
}, {
  icon: 'text_style_fillinverse' as SvgIconType,
  asSvgIcon: true,
  square: true,
  value: TextStyle.fill_background
}];

const FONT_NAMES_CONFIGS = [{
  label: 'Roboto',
  value: 'Roboto'
}, {
  label: 'Typewriter',
  value: 'Typewriter'
}, {
  label: 'Avenir Next',
  value: 'Avenir Next'
}, {
  label: 'Courier New',
  value: 'Courier New'
}, {
  label: 'Noteworthy',
  value: 'Noteworthy'
}, {
  label: 'Georgia',
  value: 'Georgia'
}, {
  label: 'Papyrus',
  value: 'Papyrus'
}, {
  label: 'Snell Roundhand',
  value: 'Snell Roundhand'
}];

enum TextAttachmentProperty {
  color = 'color',
  alignment = 'alignment',
  style = 'style',
  fontName = 'fontName',
  fontSize = 'fontSize',
}

export interface ImageTextControlProps extends ImageControlProps {}
export function ImageTextControl(props: ImageTextControlProps): JSX.Element {
  const layer = () => props.imageState.layers[props.currentLayerIndex] as TextLayer;
  const color = () => layer()?.color;
  const alignment = () => layer()?.alignment;
  const style = () => layer()?.style;
  const fontName = () => layer()?.fontName;
  const fontSize = () => layer()?.fontSize;
  const hexColor = () => color() && anyColorToHexColor(color());
  const quickPallete = () => themeController.isNight() ? QUICK_PALLETE_COLORS_NIGHT : QUICK_PALLETE_COLORS;

  const onPropertyChange = (propertyType: TextAttachmentProperty, value: string | TextAlignment | TextStyle | number | Color) => {
    const newAttachmentState = {
      ...(layer())
    } as TextLayer;

    switch(propertyType) {
      case TextAttachmentProperty.color: {
        newAttachmentState.color = value as Color;
        if(newAttachmentState.style === TextStyle.fill_background) {
          if((value as Color).value === WHITE_COLOR_HEX.value) {
            newAttachmentState.secondColor = BLACK_COLOR_HEX;
          } else {
            newAttachmentState.secondColor = WHITE_COLOR_HEX;
          }
        }

        props.onImageChange({
          type: ImageChangeType.layer,
          layerId: newAttachmentState.id,
          layer: newAttachmentState,
          action: AttachmentChangeAction.update
        });
        break;
      }
      case TextAttachmentProperty.alignment: {
        newAttachmentState.alignment = value as TextAlignment;

        props.onImageChange({
          type: ImageChangeType.layer,
          layerId: newAttachmentState.id,
          layer: newAttachmentState,
          action: AttachmentChangeAction.update
        });
        break;
      }
      case TextAttachmentProperty.style: {
        newAttachmentState.style = value as TextStyle;

        if((value as TextStyle) === TextStyle.fill_background) {
          if(newAttachmentState.color.value === WHITE_COLOR_HEX.value) {
            newAttachmentState.secondColor = BLACK_COLOR_HEX;
          } else {
            newAttachmentState.secondColor = WHITE_COLOR_HEX;
          }
        }

        props.onImageChange({
          type: ImageChangeType.layer,
          layerId: newAttachmentState.id,
          layer: newAttachmentState,
          action: AttachmentChangeAction.update
        });
        break;
      }
      case TextAttachmentProperty.fontName: {
        newAttachmentState.fontName = value as string;

        props.onImageChange({
          type: ImageChangeType.layer,
          layerId: newAttachmentState.id,
          layer: newAttachmentState,
          action: AttachmentChangeAction.update
        });
        break;
      }
      case TextAttachmentProperty.fontSize: {
        const val = value as number;

        props.onImageChange({
          type: ImageChangeType.textLayerFontSize,
          layerId: newAttachmentState.id,
          fontSize: val
        });
        break;
      }
    }
  };

  return (
    <>
      <Show when={!props.isMobile}>
        <div class="image-editor__image-control text-image-control">
          <div class="color-picker-container">
            <ColorPickerV2
              color={color()}
              quickPallete={quickPallete()}
              outputColorFormat={ColorFormatType.hexa}
              onChange={(selectedColor) => onPropertyChange(TextAttachmentProperty.color, selectedColor)}
            />
          </div>
          <div class="alignment-and-style-control">
            <div class="alignment-and-style-control__alignment-icons">
              <For each={TEXT_ALIGNMENT_CONTROL_CONFIG}>
                {(config) => (
                  <ButtonIconTsx
                    class="text-property-icon-container"
                    classList={{'selected': alignment() === config.value}}
                    square={true}
                    icon={config.icon}
                    asSvgIcon={config.asSvgIcon}
                    onClick={() => onPropertyChange(TextAttachmentProperty.alignment, config.value)}
                  />
                )}
              </For>
            </div>
            <div class="alignment-and-style-control__style-icons">
              <For each={TEXT_STYLE_CONTROL_CONFIG}>
                {(config) => (
                  <ButtonIconTsx
                    class="text-property-icon-container"
                    classList={{'selected': style() === config.value}}
                    square={true}
                    icon={config.icon}
                    asSvgIcon={config.asSvgIcon}
                    onClick={() => onPropertyChange(TextAttachmentProperty.style, config.value)}
                  />
                )}
              </For>
            </div>
          </div>
          <div class="font-size-control">
            <div class="font-size-control__label">
              <div class="font-size-control__name">
                {i18n('ImageEditor.TextControl.Size')}
              </div>
              <div class="font-size-control__value">
                {fontSize()}
              </div>
            </div>
            <div>
              <RangeSelectorTsx
                color={hexColor()}
                step={1}
                min={0}
                max={MAX_FONT_SIZE}
                value={fontSize()}
                trumpSize={20}
                onScrub={(value: number) => onPropertyChange(TextAttachmentProperty.fontSize, value)}
              />
            </div>
          </div>
          <div class="font-name-control">
            <div class="font-name-control__label">
              {i18n('ImageEditor.TextControl.Font')}
            </div>
            <For each={FONT_NAMES_CONFIGS}>
              {(config) => (
                <div class="font-name-control__row" style={{'font-family': config.value}}>
                  <RowTsx
                    title={config.label}
                    classList={{'selected': fontName() === config.value}}
                    clickable={() => onPropertyChange(TextAttachmentProperty.fontName, config.value)}
                  />
                </div>
              )}
            </For>
          </div>
        </div>
      </Show>
      <Show when={props.isMobile}>
        <div class="image-editor__image-control text-image-control">
          <ColorPickerV2Mobile
            color={color()}
            quickPallete={quickPallete()}
            outputColorFormat={ColorFormatType.hexa}
            onChange={(selectedColor) => onPropertyChange(TextAttachmentProperty.color, selectedColor)}
          />
          <IconButtonToggler
            icons={TEXT_ALIGNMENT_CONTROL_CONFIG}
            onClick={(config) => onPropertyChange(TextAttachmentProperty.alignment, config.value)}
          />
          <IconButtonToggler
            icons={TEXT_STYLE_CONTROL_CONFIG}
            onClick={(config) => onPropertyChange(TextAttachmentProperty.style, config.value)}
          />
          <ButtonIconTsx
            icon="plus"
            onClick={() => props.onImageChange({
              type: ImageChangeType.layer,
              layerId: -1,
              layer: DEFAULT_TEXT_LAYER,
              action: AttachmentChangeAction.create
            })}
          />
          <Select
            value={fontName()}
            options={FONT_NAMES_CONFIGS}
            onClick={config => onPropertyChange(TextAttachmentProperty.fontName, config.value)}
          />
          <MobileRangeSelector
            color={hexColor()}
            step={1}
            min={0}
            max={MAX_FONT_SIZE}
            value={fontSize()}
            trumpSize={20}
            onScrub={(value: number) => onPropertyChange(TextAttachmentProperty.fontSize, value)}
          />
        </div>
      </Show>
    </>
  );
}
