import {JSX, For} from 'solid-js';
import {i18n} from '../../../lib/langPack';
import {ImageChangeType} from '../types';
import {ImageControlProps} from './imageControl';
import {RangeSelectorTsx} from '../../rangeSelectorTsx';

export interface ImageFilterControlProps extends ImageControlProps {}

const IMAGE_FILTER_CONTROLS_CONFIG = [{
  label: i18n('ImageEditor.EnhanceControl.Enhance'),
  value: (props: ImageFilterControlProps) => Math.round(props.imageState.filter.sharpness * 100),
  component: (props: ImageFilterControlProps) => (
    <RangeSelectorTsx
      step={1}
      min={0}
      max={100}
      value={Math.round(props.imageState.filter.sharpness * 100)}
      trumpSize={20}
      onScrub={(value: number) => props.onImageChange({
        type: ImageChangeType.filter,
        value: {...props.imageState.filter, sharpness: value / 100}
      })}
    />
  )
}, {
  label: i18n('ImageEditor.EnhanceControl.Brightness'),
  value: (props: ImageFilterControlProps) => Math.round(props.imageState.filter.brightness * 100),
  component: (props: ImageFilterControlProps) => (
    <RangeSelectorTsx
      step={1}
      min={-100}
      max={100}
      value={Math.round(props.imageState.filter.brightness * 100)}
      trumpSize={20}
      onScrub={(value: number) => props.onImageChange({
        type: ImageChangeType.filter,
        value: {...props.imageState.filter, brightness: value / 100}
      })}
    />
  )
}, {
  label: i18n('ImageEditor.EnhanceControl.Contrast'),
  value: (props: ImageFilterControlProps) => Math.round(props.imageState.filter.contrast * 100),
  component: (props: ImageFilterControlProps) => (
    <RangeSelectorTsx
      step={1}
      min={-100}
      max={100}
      value={Math.round(props.imageState.filter.contrast * 100)}
      trumpSize={20}
      onScrub={(value: number) => props.onImageChange({
        type: ImageChangeType.filter,
        value: {...props.imageState.filter, contrast: value / 100}
      })}
    />
  )
}, {
  label: i18n('ImageEditor.EnhanceControl.Saturation'),
  value: (props: ImageFilterControlProps) => Math.round(props.imageState.filter.saturation * 100),
  component: (props: ImageFilterControlProps) => (
    <RangeSelectorTsx
      step={1}
      min={-100}
      max={100}
      value={Math.round(props.imageState.filter.saturation * 100)}
      trumpSize={20}
      onScrub={(value: number) => props.onImageChange({
        type: ImageChangeType.filter,
        value: {...props.imageState.filter, saturation: value / 100}
      })}
    />
  )
}, {
  label: i18n('ImageEditor.EnhanceControl.Warmth'),
  value: (props: ImageFilterControlProps) => Math.round(props.imageState.filter.warmth * 100),
  component: (props: ImageFilterControlProps) => (
    <RangeSelectorTsx
      step={1}
      min={-100}
      max={100}
      value={props.imageState.filter.warmth * 100}
      trumpSize={20}
      onScrub={(value: number) => props.onImageChange({
        type: ImageChangeType.filter,
        value: {...props.imageState.filter, warmth: value / 100}
      })}
    />
  )
}, {
  label: i18n('ImageEditor.EnhanceControl.Fade'),
  value: (props: ImageFilterControlProps) => Math.round(props.imageState.filter.fade * 100),
  component: (props: ImageFilterControlProps) => (
    <RangeSelectorTsx
      step={1}
      min={0}
      max={100}
      value={props.imageState.filter.fade * 100}
      trumpSize={20}
      onScrub={(value: number) => props.onImageChange({
        type: ImageChangeType.filter,
        value: {...props.imageState.filter, fade: value / 100}
      })}
    />
  )
}, {
  label: i18n('ImageEditor.EnhanceControl.Highlights'),
  value: (props: ImageFilterControlProps) => Math.round(props.imageState.filter.highlights * 100),
  component: (props: ImageFilterControlProps) => (
    <RangeSelectorTsx
      step={1}
      min={-100}
      max={100}
      value={Math.round(props.imageState.filter.highlights * 100)}
      trumpSize={20}
      onScrub={(value: number) => props.onImageChange({
        type: ImageChangeType.filter,
        value: {...props.imageState.filter, highlights: value / 100}
      })}
    />
  )
}, {
  label: i18n('ImageEditor.EnhanceControl.Shadows'),
  value: (props: ImageFilterControlProps) => Math.round(props.imageState.filter.shadows * 100),
  component: (props: ImageFilterControlProps) => (
    <RangeSelectorTsx
      step={1}
      min={-100}
      max={100}
      value={Math.round(props.imageState.filter.shadows * 100)}
      trumpSize={20}
      onScrub={(value: number) => props.onImageChange({
        type: ImageChangeType.filter,
        value: {...props.imageState.filter, shadows: value / 100}
      })}
    />
  )
}, {
  label: i18n('ImageEditor.EnhanceControl.Vignette'),
  value: (props: ImageFilterControlProps) => Math.round(props.imageState.filter.vignette * 100),
  component: (props: ImageFilterControlProps) => (
    <RangeSelectorTsx
      step={1}
      min={0}
      max={100}
      value={Math.round(props.imageState.filter.vignette * 100)}
      trumpSize={20}
      onScrub={(value: number) => props.onImageChange({
        type: ImageChangeType.filter,
        value: {...props.imageState.filter, vignette: value / 100}
      })}
    />
  )
}, {
  label: i18n('ImageEditor.EnhanceControl.Grain'),
  value: (props: ImageFilterControlProps) => Math.round(props.imageState.filter.grain * 100),
  component: (props: ImageFilterControlProps) => (
    <RangeSelectorTsx
      step={1}
      min={0}
      max={100}
      value={Math.round(props.imageState.filter.grain * 100)}
      trumpSize={20}
      onScrub={(value: number) => props.onImageChange({
        type: ImageChangeType.filter,
        value: {...props.imageState.filter, grain: value / 100}
      })}
    />
  )
}, {
  label: i18n('ImageEditor.EnhanceControl.Sharpen'),
  value: (props: ImageFilterControlProps) => Math.round(props.imageState.filter.sharpen * 100),
  component: (props: ImageFilterControlProps) => (
    <RangeSelectorTsx
      step={1}
      min={0}
      max={100}
      value={Math.round(props.imageState.filter.sharpen * 100)}
      trumpSize={20}
      onScrub={(value: number) => props.onImageChange({
        type: ImageChangeType.filter,
        value: {...props.imageState.filter, sharpen: value / 100}
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
