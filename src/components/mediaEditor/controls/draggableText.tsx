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
  onInput: (e: InputEvent | ClipboardEvent) => void;
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
        onInput={props.onInput}
        onPaste={props.onInput}>
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
  const [draggableRef, setDraggableRef] = createSignal<HTMLDivElement>();
  const [inputRef, setInputRef] = createSignal<HTMLInputElement | HTMLTextAreaElement>();
  const [textValueInternal, setTextValueInternal] = createSignal(props.layer.text);
  const [isActiveInternal, setActiveInternalState] = createSignal(props.isActive);
  const [origin, setOrigin] = createSignal<[number, number]>([0, 0]);
  const layer = () => props.layer;

  onMount(() => {
    const el = inputRef();

    if(props.isActive && !props.isMobile && document.activeElement !== el) {
      el.focus();
    }

    updateOrigin();
  });

  createEffect(on(() => [
    props.layer.text,
    props.layer.alignment,
    props.layer.fontName,
    props.layer.fontSize,
    props.layer.fontWeight,
    props.layer.style,
    props.layer.padding,
    props.layer.strokeWidth
  ], () => {
    updateOrigin();
  }));

  const updateOrigin = () => {
    const l = layer();
    const center = [
      l.translation[0] - l.origin[0],
      l.translation[1] - l.origin[1]
    ];
    const width = draggableRef().offsetWidth;
    const height = draggableRef().offsetHeight;
    const origin = [-width / 2, -height / 2] as [number, number];
    const translation = [
      center[0] + origin[0],
      center[1] + origin[1]
    ] as [number, number];

    setOrigin(origin);
    props.onImageChange({
      type: ImageChangeType.layerOrigin,
      layerId: l.id,
      origin,
      translation
    });
  };

  createEffect(on(() => props.isActive, (isActive) => {
    setActiveInternalState(isActive);
  }));

  const handleMove = (translation: [number, number]) => {
    props.onImageChange({
      type: ImageChangeType.layer,
      layer: {
        translation
      },
      action: AttachmentChangeAction.update
    });
  };

  const handleResize = (scale: [number, number]) => {
    props.onImageChange({
      type: ImageChangeType.textLayerFontSize,
      layerId: layer().id,
      fontSize: Math.floor(layer().fontSize * scale[0])
    });
  };

  const onInputBlur = () => {
    const hasChange = textValueInternal() !== layer().text;

    if(hasChange) {
      props.onImageChange({
        type: ImageChangeType.layer,
        layer: {
          isDirty: !!textValueInternal(),
          text: textValueInternal()
        },
        action: AttachmentChangeAction.update
      });
    }
  };

  const handleInputChange = (e: InputEvent | ClipboardEvent) => {
    let value;
    if((e as ClipboardEvent).clipboardData) {
      value = (e as ClipboardEvent).clipboardData.getData('text/plain');
    } else if((e as InputEvent).target) {
      value = (e.target as HTMLTextAreaElement).value;
    }

    setTextValueInternal(value);
  };

  const onClick = () => {
    setActiveInternalState(true);
    props.onClick();
  };

  return (
    <Draggable
      ref={el => setDraggableRef(el)}
      surface={props.surface}
      active={isActiveInternal()}
      movable={true}
      resizable={true}
      rotatable={true}
      removable={true}
      translation={layer().translation}
      scale={layer().scale}
      rotation={layer().rotation}
      origin={origin()}
      onClick={onClick}
      onMove={handleMove}
      onResize={handleResize}
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
