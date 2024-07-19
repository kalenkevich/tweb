import {JSX, For, Show, createSignal} from 'solid-js';
import {i18n} from '../../../lib/langPack';
import {ImageChangeType, ImageFilterType} from '../types';
import {ImageControlProps} from './imageControl';
import {RangeSelectorTsx} from '../../rangeSelectorTsx';
import {MobileRangeSelector} from '../common/mobileRangeSelector';
import {Select} from '../common/select';

export interface ImageFilterControlProps extends ImageControlProps {}

const IMAGE_FILTER_CONTROLS_CONFIG = [{
  label: i18n('ImageEditor.EnhanceControl.Enhance'),
  type: ImageFilterType.sharpness,
  value: (props: ImageFilterControlProps) => Math.round(props.imageState.filter.sharpness * 100),
  step: 1,
  min: 0,
  max: 100,
  trumpSize: 20
}, {
  label: i18n('ImageEditor.EnhanceControl.Brightness'),
  type: ImageFilterType.brightness,
  value: (props: ImageFilterControlProps) => Math.round(props.imageState.filter.brightness * 100),
  step: 1,
  min: -100,
  max: 100,
  trumpSize: 20
}, {
  label: i18n('ImageEditor.EnhanceControl.Contrast'),
  type: ImageFilterType.contrast,
  value: (props: ImageFilterControlProps) => Math.round(props.imageState.filter.contrast * 100),
  step: 1,
  min: -100,
  max: 100,
  trumpSize: 20
}, {
  label: i18n('ImageEditor.EnhanceControl.Saturation'),
  type: ImageFilterType.saturation,
  value: (props: ImageFilterControlProps) => Math.round(props.imageState.filter.saturation * 100),
  step: 1,
  min: -100,
  max: 100,
  trumpSize: 20
}, {
  label: i18n('ImageEditor.EnhanceControl.Warmth'),
  type: ImageFilterType.warmth,
  value: (props: ImageFilterControlProps) => Math.round(props.imageState.filter.warmth * 100),
  step: 1,
  min: -100,
  max: 100,
  trumpSize: 20
}, {
  label: i18n('ImageEditor.EnhanceControl.Fade'),
  type: ImageFilterType.fade,
  value: (props: ImageFilterControlProps) => Math.round(props.imageState.filter.fade * 100),
  step: 1,
  min: 0,
  max: 100,
  trumpSize: 20
}, {
  label: i18n('ImageEditor.EnhanceControl.Highlights'),
  type: ImageFilterType.highlights,
  value: (props: ImageFilterControlProps) => Math.round(props.imageState.filter.highlights * 100),
  step: 1,
  min: -100,
  max: 100,
  trumpSize: 20
}, {
  label: i18n('ImageEditor.EnhanceControl.Shadows'),
  type: ImageFilterType.shadows,
  value: (props: ImageFilterControlProps) => Math.round(props.imageState.filter.shadows * 100),
  step: 1,
  min: -100,
  max: 100,
  trumpSize: 20
}, {
  label: i18n('ImageEditor.EnhanceControl.Vignette'),
  type: ImageFilterType.vignette,
  value: (props: ImageFilterControlProps) => Math.round(props.imageState.filter.vignette * 100),
  step: 1,
  min: 0,
  max: 100,
  trumpSize: 20
}, {
  label: i18n('ImageEditor.EnhanceControl.Grain'),
  value: (props: ImageFilterControlProps) => Math.round(props.imageState.filter.grain * 100),
  type: ImageFilterType.grain,
  step: 1,
  min: 0,
  max: 100,
  trumpSize: 20
}, {
  label: i18n('ImageEditor.EnhanceControl.Sharpen'),
  type: ImageFilterType.sharpen,
  value: (props: ImageFilterControlProps) => Math.round(props.imageState.filter.sharpen * 100),
  step: 1,
  min: 0,
  max: 100,
  trumpSize: 20
}]

export function ImageFilterControl(props: ImageFilterControlProps): JSX.Element {
  const [selectedFilter, setSelectedFilter] = createSignal(IMAGE_FILTER_CONTROLS_CONFIG[0]);

  return (
    <>
      <Show when={!props.isMobile}>
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
                    <RangeSelectorTsx
                      step={imageControlConfig.step}
                      min={imageControlConfig.min}
                      max={imageControlConfig.max}
                      value={imageControlConfig.value(props)}
                      trumpSize={imageControlConfig.trumpSize}
                      onScrub={(value: number) => props.onImageChange({
                        type: ImageChangeType.filter,
                        value: {...props.imageState.filter, [imageControlConfig.type]: value / 100}
                      })}
                    />
                  </div>
                </label>
              </div>
            )}
          </For>
        </div>
      </Show>
      <Show when={props.isMobile}>
        <div class="image-editor__image-control filter-image-control">
          <div class="filter-image-control__name">
            {i18n('ImageEditor.EnhanceControl.Label')}
          </div>
          <MobileRangeSelector
            defaultOpen={true}
            step={selectedFilter().step}
            min={selectedFilter().min}
            max={selectedFilter().max}
            value={selectedFilter().value(props)}
            trumpSize={selectedFilter().trumpSize}
            onScrub={(value: number) => props.onImageChange({
              type: ImageChangeType.filter,
              value: {...props.imageState.filter, [selectedFilter().type]: value / 100}
            })}
          >
            <Select
              value={selectedFilter().type}
              options={IMAGE_FILTER_CONTROLS_CONFIG.map(opt => ({
                label: opt.label,
                value: opt.type
              }))}
              onClick={(opt) => {
                const config = IMAGE_FILTER_CONTROLS_CONFIG.find(c => c.type === opt.value);

                setSelectedFilter(config);
              }}
            />
          </MobileRangeSelector>
        </div>
      </Show>
    </>
  );
}
