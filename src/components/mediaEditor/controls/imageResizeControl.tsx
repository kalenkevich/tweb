import {JSX, For, createSignal} from 'solid-js';
import {i18n} from '../../../lib/langPack';
import {ImageAspectRatio, ImageChangeType} from '../types';
import {ImageControlProps} from './imageControl';
import {SvgIconType} from '../../iconSvg';
import RowTsx from '../../rowTsx';

export interface ImageResizeControlProps extends ImageControlProps {}

const ASTECT_RATIO_CONFIGS = [{
  label: i18n('ImageEditor.ResizeControl.Free'),
  value: ImageAspectRatio.custom,
  icon: 'aspect_free',
  asSvgIcon: true,
  fullWidth: true
}, {
  label: i18n('ImageEditor.ResizeControl.Original'),
  value: ImageAspectRatio.original,
  icon: 'aspect_original',
  asSvgIcon: true,
  fullWidth: true
}, {
  label: i18n('ImageEditor.ResizeControl.Square'),
  value: ImageAspectRatio.square,
  icon: 'aspect_square',
  asSvgIcon: true,
  fullWidth: true
}, {
  label: '3:2',
  value: 3/2,
  icon: 'aspect_3x2',
  asSvgIcon: true,
  fullWidth: false
}, {
  label: '2:3',
  icon: 'aspect_2x3',
  value: 2/3,
  asSvgIcon: true,
  fullWidth: false
}, {
  label: '4:3',
  value: 4/3,
  icon: 'aspect_4x3',
  asSvgIcon: true,
  fullWidth: false
}, {
  label: '3:4',
  value: 3/4,
  icon: 'aspect_3x4',
  asSvgIcon: true,
  fullWidth: false
}, {
  label: '5:4',
  value: 5/4,
  icon: 'aspect_5x4',
  asSvgIcon: true,
  fullWidth: false
}, {
  label: '4:5',
  value: 4/5,
  icon: 'aspect_4x5',
  asSvgIcon: true,
  fullWidth: false
}, {
  label: '7:5',
  value: 7/5,
  icon: 'aspect_7x5',
  asSvgIcon: true,
  fullWidth: false
}, {
  label: '5:7',
  value: 5/7,
  icon: 'aspect_5x7',
  asSvgIcon: true,
  fullWidth: false
}, {
  label: '16:9',
  value: 16/9,
  icon: 'aspect_16x9',
  asSvgIcon: true,
  fullWidth: false
}, {
  label: '16:9',
  value: 9/16,
  icon: 'aspect_9x16',
  asSvgIcon: true,
  fullWidth: false
}];

export function ImageResizeControl(props: ImageResizeControlProps): JSX.Element {
  // default value is aspect original
  const [selectedValue, setSelectedValue] = createSignal(ASTECT_RATIO_CONFIGS[1]);

  return (
    <div class="image-editor__image-control resize-image-control">
      <div class="resize-image-control__name">
        {i18n('ImageEditor.ResizeControl.AspectRatio')}
      </div>
      <div class="resize-image-control__options">
        <For each={ASTECT_RATIO_CONFIGS}>
          {(config) => (
            <RowTsx
              classList={{
                'aspect-row-full': config.fullWidth,
                'aspect-row-half': !config.fullWidth,
                'aspect-row-selected': selectedValue() === config
              }}
              icon={config.icon as SvgIconType}
              asSvgIcon={config.asSvgIcon}
              title={config.label}
              clickable={() => {
                setSelectedValue(config);
                props.onImageChange({type: ImageChangeType.aspectRatio, value: config.value});
              }}
            />
          )}
        </For>
      </div>
    </div>
  );
}
