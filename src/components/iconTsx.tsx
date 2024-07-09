import {JSX, splitProps} from 'solid-js';
import classNames from '../helpers/string/classNames';
import {getIconContent} from './icon';
import ImgIcon from './iconImg';

export const IconTsx = (props: {icon: Icon | string, asImgIcon?: boolean} & JSX.HTMLAttributes<HTMLSpanElement>) => {
  const [, rest] = splitProps(props, ['icon', 'asImgIcon']);

  return (
    <span {...rest} class={classNames('tgico', props.class)}>
      {props.asImgIcon ? ImgIcon(props.icon) : getIconContent(props.icon as Icon)}
    </span>
  );
};
