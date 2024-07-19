import {For, JSX} from 'solid-js';

export interface SelectOption {
  label: string | JSX.Element;
  value: any;
}

export interface SelectProps {
  options: SelectOption[];
  value: any;
  onClick: (option: SelectOption) => void;
}

export function Select(props: SelectProps) {
  return (
    <select class="custom-select" value={props.value} onChange={(e) => {
      const option = props.options.find(op => `${op.value}` === e.target.value);

      props.onClick(option);
    }}>
      <For each={props.options}>
        {(option) => (
          <option class="custom-select-option" value={option.value}>
            {option.label}
          </option>
        )}
      </For>
    </select>
  );
}
