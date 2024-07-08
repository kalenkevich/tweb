import {JSX, splitProps} from 'solid-js';
import classNames from '../helpers/string/classNames';
import Icon from './icon';
import ripple from './ripple';
import ImgIcon from './iconImg';

export const ButtonIconTsx = (props: {icon?: Icon | string, noRipple?: boolean, asImgIcon?: boolean} & JSX.ButtonHTMLAttributes<HTMLButtonElement>) => {
  const [, rest] = splitProps(props, ['icon', 'noRipple', 'asImgIcon']);

  const btn = (
    <button
      {...rest}
      class={classNames('btn-icon', props.class)}
      tabIndex={-1}
    >
      {props.icon ? (props.asImgIcon ? ImgIcon(props.icon) : Icon(props.icon as Icon)) : props.children}
    </button>
  );

  if(!props.noRipple) ripple(btn as HTMLElement);

  return btn;
};
