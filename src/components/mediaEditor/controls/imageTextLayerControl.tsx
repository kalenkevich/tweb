import {createSignal, onCleanup, onMount, createEffect, on, For, Show, batch} from 'solid-js';
import {ImageChangeType, TextLayer, AttachmentChangeAction, TextStyle, ImageLayer, ImageLayerType, ImageChangeEvent} from '../types';
import {ImageControlProps} from './imageControl';
import {anyColorToHexColor} from '../../../helpers/color';
import {Draggable} from '../draggable/draggable';
import {DraggingSurface} from '../draggable/surface';
import {measureText as measureCanvasText, resizeCanvas, getCanvas2DFontStyle} from '../helpers/canvas2dHelper';
import {measureText as mesureInputText} from '../helpers/textHelper';

const PLACEHOLDER = 'Add text';
const PLACEHOLDER_COLOR_HEX = '#8e8e8e';

export const renderTextLayerOnCanvas = (canvas: HTMLCanvasElement, text: string, layer: TextLayer, placeholder: string = PLACEHOLDER) => {
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  const fontStyle = getCanvas2DFontStyle(layer);
  const {width, height} = measureCanvasText(text || placeholder, layer.fontName, layer.fontSize, layer.fontWeight);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if(layer.style === TextStyle.stroke) {
    ctx.beginPath();
    ctx.font = fontStyle;
    ctx.lineWidth = layer.strokeWidth;
    if(text) {
      ctx.strokeStyle = anyColorToHexColor(layer.color);
      ctx.strokeText(text, 0, height - layer.strokeWidth);
      ctx.fillStyle = anyColorToHexColor(layer.inverseColor);
      ctx.fillText(text, 0, height - layer.strokeWidth);
    } else {
      ctx.strokeStyle = PLACEHOLDER_COLOR_HEX;
      ctx.strokeText(placeholder, 0, height - layer.strokeWidth);
      ctx.fillStyle = anyColorToHexColor(layer.inverseColor);
      ctx.fillText(text, 0, height - layer.strokeWidth);
    }
    ctx.stroke();
    ctx.fill();
  } else if(layer.style === TextStyle.fill) {
    ctx.beginPath();
    ctx.font = fontStyle;
    if(text) {
      ctx.fillStyle = anyColorToHexColor(layer.color);
      ctx.fillText(text, 0, height);
    } else {
      ctx.fillStyle = PLACEHOLDER_COLOR_HEX;
      ctx.fillText(placeholder, 0, height);
    }
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
    if(text) {
      ctx.fillStyle = anyColorToHexColor(layer.inverseColor);
      ctx.fillText(text, layer.padding, height - layer.padding);
    } else {
      ctx.fillStyle = PLACEHOLDER_COLOR_HEX;
      ctx.fillText(placeholder, layer.padding, height - layer.padding);
    }
  }
}

const getTextLayerInputElementStyles = (text: string, layer: TextLayer, placeholder = PLACEHOLDER) => {
  // const {width, height} = mesureInputText(text || placeholder, layer.fontName, layer.fontSize, layer.fontWeight, layer.style === TextStyle.stroke ? layer.strokeWidth : 0);
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
      '-webkit-text-stroke': `${layer.strokeWidth}px ${anyColorToHexColor(layer.color)}`,
      'color': anyColorToHexColor(layer.inverseColor)
    }
  }

  return {
    ...baseStyle,
    'color': anyColorToHexColor(layer.inverseColor),
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
  const [canvasEl, setCanvasEl] = createSignal<HTMLCanvasElement>();
  const [width, setWidth] = createSignal(props.layer.width);
  const [height, setHeight] = createSignal(props.layer.height);
  const [textValue, setTextValue] = createSignal(props.layer.text);
  const layer = () => props.layer;
  const inputStyles = () => getTextLayerInputElementStyles(textValue(), layer());

  onMount(() => {
    updateCanvasOnPropsChange();
  });
  createEffect(on(() => [
    props.layer.text,
    props.layer.fontName,
    props.layer.fontSize,
    props.layer.alignment,
    props.layer.padding,
    props.layer.borderRadius
  ], () => {
    updateCanvasOnPropsChange();
  }));

  createEffect(on(() => props.layer.text, (newVal) => {
    setTextValue(newVal);
  }));

  const updateCanvasOnPropsChange = () => {
    const canvas = canvasEl();
    const {width, height} = measureCanvasText(
      textValue() || PLACEHOLDER,
      layer().fontName,
      layer().fontSize,
      layer().fontWeight
    );

    resizeCanvas(canvas, width + layer().padding * 2, height + layer().padding * 2);
    renderTextLayerOnCanvas(canvas, textValue(), layer(), PLACEHOLDER);

    batch(() => {
      setWidth(width);
      setHeight(width);
    });
  }

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

  const handleInputClick = (e: Event) => {
    e.stopImmediatePropagation();
  };

  const handleInputChange = (e: Event) => {
    const value = (e.target as HTMLInputElement).value;

    setTextValue(value);
    updateCanvasOnPropsChange();
  };

  return (
    <Draggable
      surface={props.surface}
      translation={layer().translation}
      scale={layer().scale}
      origin={layer().origin}
      rotation={layer().rotation}
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
      <div style={{
        'display': 'flex',
        'flex-direction': 'column'
      }}>
        <canvas ref={el => setCanvasEl(el)}>
        </canvas>
        <div style={{'height': '10px'}}></div>
        <input
          tabindex="1"
          onMouseDown={handleInputClick}
          onMouseUp={handleInputClick}
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
