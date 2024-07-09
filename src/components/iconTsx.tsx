import {JSX, splitProps} from 'solid-js';
import classNames from '../helpers/string/classNames';
import {getIconContent} from './icon';
import SvgIcon, {SvgIconType} from './iconSvg';

export const IconTsx = (props: {icon: Icon | SvgIconType, asSvgIcon?: boolean} & JSX.HTMLAttributes<HTMLSpanElement>) => {
  const [, rest] = splitProps(props, ['icon', 'asSvgIcon']);

  return (
    <span {...rest} class={classNames('tgico', props.class)}>
      {props.asSvgIcon ? SvgIcon(props.icon as SvgIconType) : getIconContent(props.icon as Icon)}
    </span>
  );
};
