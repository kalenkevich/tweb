/*
 * https://github.com/morethanwords/tweb
 * Copyright (C) 2019-2021 Eduard Kuzmenko
 * https://github.com/morethanwords/tweb/blob/master/LICENSE
 */

import Button from './button';

const ButtonIcon = (className?: string, options: Partial<{noRipple: true, onlyMobile: true, asDiv: boolean, asSvgIcon: boolean}> = {}) => {
  const splitted = className?.split(' ');
  const button = Button('btn-icon' + (splitted?.length > 1 ? ' ' + splitted.slice(1).join(' ') : ''), {
    icon: !options.asSvgIcon ? splitted?.[0] as Icon || undefined : undefined,
    svgIcon: options.asSvgIcon ? splitted?.[0] : undefined,
    ...options
  });

  return button;
};

export default ButtonIcon;
