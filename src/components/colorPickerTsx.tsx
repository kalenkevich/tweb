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

  // createEffect(on(() => props.color, (value) => {
  //   colorPicker().setColor(value);
  // }));

  return <>{colorPicker().container}</>;
}
