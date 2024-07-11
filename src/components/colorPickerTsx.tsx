import {createEffect, on, onMount, createSignal} from 'solid-js';
import {ColorHsla} from '../helpers/color';
import ColorPicker, {ColorPickerColor} from './colorPicker';

export interface ColorPickerTsxProps {
  color: ColorHsla; // hsla color
  onChange: (color: ColorPickerColor) => void;
}

export function ColorPickerTsx(props: ColorPickerTsxProps) {
  const [colorPicker] = createSignal(new ColorPicker());

  onMount(() => {
    const colorPickerInstance = colorPicker();

    colorPickerInstance.onChange = props.onChange;
  });

  createEffect(on(() => props.color, (value, prev) => {
    if(value.a === 255) {
      value.a /= 255;
    }
    if(value?.h !== prev?.h || value?.s !== prev?.s || value?.l !== prev?.l || value?.a !== prev?.a) {
      colorPicker().setColor(value);
    }
  }));

  return <>{colorPicker().container}</>;
}
