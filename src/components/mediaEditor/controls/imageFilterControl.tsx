import {JSX, For} from 'solid-js';
import {i18n} from '../../../lib/langPack';
import {ImageChangeType} from '../types';
import {ImageControlProps} from './imageControl';
import {RangeSelectorTsx} from '../../rangeSelectorTsx';

export interface ImageFilterControlProps extends ImageControlProps {}

const IMAGE_FILTER_CONTROLS_CONFIG = [{
  label: i18n('ImageEditor.EnhanceControl.Enhance'),
  value: (props: ImageFilterControlProps) => props.imageState.enhance,
  component: (props: ImageFilterControlProps) => (
    <RangeSelectorTsx
      step={1}
      min={0}
      max={100}
      value={props.imageState.enhance}
      onScrub={(value: number) => props.onImageChange({type: ImageChangeType.enhance, value})}
    />
  )
}, {
  label: i18n('ImageEditor.EnhanceControl.Brightness'),
  value: (props: ImageFilterControlProps) => props.imageState.brightness,
  component: (props: ImageFilterControlProps) => (
    <RangeSelectorTsx
      step={1}
      min={-100}
      max={100}
      value={props.imageState.brightness}
      onScrub={(value: number) => props.onImageChange({type: ImageChangeType.brightness, value})}
    />
  )
}, {
  label: i18n('ImageEditor.EnhanceControl.Contrast'),
  value: (props: ImageFilterControlProps) => props.imageState.contrast,
  component: (props: ImageFilterControlProps) => (
    <RangeSelectorTsx
      step={1}
      min={0}
      max={100}
      value={props.imageState.contrast}
      onScrub={(value: number) => props.onImageChange({type: ImageChangeType.contrast, value})}
    />
  )
}, {
  label: i18n('ImageEditor.EnhanceControl.Saturation'),
  value: (props: ImageFilterControlProps) => props.imageState.saturation,
  component: (props: ImageFilterControlProps) => (
    <RangeSelectorTsx
      step={1}
      min={-100}
      max={100}
      value={props.imageState.saturation}
      onScrub={(value: number) => props.onImageChange({type: ImageChangeType.saturation, value})}
    />
  )
}, {
  label: i18n('ImageEditor.EnhanceControl.Warmth'),
  value: (props: ImageFilterControlProps) => props.imageState.warmth,
  component: (props: ImageFilterControlProps) => (
    <RangeSelectorTsx
      step={1}
      min={-100}
      max={100}
      value={props.imageState.warmth}
      onScrub={(value: number) => props.onImageChange({type: ImageChangeType.warmth, value})}
    />
  )
}, {
  label: i18n('ImageEditor.EnhanceControl.Fade'),
  value: (props: ImageFilterControlProps) => props.imageState.fade,
  component: (props: ImageFilterControlProps) => (
    <RangeSelectorTsx
      step={1}
      min={0}
      max={100}
      value={props.imageState.fade}
      onScrub={(value: number) => props.onImageChange({type: ImageChangeType.fade, value})}
    />
  )
}, {
  label: i18n('ImageEditor.EnhanceControl.Highlights'),
  value: (props: ImageFilterControlProps) => props.imageState.highlights,
  component: (props: ImageFilterControlProps) => (
    <RangeSelectorTsx
      step={1}
      min={-100}
      max={100}
      value={props.imageState.highlights}
      onScrub={(value: number) => props.onImageChange({type: ImageChangeType.highlights, value})}
    />
  )
}, {
  label: i18n('ImageEditor.EnhanceControl.Shadows'),
  value: (props: ImageFilterControlProps) => props.imageState.shadows,
  component: (props: ImageFilterControlProps) => (
    <RangeSelectorTsx
      step={1}
      min={-100}
      max={100}
      value={props.imageState.shadows}
      onScrub={(value: number) => props.onImageChange({type: ImageChangeType.shadows, value})}
    />
  )
}, {
  label: i18n('ImageEditor.EnhanceControl.Vignette'),
  value: (props: ImageFilterControlProps) => props.imageState.vignette,
  component: (props: ImageFilterControlProps) => (
    <RangeSelectorTsx
      step={1}
      min={-100}
      max={100}
      value={props.imageState.vignette}
      onScrub={(value: number) => props.onImageChange({type: ImageChangeType.shadows, value})}
    />
  )
}, {
  label: i18n('ImageEditor.EnhanceControl.Grain'),
  value: (props: ImageFilterControlProps) => props.imageState.grain,
  component: (props: ImageFilterControlProps) => (
    <RangeSelectorTsx
      step={1}
      min={0}
      max={100}
      value={props.imageState.grain}
      onScrub={(value: number) => props.onImageChange({type: ImageChangeType.grain, value})}
    />
  )
}, {
  label: i18n('ImageEditor.EnhanceControl.Sharpen'),
  value: (props: ImageFilterControlProps) => props.imageState.sharpen,
  component: (props: ImageFilterControlProps) => (
    <RangeSelectorTsx
      step={1}
      min={0}
      max={100}
      value={props.imageState.sharpen}
      onScrub={(value: number) => props.onImageChange({type: ImageChangeType.sharpen, value})}
    />
  )
}]

export function ImageFilterControl(props: ImageFilterControlProps): JSX.Element {
  return (
    <div class="image-editor__image-control filter-image-control">
      <For each={IMAGE_FILTER_CONTROLS_CONFIG}>
        {(imageControlConfig) => (
          <div class="image-control">
            <label class="image-control__label-container">
              <div class="image-control__label">
                <span class="image-control__name">
                  {imageControlConfig.label}
                </span>
                <span class="image-control__value">
                  {imageControlConfig.value(props)}
                </span>
              </div>
              <div class="image-control__wrapper">
                {imageControlConfig.component(props)}
              </div>
            </label>
          </div>
        )}
      </For>
    </div>
  );
}
