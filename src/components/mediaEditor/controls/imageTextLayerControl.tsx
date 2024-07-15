import {createSignal, createEffect, on, For, Show} from 'solid-js';
import {ImageChangeType, TextLayer, AttachmentChangeAction, TextStyle, ImageLayer, ImageLayerType, ImageChangeEvent} from '../types';
import {ImageControlProps} from './imageControl';
import {anyColorToHexColor} from '../../../helpers/color';
import {Draggable} from '../draggable/draggable';
import {DraggingSurface} from '../draggable/surface';
import {measureText as measureCanvasText, getCanvas2DFontStyle} from '../helpers/canvas2dHelper';

const PLACEHOLDER = 'Add text';

export const renderTextLayerOnCanvas = (canvas: HTMLCanvasElement, text: string, layer: TextLayer, placeholder = PLACEHOLDER) => {
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  const fontStyle = getCanvas2DFontStyle(layer);
  const {width, height} = measureCanvasText(text || placeholder, layer.fontName, layer.fontSize, layer.fontWeight);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if(layer.style === TextStyle.stroke) {
    ctx.beginPath();
    ctx.font = fontStyle;
    ctx.lineWidth = layer.strokeWidth;
    ctx.strokeStyle = anyColorToHexColor(layer.strokeColor);
    ctx.strokeText(text, 0, height - layer.strokeWidth);
    ctx.fillStyle = anyColorToHexColor(layer.color);
    ctx.fillText(text, 0, height - layer.strokeWidth);
    ctx.stroke();
    ctx.fill();
  } else if(layer.style === TextStyle.fill) {
    ctx.beginPath();
    ctx.font = fontStyle;
    ctx.fillStyle = anyColorToHexColor(layer.color);
    ctx.fillText(text, 0, height);
    ctx.fill();
  } else if(layer.style === TextStyle.fill_inverse) {
    ctx.beginPath();
    ctx.font = fontStyle;
    ctx.fillStyle = anyColorToHexColor(layer.color);
    ctx.roundRect(
      0,
      0,
      width + layer.padding * 2,
      height + layer.padding * 2,
      layer.borderRadius);
    ctx.fill();
    ctx.fillStyle = anyColorToHexColor(layer.secondColor);
    ctx.fillText(text, layer.padding, height - layer.padding);
  }
}

const getTextLayerInputElementStyles = (text: string, layer: TextLayer, placeholder = PLACEHOLDER) => {
  const {width, height} = measureCanvasText(text || placeholder, layer.fontName, layer.fontSize, layer.fontWeight, layer.style === TextStyle.stroke ? layer.strokeWidth : 0);

  const baseStyle = {
    'border': 'none',
    'outline': 'none',
    'width': `${width}px`,
    'height': `${height}px`,
    'font-family': layer.fontName,
    'font-size': `${layer.fontSize}px`,
    'font-weight': `${layer.fontWeight}`,
    'line-height': `${layer.fontSize}px`,
    'text-align': layer.alignment,
    'box-sizing': 'content-box'
  };

  if(layer.style === TextStyle.fill) {
    return {
      ...baseStyle,
      color: anyColorToHexColor(layer.color)
    }
  }

  if(layer.style === TextStyle.stroke) {
    return {
      ...baseStyle,
      'paint-order': 'stroke fill',
      '-webkit-text-stroke': `${layer.strokeWidth}px ${anyColorToHexColor(layer.strokeColor)}`,
      'color': anyColorToHexColor(layer.color)
    }
  }

  return {
    ...baseStyle,
    'color': anyColorToHexColor(layer.secondColor),
    'padding': `${layer.padding}px`,
    'background-color': anyColorToHexColor(layer.color),
    'border-radius': `${layer.borderRadius}px`
  };
};

export interface EditableTextElementProps {
  surface: DraggingSurface;
  layer: TextLayer;
  isActive: boolean;
  onClick: () => void;
  onImageChange: (imageChangeEvent: ImageChangeEvent) => void;
}
export function EditableTextElement(props: EditableTextElementProps) {
  const [inputRef, setInputRef] = createSignal<HTMLInputElement | undefined>();
  const [width, setWidth] = createSignal(props.layer.width);
  const [height, setHeight] = createSignal(props.layer.height);
  const [textValue, setTextValue] = createSignal(props.layer.text);
  const layer = () => props.layer;
  const isActive = () => props.isActive;
  const inputStyles = () => getTextLayerInputElementStyles(textValue(), layer());

  createEffect(on(() => props.layer.text, (newVal) => {
    setTextValue(newVal);
  }));
  createEffect(on(() => props.layer.width, (newVal) => {
    setWidth(newVal);
  }));
  createEffect(on(() => props.layer.height, (newVal) => {
    setHeight(newVal);
  }));

  const onInputBlur = (e: Event) => {
    props.onImageChange({
      type: ImageChangeType.layer,
      layer: {
        ...layer(),
        isDirty: !!textValue(),
        text: textValue()
      },
      action: AttachmentChangeAction.update
    });
  };

  const handleMouseMove = (e: Event) => {
    e.stopPropagation();
    // Returns focus on input instead of draggable surface
    setTimeout(() => {
      inputRef().focus();
    });
  };

  const blurInput = (e: MouseEvent) => {
    e.stopPropagation();
    setTimeout(() => {
      inputRef().blur();
    });
  };

  const handleInputChange = (e: Event) => {
    const value = (e.target as HTMLInputElement).value;

    setTextValue(value);
  };

  return (
    <Draggable
      surface={props.surface}
      enabled={isActive()}
      translation={layer().translation}
      scale={layer().scale}
      rotation={layer().rotation}
      onClick={props.onClick}
      onChange={(translation: [number, number]) => {
        props.onImageChange({
          type: ImageChangeType.layer,
          layer: {
            ...layer(),
            translation
          },
          action: AttachmentChangeAction.update
        });
      }}
    >
      <div class="editable-input-wrapper"
        classList={{'active': isActive()}}
        onMouseUp={blurInput}
      >
        <input
          ref={(el) => setInputRef(el)}
          tabindex="1"
          onMouseMove={handleMouseMove}
          style={inputStyles() as any}
          placeholder={PLACEHOLDER}
          value={textValue()}
          onBlur={onInputBlur}
          onInput={handleInputChange}
        />
      </div>
    </Draggable>
  );
}

export interface ImageTextLayerControlProps extends ImageControlProps {
  surface: DraggingSurface;
  onActiveLayerChange: (layer: ImageLayer) => void;
}
export function ImageTextLayerControl(props: ImageTextLayerControlProps) {
  const textObjects = () => props.imageState.layers.filter(l => l.type === ImageLayerType.text) as TextLayer[];

  return (
    <div class="image-editor__image-control text-image-input-control">
      <For each={textObjects()}>
        {(layer: TextLayer) => (
          <EditableTextElement
            surface={props.surface}
            layer={layer as TextLayer}
            isActive={layer === props.imageState.layers[props.currentLayerIndex]}
            onClick={() => props.onActiveLayerChange(layer)}
            onImageChange={props.onImageChange}
          />
        )}
      </For>
    </div>
  );
}
