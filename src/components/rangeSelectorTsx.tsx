import {createEffect, on, onMount, splitProps} from 'solid-js'
import RangeSelector from './rangeSelector'

export type RangeSelectorProps =
  ConstructorParameters<typeof RangeSelector>[0] &
  Parameters<RangeSelector['setHandlers']>[0] &
  {value: number, class?: string, color?: string, trumpSize?: number};

export const RangeSelectorTsx = (props: RangeSelectorProps) => {
  const [events, options] = splitProps(props, [
    'onMouseDown',
    'onMouseUp',
    'onScrub',
    'value',
    'class',
    'color',
    'trumpSize'
  ]);

  const selector = new RangeSelector(options);

  createEffect(on(() => props.value, (value) => {
    selector.setProgress(value);
  }));

  createEffect(on(() => props.color, (value) => {
    if(value) {
      selector.setColor(value);
    }
  }));

  createEffect(on(() => props.trumpSize, (value) => {
    if(value) {
      selector.setTrumpSize(value);
    }
  }));

  createEffect(on(() => [options.min, options.max], ([min, max]) => {
    selector.setMinMax(min, max);
  }, {defer: true}));

  createEffect(on(() => events, (handlers) => {
    selector.setHandlers(handlers);
  }));
  createEffect(on(() => props.class, (className, prev) => {
    if(prev) selector.container.classList.remove(prev);
    if(className) selector.container.classList.add(className);
  }));
  onMount(() => selector.setListeners());

  return selector.container;
};
