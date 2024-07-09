import {JSX, splitProps} from 'solid-js';
import classNames from '../helpers/string/classNames';
import Icon from './icon';
import ripple from './ripple';
import SvgIcon, {SvgIconType} from './iconSvg';

export const ButtonIconTsx = (props: {icon?: Icon | string, noRipple?: boolean, asSvgIcon?: boolean} & JSX.ButtonHTMLAttributes<HTMLButtonElement>) => {
  const [, rest] = splitProps(props, ['icon', 'noRipple', 'asSvgIcon']);

  const btn = (
    <button
      {...rest}
      class={classNames('btn-icon', props.class)}
      tabIndex={-1}
    >
      {props.icon ? (props.asSvgIcon ? SvgIcon(props.icon as SvgIconType) : Icon(props.icon as Icon)) : props.children}
    </button>
  );

  if(!props.noRipple) ripple(btn as HTMLElement);

  return btn;
};
