import {createSignal, createEffect, on, onMount, Show, For} from 'solid-js';
import {i18n} from '../../../lib/langPack';
import {ImageChangeType, TextLayer, AttachmentChangeAction, ImageChangeEvent, TextStyle} from '../types';
import {Draggable} from '../draggable/draggable';
import {DraggingSurface} from '../draggable/surface';
import {getTextLayerInputElementStyles, getTextLayerTextareaElementStyles, StyledTextAreaStyles, StyledTextRow} from '../helpers/textHelper';
import {IconTsx} from '../../iconTsx';

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
  const [isActive, setActive] = createSignal(false);
  const [styles, setStyles] = createSignal<StyledTextAreaStyles>(
    getTextLayerTextareaElementStyles(props.value, props.layer, props.placeholder)
  );

  createEffect(on(() => [props.value, props.layer, props.placeholder], () => {
    setStyles(getTextLayerTextareaElementStyles(props.value, props.layer, props.placeholder));
  }));

  const onFocus = (e: Event) => {
    setActive(true);

    props.onFocus?.(e);
  };

  const onBlur = (e: Event) => {
    setActive(false);

    props.onBlur?.(e);
  };

  return (
    <div class="draggable-text__textarea-wrapper" style={styles().textareaWrapper}>
      <div class="draggable-text__textarea-background" style={styles().textareaBackground}>
        <Show when={props.layer.style === TextStyle.fill_background}>
          <For each={styles().rows}>
            {(row: StyledTextRow) => (
              <div class="extarea-background--row-wrapper" style={styles().rowWrapper}>
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
        style={styles().textarea}
        placeholder={props.placeholder}
        value={props.value}
        onFocus={onFocus}
        onBlur={onBlur}
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
  const [removeWrapperEl, setRemoveWrapperEl] = createSignal<HTMLDivElement>();
  const layer = () => props.layer;

  onMount(() => {
    if(props.isActive && !props.isMobile) {
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

  const onWrapperMouseDown = (e: Event) => {
    if(e.target === removeWrapperEl()) {
      removeObject();
    } else {
      setActiveInternalState(true);
      props.onClick();
    }
  };

  const removeObject = () => {
    props.onImageChange({
      type: ImageChangeType.layer,
      layer: layer(),
      action: AttachmentChangeAction.delete
    });
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
        onTouchStart={onWrapperMouseDown}
        onMouseDown={onWrapperMouseDown}>
        <div class="draggable-object__remove-icon-wrapper" ref={el => setRemoveWrapperEl(el)}>
          <IconTsx class="draggable-object__remove-icon" icon="close"/>
        </div>
        {/* <StyledInput
          ref={(el) => setInputRef(el)}
          placeholder={PLACEHOLDER}
          layer={layer()}
          value={textValueInternal()}
          onBlur={onInputBlur}
          onInput={handleInputChange}
        /> */}
        <StyledTextarea
          ref={(el) => setInputRef(el)}
          placeholder={PLACEHOLDER}
          layer={layer()}
          value={textValueInternal()}
          onBlur={onInputBlur}
          onInput={handleInputChange}
        />
      </div>
    </Draggable>
  );
}
