import {JSX, For, createSignal, createEffect, on} from 'solid-js';
import {Dynamic} from 'solid-js/web';
import {i18n} from '../../../lib/langPack';
import {ImageState, ImageChangeType, TextAlignment, TextStyle} from '../types';
import {DEFAULT_TEXT_ATTACHMENT} from '../consts';
import {ImageControlProps} from './imageControl';
import {ColorPickerTsx} from '../../colorPickerTsx';
import {RangeSelectorTsx} from '../../rangeSelectorTsx';
import {IconTsx} from '../../iconTsx';
import {SvgIconType} from '../../iconSvg';
import RowTsx from '../../rowTsx';
import {Ripple} from '../../rippleTsx';
import {ButtonIconTsx} from '../../buttonIconTsx';

export interface ImageTextControlProps extends ImageControlProps {}

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

export function ImageTextControl(props: ImageTextControlProps): JSX.Element {
  const [color, setColor] = createSignal<string>(DEFAULT_TEXT_ATTACHMENT.colorHsla);
  const [alignment, setAlignment] = createSignal<TextAlignment>(DEFAULT_TEXT_ATTACHMENT.alignment);
  const [style, setStyle] = createSignal<TextStyle>(DEFAULT_TEXT_ATTACHMENT.style);
  const [fontName, setFontName] = createSignal<string>(DEFAULT_TEXT_ATTACHMENT.fontName);
  const [fontSize, setFontSize] = createSignal<number>(DEFAULT_TEXT_ATTACHMENT.fontSize);

  createEffect(on(() => [props.imageState, props.currentAttachmentIndex], (value) => {
    const [imageState, textAttachmentIndex] = value as [ImageState, number];
    const textAttachment = imageState.attachments[textAttachmentIndex];
    if(!textAttachment) {
      return;
    }

    setColor(textAttachment.colorHsla);
    setAlignment(textAttachment.alignment);
    setStyle(textAttachment.style);
    setFontName(textAttachment.fontName);
  }));

  const onPropertyChange = (propertyType: TextAttachmentProperty, value: string | TextAlignment | TextStyle | number) => {
    const newAttachmentState = {
      ...props.imageState.attachments[props.currentAttachmentIndex]
    };

    switch(propertyType) {
      case TextAttachmentProperty.color: {
        setColor(value as string);
        newAttachmentState.colorHsla = value as string;
        break;
      }
      case TextAttachmentProperty.alignment: {
        setAlignment(value as TextAlignment);
        newAttachmentState.alignment = value as TextAlignment;
        break;
      }
      case TextAttachmentProperty.style: {
        setStyle(value as TextStyle);
        newAttachmentState.style = value as TextStyle;
        break;
      }
      case TextAttachmentProperty.fontName: {
        setFontName(value as string);
        newAttachmentState.fontName = value as string;
        break;
      }
      case TextAttachmentProperty.fontSize: {
        setFontSize(value as number);
        newAttachmentState.fontSize = value as number;
        break;
      }
    }

    props.onImageChange({
      type: ImageChangeType.text,
      attachment: newAttachmentState,
      attachmentIndex: props.currentAttachmentIndex
    });
  };

  return (
    <div class="image-editor__image-control text-image-control">
      {/* <div class="color-picker-container">
        <ColorPickerTsx
          color={color()}
          onChange={(updateColor) => onPropertyChange(TextAttachmentProperty.color, updateColor.hsla)}
        />
      </div> */}
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
        <div style={{'color': color()}}>
          <RangeSelectorTsx
            step={1}
            min={0}
            max={64}
            value={fontSize()}
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
