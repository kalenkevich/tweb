import {createSignal, onMount, Show} from 'solid-js';
import {RangeSelectorTsx, RangeSelectorProps} from '../../rangeSelectorTsx';
import {ButtonIconTsx} from '../../buttonIconTsx';

export function MobileRangeSelector(props: RangeSelectorProps) {
  const [elRef, setElRef] = createSignal<HTMLDivElement>();
  const [isSelected, setSelectedState] = createSignal(false);

  onMount(() => {
    const width = window.innerWidth;
    elRef().style.setProperty('--range-selector-mobile-width', `${width}px`);
    elRef().style.setProperty('--range-selector-mobile-left', `${-elRef().offsetLeft}px`);
  });

  return (
    <div class="range-selector mobile" ref={el => setElRef(el)}>
      <Show when={isSelected()}>
        <div class="range-selector-container">
          <div class="range-selector-wrapper">
            <RangeSelectorTsx
              color={props.color}
              step={props.step}
              min={props.min}
              max={props.max}
              value={props.value}
              trumpSize={props.trumpSize}
              onScrub={props.onScrub}
            />
          </div>
          <ButtonIconTsx
            icon={'check'}
            onClick={() => setSelectedState(false)}
          />
        </div>
      </Show>
      <ButtonIconTsx onClick={() => setSelectedState(s => !s)}>
        {props.value}
      </ButtonIconTsx>
    </div>
  );
}
