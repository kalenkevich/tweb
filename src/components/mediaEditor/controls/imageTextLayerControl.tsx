import {createSignal, createEffect, on, For} from 'solid-js';
import {i18n} from '../../../lib/langPack';
import {ImageChangeType, TextLayer, AttachmentChangeAction, ImageLayer, ImageLayerType, ImageChangeEvent} from '../types';
import {ImageControlProps} from './imageControl';
import {Draggable} from '../draggable/draggable';
import {DraggingSurface} from '../draggable/surface';
import {getTextLayerInputElementStyles} from '../helpers/textHelper';

const PLACEHOLDER = i18n('ImageEditor.TextControl.AddText');

export interface EditableTextElementProps {
  surface: DraggingSurface;
  layer: TextLayer;
  isActive: boolean;
  onClick: () => void;
  onImageChange: (imageChangeEvent: ImageChangeEvent) => void;
}
export function EditableTextElement(props: EditableTextElementProps) {
  const [inputRef, setInputRef] = createSignal<HTMLInputElement | undefined>();
  const [textValueInternal, setTextValueInternal] = createSignal(props.layer.text);
  const [isActiveInternal, setActiveInternalState] = createSignal(props.isActive);
  const layer = () => props.layer;
  const inputStyles = () => getTextLayerInputElementStyles(textValueInternal(), layer());

  createEffect(on(() => props.isActive, (isActive) => {
    if(isActive) {
      if(document.activeElement !== inputRef()) {
        inputRef().focus();
      }
    } else {
      inputRef().blur();
    }

    setActiveInternalState(isActive);
  }));

  const onInputBlur = () => {
    const hasChange = textValueInternal() !== layer().text;

    if(hasChange) {
      props.onImageChange({
        type: ImageChangeType.layer,
        layer: {
          ...layer(),
          isDirty: !!textValueInternal(),
          text: textValueInternal()
        },
        action: AttachmentChangeAction.update
      });
    }
  };

  const handleInputChange = (e: Event) => {
    const value = (e.target as HTMLInputElement).value;

    setTextValueInternal(value);
  };

  const onWrapperMouseDown = () => {
    setActiveInternalState(true);
    props.onClick();
  };

  return (
    <Draggable
      surface={props.surface}
      enabled={isActiveInternal()}
      translation={layer().translation}
      scale={layer().scale}
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
      <div class="editable-input-wrapper"
        classList={{'active': isActiveInternal()}}
        onMouseDown={onWrapperMouseDown}>
        <input
          ref={(el) => setInputRef(el)}
          tabindex="1"
          style={inputStyles() as any}
          placeholder={PLACEHOLDER.innerText}
          value={textValueInternal()}
          onBlur={onInputBlur}
          onInput={handleInputChange}
        />
      </div>
    </Draggable>
  );
}

export interface ImageTextLayerControlProps extends ImageControlProps {
  surface: DraggingSurface;
  onActiveLayerChange: (layer?: ImageLayer) => void;
}
export function ImageTextLayerControl(props: ImageTextLayerControlProps) {
  const [elRef, setElRef] = createSignal<HTMLDivElement>();
  const textObjects = () => props.imageState.layers.filter(l => l.type === ImageLayerType.text) as TextLayer[];

  const handleBackdropClick = (e: Event) => {
    if((e.target as HTMLDivElement) === elRef()) {
      props.onActiveLayerChange(null);
    }
  };

  return (
    <div class="image-editor__image-control text-image-input-control"
      ref={(el) => setElRef(el)}
      onClick={handleBackdropClick}>
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
