import {JSX, For} from 'solid-js';
import {i18n} from '../../../lib/langPack';
import {ImageChangeType} from '../types';
import {ImageControlProps} from './imageControl';
import {RangeSelectorTsx} from '../../rangeSelectorTsx';

export interface ImageFilterControlProps extends ImageControlProps {}

const IMAGE_FILTER_CONTROLS_CONFIG = [{
  label: i18n('ImageEditor.EnhanceControl.Enhance'),
  value: (props: ImageFilterControlProps) => props.imageState.filter.enhance,
  component: (props: ImageFilterControlProps) => (
    <RangeSelectorTsx
      step={1}
      min={0}
      max={100}
      value={props.imageState.filter.enhance}
      trumpSize={20}
      onScrub={(value: number) => props.onImageChange({
        type: ImageChangeType.filter,
        value: {...props.imageState.filter, enhance: value}
      })}
    />
  )
}, {
  label: i18n('ImageEditor.EnhanceControl.Brightness'),
  value: (props: ImageFilterControlProps) => props.imageState.filter.brightness,
  component: (props: ImageFilterControlProps) => (
    <RangeSelectorTsx
      step={1}
      min={-100}
      max={100}
      value={props.imageState.filter.brightness}
      trumpSize={20}
      onScrub={(value: number) => props.onImageChange({
        type: ImageChangeType.filter,
        value: {...props.imageState.filter, brightness: value}
      })}
    />
  )
}, {
  label: i18n('ImageEditor.EnhanceControl.Contrast'),
  value: (props: ImageFilterControlProps) => props.imageState.filter.contrast,
  component: (props: ImageFilterControlProps) => (
    <RangeSelectorTsx
      step={1}
      min={0}
      max={100}
      value={props.imageState.filter.contrast}
      trumpSize={20}
      onScrub={(value: number) => props.onImageChange({
        type: ImageChangeType.filter,
        value: {...props.imageState.filter, contrast: value}
      })}
    />
  )
}, {
  label: i18n('ImageEditor.EnhanceControl.Saturation'),
  value: (props: ImageFilterControlProps) => props.imageState.filter.saturation,
  component: (props: ImageFilterControlProps) => (
    <RangeSelectorTsx
      step={1}
      min={-100}
      max={100}
      value={props.imageState.filter.saturation}
      trumpSize={20}
      onScrub={(value: number) => props.onImageChange({
        type: ImageChangeType.filter,
        value: {...props.imageState.filter, saturation: value}
      })}
    />
  )
}, {
  label: i18n('ImageEditor.EnhanceControl.Warmth'),
  value: (props: ImageFilterControlProps) => props.imageState.filter.warmth,
  component: (props: ImageFilterControlProps) => (
    <RangeSelectorTsx
      step={1}
      min={-100}
      max={100}
      value={props.imageState.filter.warmth}
      trumpSize={20}
      onScrub={(value: number) => props.onImageChange({
        type: ImageChangeType.filter,
        value: {...props.imageState.filter, warmth: value}
      })}
    />
  )
}, {
  label: i18n('ImageEditor.EnhanceControl.Fade'),
  value: (props: ImageFilterControlProps) => props.imageState.filter.fade,
  component: (props: ImageFilterControlProps) => (
    <RangeSelectorTsx
      step={1}
      min={0}
      max={100}
      value={props.imageState.filter.fade}
      trumpSize={20}
      onScrub={(value: number) => props.onImageChange({
        type: ImageChangeType.filter,
        value: {...props.imageState.filter, fade: value}
      })}
    />
  )
}, {
  label: i18n('ImageEditor.EnhanceControl.Highlights'),
  value: (props: ImageFilterControlProps) => props.imageState.filter.highlights,
  component: (props: ImageFilterControlProps) => (
    <RangeSelectorTsx
      step={1}
      min={-100}
      max={100}
      value={props.imageState.filter.highlights}
      trumpSize={20}
      onScrub={(value: number) => props.onImageChange({
        type: ImageChangeType.filter,
        value: {...props.imageState.filter, highlights: value}
      })}
    />
  )
}, {
  label: i18n('ImageEditor.EnhanceControl.Shadows'),
  value: (props: ImageFilterControlProps) => props.imageState.filter.shadows,
  component: (props: ImageFilterControlProps) => (
    <RangeSelectorTsx
      step={1}
      min={-100}
      max={100}
      value={props.imageState.filter.shadows}
      trumpSize={20}
      onScrub={(value: number) => props.onImageChange({
        type: ImageChangeType.filter,
        value: {...props.imageState.filter, shadows: value}
      })}
    />
  )
}, {
  label: i18n('ImageEditor.EnhanceControl.Vignette'),
  value: (props: ImageFilterControlProps) => props.imageState.filter.vignette,
  component: (props: ImageFilterControlProps) => (
    <RangeSelectorTsx
      step={1}
      min={-100}
      max={100}
      value={props.imageState.filter.vignette}
      trumpSize={20}
      onScrub={(value: number) => props.onImageChange({
        type: ImageChangeType.filter,
        value: {...props.imageState.filter, vignette: value}
      })}
    />
  )
}, {
  label: i18n('ImageEditor.EnhanceControl.Grain'),
  value: (props: ImageFilterControlProps) => props.imageState.filter.grain,
  component: (props: ImageFilterControlProps) => (
    <RangeSelectorTsx
      step={1}
      min={0}
      max={100}
      value={props.imageState.filter.grain}
      trumpSize={20}
      onScrub={(value: number) => props.onImageChange({
        type: ImageChangeType.filter,
        value: {...props.imageState.filter, grain: value}
      })}
    />
  )
}, {
  label: i18n('ImageEditor.EnhanceControl.Sharpen'),
  value: (props: ImageFilterControlProps) => props.imageState.filter.sharpen,
  component: (props: ImageFilterControlProps) => (
    <RangeSelectorTsx
      step={1}
      min={0}
      max={100}
      value={props.imageState.filter.sharpen}
      trumpSize={20}
      onScrub={(value: number) => props.onImageChange({
        type: ImageChangeType.filter,
        value: {...props.imageState.filter, sharpen: value}
      })}
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
