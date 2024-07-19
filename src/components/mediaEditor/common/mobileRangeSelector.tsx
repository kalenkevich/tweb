import {createSignal, onMount, Show, JSX, children, onCleanup} from 'solid-js';
import {RangeSelectorTsx, RangeSelectorProps} from '../../rangeSelectorTsx';
import {ButtonIconTsx} from '../../buttonIconTsx';

export interface MobileRangeSelector extends RangeSelectorProps {
  defaultOpen?: boolean;
  children?: JSX.Element;
}
export function MobileRangeSelector(props: MobileRangeSelector) {
  const [elRef, setElRef] = createSignal<HTMLDivElement>();
  const [isSelected, setSelectedState] = createSignal(props.defaultOpen);
  const c = children(() => props.children);

  onMount(() => {
    window.addEventListener('resize', handleResize);
    handleResize();
  });

  onCleanup(() => {
    window.removeEventListener('resize', handleResize);
  });

  const handleResize = () => {
    const width = window.innerWidth;
    elRef().style.setProperty('--range-selector-mobile-width', `${width}px`);
    elRef().style.setProperty('--range-selector-mobile-left', `${-elRef().offsetLeft}px`);
  };

  return (
    <div class="range-selector mobile" ref={el => setElRef(el)}>
      <Show when={isSelected()}>
        <div class="range-selector-container">
          <div class="range-selector--value">
            {props.value}
          </div>
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
      <Show when={c()}>
        <div onClick={() => setSelectedState(true)}>
          {c()}
        </div>
      </Show>
      <Show when={!c()}>
        <ButtonIconTsx onClick={() => setSelectedState(s => !s)}>
          {props.value}
        </ButtonIconTsx>
      </Show>
    </div>
  );
}
