import {JSX, For, Show, createSignal, on, createEffect} from 'solid-js';
import {BrushStyle, ImageChangeType} from '../types';
import {Color, ColorFormatType, anyColorToHexColor} from '../../../helpers/color';
import {ImageControlProps} from './imageControl';
import {ColorPickerV2, ColorPickerV2Mobile} from '../../colorPickerV2';
import {i18n} from '../../../lib/langPack';
import {QUCIK_PALLETE_COLORS} from '../consts';
import {PEN_TOOL_SVG, ARROW_TOOL_SVG, BRUSH_TOOL_SVG, NEON_TOOL_SVG, BLUR_TOOL_SVG, ERASER_TOOL_SVG} from './paintToolsSvgImages';
import RowTsx from '../../rowTsx';
import {RangeSelectorTsx} from '../../rangeSelectorTsx';
import {Select} from '../common/select';
import {MobileRangeSelector} from '../common/mobileRangeSelector';

export interface ImageDrawControlProps extends ImageControlProps {}

const TOOL_CONTROL_CONFIGS = [{
  label: i18n('ImageEditor.DrawControl.Pen'),
  image: PEN_TOOL_SVG,
  value: BrushStyle.pen
}, {
  label: i18n('ImageEditor.DrawControl.Arrow'),
  image: ARROW_TOOL_SVG,
  value: BrushStyle.arrow
}, {
  label: i18n('ImageEditor.DrawControl.Brush'),
  image: BRUSH_TOOL_SVG,
  value: BrushStyle.brush
}, {
  label: i18n('ImageEditor.DrawControl.Neon'),
  image: NEON_TOOL_SVG,
  value: BrushStyle.neon
}, {
  label: i18n('ImageEditor.DrawControl.Blur'),
  image: BLUR_TOOL_SVG,
  value: BrushStyle.blur
}, {
  label: i18n('ImageEditor.DrawControl.Eraser'),
  image: ERASER_TOOL_SVG,
  value: BrushStyle.eraser
}];

enum DrawAttachmentProperty {
  color = 'color',
  style = 'style',
  size = 'size'
}

export function ImageDrawControl(props: ImageDrawControlProps): JSX.Element {
  const [el, setElRef] = createSignal<HTMLDivElement>();
  const layer = () => props.imageState.drawLayer;
  const color = () => layer().color;
  const size = () => layer().size;
  const style = () => layer().style;
  const hexColor = () => anyColorToHexColor(color());

  createEffect(on(() => props.imageState.drawLayer.color.value, (v) => {
    el().style.setProperty('--selected-brush-color', hexColor());
  }));

  const onPropertyChange = (propertyType: DrawAttachmentProperty, value: Color | number | BrushStyle) => {
    const newState = {
      color: layer().color,
      size: layer().size,
      style: layer().style
    };

    switch(propertyType) {
      case DrawAttachmentProperty.color: {
        newState.color = value as Color;
        break;
      }
      case DrawAttachmentProperty.size: {
        newState.size = value as number;
        break;
      }
      case DrawAttachmentProperty.style: {
        newState.style = value as BrushStyle;
        break;
      }
    }

    props.onImageChange({
      type: ImageChangeType.drawLayer,
      layer: newState
    });
  };

  return (
    <>
      <Show when={!props.isMobile}>
        <div class="image-editor__image-control draw-image-control" ref={(el) => setElRef(el)}>
          <div class="color-picker-container">
            <ColorPickerV2
              color={color()}
              quickPallete={QUCIK_PALLETE_COLORS}
              outputColorFormat={ColorFormatType.hex}
              onChange={(selectedColor) => onPropertyChange(DrawAttachmentProperty.color, selectedColor)}
            />
          </div>
          <div class="brush-size-control">
            <div class="brush-size-control__label">
              <div class="brush-size-control__name">
                {i18n('ImageEditor.TextControl.Size')}
              </div>
              <div class="brush-size-control__value">
                {size()}
              </div>
            </div>
            <div>
              <RangeSelectorTsx
                color={hexColor()}
                step={1}
                min={0}
                max={128}
                value={size()}
                trumpSize={20}
                onScrub={(value: number) => onPropertyChange(DrawAttachmentProperty.size, value)}
              />
            </div>
          </div>
          <div class="tool-control">
            <div class="tool-control__label">
              {i18n('ImageEditor.DrawControl.Tool')}
            </div>
            <For each={TOOL_CONTROL_CONFIGS}>
              {(config) => (
                <div class="tool-control__row">
                  <RowTsx
                    title={(
                      <div class="row-body">
                        <div class="row-body__image" classList={{
                          'colorisable': [BrushStyle.pen, BrushStyle.arrow, BrushStyle.brush, BrushStyle.neon].includes(config.value)
                        }}>{config.image}</div>
                        <div class="row-body__label">{config.label}</div>
                      </div>
                    )}
                    classList={{'selected': style() === config.value}}
                    clickable={() => onPropertyChange(DrawAttachmentProperty.style, config.value)}
                  />
                </div>
              )}
            </For>
          </div>
        </div>
      </Show>
      <Show when={props.isMobile}>
        <div class="image-editor__image-control draw-image-control">
          <ColorPickerV2Mobile
            color={color()}
            quickPallete={QUCIK_PALLETE_COLORS}
            outputColorFormat={ColorFormatType.hexa}
            onChange={(color) => onPropertyChange(DrawAttachmentProperty.color, color)}
          />
          <div class="tool-control__label">
            {i18n('ImageEditor.DrawControl.Tool')}
          </div>
          <Select
            value={style()}
            options={TOOL_CONTROL_CONFIGS}
            onClick={(config) => onPropertyChange(DrawAttachmentProperty.style, config.value)}
          />
          <div class="brush-size-control__label">
            <div class="brush-size-control__name">
              {i18n('ImageEditor.TextControl.Size')}
            </div>
            <MobileRangeSelector
              color={hexColor()}
              step={1}
              min={0}
              max={128}
              value={size()}
              trumpSize={20}
              onScrub={(value: number) => onPropertyChange(DrawAttachmentProperty.size, value)}
            />
          </div>
        </div>
      </Show>
    </>
  );
}
