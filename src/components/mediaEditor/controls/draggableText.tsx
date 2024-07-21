import {createSignal, createEffect, on, onMount, Show, For} from 'solid-js';
import {i18n} from '../../../lib/langPack';
import {ImageChangeType, TextLayer, AttachmentChangeAction, ImageChangeEvent, TextStyle} from '../types';
import {Draggable} from '../draggable/draggable';
import {DraggingSurface} from '../draggable/surface';
import {getTextLayerInputElementStyles, getTextLayerTextareaElementStyles, TextBox, TextRow} from '../helpers/textHelper';

const PLACEHOLDER = i18n('ImageEditor.TextControl.AddText').innerText;

export interface StyledInputProps {
  ref: (el: HTMLInputElement | HTMLTextAreaElement) => void;
  placeholder: string;
  layer: TextLayer;
  value: string;
  onBlur?: (e: Event) => void;
  onFocus?: (e: Event) => void;
  onInput: (e: InputEvent) => void;
}
export function StyledInput(props: StyledInputProps) {
  const inputStyles = () => getTextLayerInputElementStyles(props.value, props.layer, props.placeholder);

  return (
    <input
      class="draggable-text__input"
      ref={props.ref}
      tabindex="1"
      style={inputStyles() as any}
      placeholder={props.placeholder}
      value={props.value}
      onBlur={props.onBlur}
      onInput={props.onInput}
    />
  );
}

export function StyledTextarea(props: StyledInputProps) {
  const [textbox, setTextbox] = createSignal<TextBox>(
    getTextLayerTextareaElementStyles(props.value, props.layer, props.placeholder)
  );

  createEffect(on(() => [props.value, props.layer, props.placeholder], () => {
    setTextbox(getTextLayerTextareaElementStyles(props.value, props.layer, props.placeholder));
  }));

  return (
    <div class="draggable-text__textarea-wrapper" style={textbox().styles.textareaWrapper}>
      <div class="draggable-text__textarea-background" style={textbox().styles.textareaBackground}>
        <Show when={props.layer.style === TextStyle.fill_background}>
          <For each={textbox().rows}>
            {(row: TextRow) => (
              <div class="extarea-background--row-wrapper" style={textbox().styles.rowWrapper}>
                <Show when={row.leftJoin}>
                  <div class="textarea-background--row-join" style={row.leftJoin}></div>
                </Show>
                <div class="textarea-background--row" style={row.styles}></div>
                <Show when={row.rightJoin}>
                  <div class="textarea-background--row-join" style={row.rightJoin}></div>
                </Show>
              </div>
            )}
          </For>
        </Show>
      </div>
      <textarea
        class="draggable-text__textarea"
        tabindex="0"
        contentEditable={true}
        ref={props.ref}
        style={textbox().styles.textarea}
        placeholder={props.placeholder}
        value={props.value}
        onFocus={props.onFocus}
        onBlur={props.onBlur}
        onInput={props.onInput}>
      </textarea>
    </div>
  );
}

export interface DraggableTextProps {
  isMobile: boolean;
  surface: DraggingSurface;
  layer: TextLayer;
  isActive: boolean;
  onClick: () => void;
  onImageChange: (imageChangeEvent: ImageChangeEvent) => void;
}
export function DraggableText(props: DraggableTextProps) {
  const [inputRef, setInputRef] = createSignal<HTMLInputElement | HTMLTextAreaElement>();
  const [textValueInternal, setTextValueInternal] = createSignal(props.layer.text);
  const [isActiveInternal, setActiveInternalState] = createSignal(props.isActive);
  const layer = () => props.layer;

  onMount(() => {
    if(props.isActive && !props.isMobile && document.activeElement !== inputRef()) {
      inputRef().focus();
    }
  });

  createEffect(on(() => props.isActive, (isActive) => {
    if(!isActive) {
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

  const onClick = () => {
    setActiveInternalState(true);
    props.onClick();
  };

  return (
    <Draggable
      surface={props.surface}
      active={isActiveInternal()}
      movable={true}
      resizable={true}
      rotatable={true}
      removable={true}
      translation={layer().translation}
      scale={layer().scale}
      rotation={layer().rotation}
      onClick={onClick}
      onMove={(translation: [number, number]) => {
        props.onImageChange({
          type: ImageChangeType.layer,
          layer: {
            ...layer(),
            translation
          },
          action: AttachmentChangeAction.update
        });
      }}
      onResize={(scale: [number, number], elRect: DOMRect) => {
        props.onImageChange({
          type: ImageChangeType.textLayerFontSize,
          layerId: layer().id,
          fontSize: Math.floor(layer().fontSize * scale[0])
        });
        // props.onImageChange({
        //   type: ImageChangeType.layerTranslation,
        //   layerId: layer().id,
        //   translation: [elRect.x, elRect.y]
        // });
      }}
      onRotate={(rotation: number) => {
        props.onImageChange({
          type: ImageChangeType.layer,
          layer: {
            ...layer(),
            rotation
          },
          action: AttachmentChangeAction.update
        });
      }}
      onRemove={() => {
        props.onImageChange({
          type: ImageChangeType.layer,
          layer: layer(),
          action: AttachmentChangeAction.delete
        });
      }}>
      <StyledTextarea
        ref={(el) => setInputRef(el)}
        placeholder={PLACEHOLDER}
        layer={layer()}
        value={textValueInternal()}
        onBlur={onInputBlur}
        onInput={handleInputChange}
      />
    </Draggable>
  );
}
