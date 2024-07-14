import {JSX, For} from 'solid-js';
import {DrawLayer, DrawStyle, ImageChangeType, AttachmentChangeAction} from '../types';
import {Color, ColorFormatType, anyColorToHexColor} from '../../../helpers/color';
import {ImageControlProps} from './imageControl';
import {ColorPickerV2} from '../../colorPickerV2';
import {i18n} from '../../../lib/langPack';
import {DEFAULT_DRAW_LAYER, QUCIK_PALLETE_COLORS} from '../consts';
import {PEN_TOOL_SVG, ARROW_TOOL_SVG, BRUSH_TOOL_SVG, NEON_TOOL_SVG, ERASER_TOOL_SVG} from './paintToolsSvgImages';
import RowTsx from '../../rowTsx';
import {RangeSelectorTsx} from '../../rangeSelectorTsx';

export interface ImageDrawControlProps extends ImageControlProps {}

const TOOL_CONTROL_CONFIGS = [{
  label: i18n('ImageEditor.DrawControl.Pen'),
  image: PEN_TOOL_SVG,
  value: DrawStyle.pen
}, {
  label: i18n('ImageEditor.DrawControl.Arrow'),
  image: ARROW_TOOL_SVG,
  value: DrawStyle.arrow
}, {
  label: i18n('ImageEditor.DrawControl.Brush'),
  image: BRUSH_TOOL_SVG,
  value: DrawStyle.brush
}, {
  label: i18n('ImageEditor.DrawControl.Neon'),
  image: NEON_TOOL_SVG,
  value: DrawStyle.neon
}, {
  label: i18n('ImageEditor.DrawControl.Blur'),
  image: PEN_TOOL_SVG,
  value: DrawStyle.blur,
  skip: true
}, {
  label: i18n('ImageEditor.DrawControl.Eraser'),
  image: ERASER_TOOL_SVG,
  value: DrawStyle.eraser
}];

enum DrawAttachmentProperty {
  color = 'color',
  style = 'style',
  size = 'size'
}

export function ImageDrawControl(props: ImageDrawControlProps): JSX.Element {
  const layer = () => props.imageState.layers[props.currentLayerIndex] as DrawLayer;
  const color = () => layer()?.color || DEFAULT_DRAW_LAYER.color;
  const size = () => layer()?.size || DEFAULT_DRAW_LAYER.size;
  const style = () => layer()?.style || DEFAULT_DRAW_LAYER.style;
  const hexColor = () => anyColorToHexColor(color())

  const onPropertyChange = (propertyType: DrawAttachmentProperty, value: Color | number | DrawStyle) => {
    const isNew = !layer();
    const newAttachmentState = {
      ...(layer() || DEFAULT_DRAW_LAYER)
    } as DrawLayer;

    switch(propertyType) {
      case DrawAttachmentProperty.color: {
        newAttachmentState.color = value as Color;
        break;
      }
      case DrawAttachmentProperty.size: {
        newAttachmentState.size = value as number;
        break;
      }
      case DrawAttachmentProperty.style: {
        newAttachmentState.style = value as DrawStyle;
        break;
      }
    }

    props.onImageChange({
      type: ImageChangeType.layer,
      layer: newAttachmentState,
      action: isNew ? AttachmentChangeAction.create : AttachmentChangeAction.update
    });
  };

  return (
    <div class="image-editor__image-control draw-image-control">
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
            max={64}
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
        <For each={TOOL_CONTROL_CONFIGS.filter(c => !c.skip)}>
          {(config) => (
            <div class="tool-control__row">
              <RowTsx
                title={(
                  <div class="row-body">
                    <div class="row-body__image">{config.image}</div>
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
  );
}
