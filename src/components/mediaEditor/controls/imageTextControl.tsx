import {JSX, For} from 'solid-js';
import {i18n} from '../../../lib/langPack';
import {ImageChangeType, TextAlignment, TextStyle, TextLayer, AttachmentChangeAction} from '../types';
import {QUCIK_PALLETE_COLORS, DEFAULT_TEXT_LAYER} from '../consts';
import {ImageControlProps} from './imageControl';
import {Color, ColorFormatType, anyColorToHexColor} from '../../../helpers/color';
import {ColorPickerTsx} from '../../colorPickerTsx';
import {ColorPickerV2} from '../../colorPickerV2';
import {RangeSelectorTsx} from '../../rangeSelectorTsx';
import {SvgIconType} from '../../iconSvg';
import RowTsx from '../../rowTsx';
import {ButtonIconTsx} from '../../buttonIconTsx';

const TEXT_ALIGNMENT_CONTROL_CONFIG = [{
  icon: 'text_alignment_left' as SvgIconType,
  asSvgIcon: true,
  value: TextAlignment.left
}, {
  icon: 'text_alignment_center' as SvgIconType,
  asSvgIcon: true,
  value: TextAlignment.center
}, {
  icon: 'text_alignment_right' as SvgIconType,
  asSvgIcon: true,
  value: TextAlignment.right
}];

const TEXT_STYLE_CONTROL_CONFIG = [{
  icon: 'text_style_fill' as SvgIconType,
  asSvgIcon: true,
  value: TextStyle.fill
}, {
  icon: 'text_style_stroke' as SvgIconType,
  asSvgIcon: true,
  value: TextStyle.stroke
}, {
  icon: 'text_style_fillinverse' as SvgIconType,
  asSvgIcon: true,
  value: TextStyle.fill_inverse
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
  const currentLayerIndex = () => props.currentLayerIndex;
  const layer = () => props.imageState.layers[props.currentLayerIndex] as TextLayer;
  const color = () => layer()?.color || DEFAULT_TEXT_LAYER.color;
  const alignment = () => layer()?.alignment || DEFAULT_TEXT_LAYER.alignment;
  const style = () => layer()?.style || DEFAULT_TEXT_LAYER.style;
  const fontName = () => layer()?.fontName || DEFAULT_TEXT_LAYER.fontName;
  const fontSize = () => layer()?.fontSize || DEFAULT_TEXT_LAYER.fontSize;
  const hexColor = () => anyColorToHexColor(color())

  const onPropertyChange = (propertyType: TextAttachmentProperty, value: string | TextAlignment | TextStyle | number | Color) => {
    const isNew = !layer();
    const newAttachmentState = {
      ...(layer() || DEFAULT_TEXT_LAYER)
    } as TextLayer;

    switch(propertyType) {
      case TextAttachmentProperty.color: {
        newAttachmentState.color = value as Color;
        break;
      }
      case TextAttachmentProperty.alignment: {
        newAttachmentState.alignment = value as TextAlignment;
        break;
      }
      case TextAttachmentProperty.style: {
        newAttachmentState.style = value as TextStyle;
        break;
      }
      case TextAttachmentProperty.fontName: {
        newAttachmentState.fontName = value as string;
        break;
      }
      case TextAttachmentProperty.fontSize: {
        newAttachmentState.fontSize = value as number;
        break;
      }
    }

    props.onImageChange({
      type: ImageChangeType.layer,
      layer: newAttachmentState,
      layerIndex: currentLayerIndex(),
      action: isNew ? AttachmentChangeAction.create : AttachmentChangeAction.update
    });
  };

  return (
    <div class="image-editor__image-control text-image-control">
      {/* <div class="color-picker-container">
        <ColorPickerTsx
          color={anyColorToHslaColor(color())}
          onChange={(updateColor) => onPropertyChange(TextAttachmentProperty.color, ({type: ColorFormatType.hexa, value:updateColor.hexa}))}
        />
      </div> */}
      <div class="color-picker-container">
        <ColorPickerV2
          color={color()}
          quickPallete={QUCIK_PALLETE_COLORS}
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
            max={64}
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
  );
}
