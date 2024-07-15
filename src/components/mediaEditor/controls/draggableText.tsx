import {createSignal, createEffect, on} from 'solid-js';
import {i18n} from '../../../lib/langPack';
import {ImageChangeType, TextLayer, AttachmentChangeAction, ImageChangeEvent} from '../types';
import {Draggable} from '../draggable/draggable';
import {DraggingSurface} from '../draggable/surface';
import {getTextLayerInputElementStyles} from '../helpers/textHelper';

const PLACEHOLDER = i18n('ImageEditor.TextControl.AddText').innerText;

export interface DraggableTextProps {
  surface: DraggingSurface;
  layer: TextLayer;
  isActive: boolean;
  onClick: () => void;
  onImageChange: (imageChangeEvent: ImageChangeEvent) => void;
}
export function DraggableText(props: DraggableTextProps) {
  const [inputRef, setInputRef] = createSignal<HTMLInputElement | undefined>();
  const [textValueInternal, setTextValueInternal] = createSignal(props.layer.text);
  const [isActiveInternal, setActiveInternalState] = createSignal(props.isActive);
  const layer = () => props.layer;
  const inputStyles = () => getTextLayerInputElementStyles(textValueInternal(), layer(), PLACEHOLDER);

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
      <div class="draggable-object draggable-text"
        classList={{'active': isActiveInternal()}}
        onMouseDown={onWrapperMouseDown}>
        <input
          class="draggable-text__input"
          ref={(el) => setInputRef(el)}
          tabindex="1"
          style={inputStyles() as any}
          placeholder={PLACEHOLDER}
          value={textValueInternal()}
          onBlur={onInputBlur}
          onInput={handleInputChange}
        />
      </div>
    </Draggable>
  );
}
