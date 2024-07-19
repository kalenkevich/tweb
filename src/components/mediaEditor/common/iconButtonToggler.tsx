import {createSignal} from 'solid-js';
import {ButtonIconTsx} from '../../buttonIconTsx';

export interface IconConfig {
  icon: string;
  asSvgIcon: boolean;
  square: boolean;
  value: any;
}

export interface IconButtonTogglerProps {
  icons: IconConfig[];
  onClick: (icon: IconConfig) => void;
}

export function IconButtonToggler(props: IconButtonTogglerProps) {
  const [selectedIconIndex, setSelctedIconIndex] = createSignal(0);
  const selectedIcon = () => props.icons[selectedIconIndex()];
  const handleClick = () => {
    props.onClick(selectedIcon());

    setSelctedIconIndex(index => {
      if(props.icons.length === index + 1) {
        return 0;
      }

      return index + 1;
    });
  };

  return (
    <ButtonIconTsx
      class="text-property-icon-container"
      square={selectedIcon().square}
      icon={selectedIcon().icon}
      asSvgIcon={selectedIcon().asSvgIcon}
      onClick={() => handleClick()}
    />
  );
}
