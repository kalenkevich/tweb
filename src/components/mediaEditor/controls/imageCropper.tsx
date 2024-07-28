import {createSignal, createEffect, on, For, batch, onMount, Show} from 'solid-js';
import {ImageAspectRatio, ImageChangeType} from '../types';
import {ImageControlProps} from './imageControl';
import {DraggingSurface} from '../draggable/surface';
import {getDimentionsForAspectRatio, getScaleByAspectRatio} from '../helpers/aspectRatioHelper';
import {Draggable} from '../draggable/draggable';
import {ButtonIconTsx} from '../../buttonIconTsx';

const GRID_ROWS_COUNT = 4;

const GRID_COLUMNS_COUNT = 4;

export enum ImageCoverPosition {
  top = 'top',
  left = 'left',
  right = 'right',
  bottom = 'bottom'
}

export interface ImageCropper {
  x: number;
  y: number;
  width: number;
  height: number;
  surfaceWidth: number;
  surfaceHeight: number;
  scale: [number, number];
  rows: ImageCropperRow[];
  columns: ImageCropperColumn[];
  styles: Record<string, string>;
  covers: {
    top: ImageCropperCover;
    left: ImageCropperCover;
    right: ImageCropperCover;
    bottom: ImageCropperCover;
  }
}

export interface ImageCropperRow {
  styles: Record<string, string>;
}

export interface ImageCropperColumn {
  styles: Record<string, string>
}

export interface ImageCropperCover {
  x: number;
  y: number;
  width: number;
  height: number;
  position: ImageCoverPosition;
  styles: Record<string, string>;
}

export function getImageCropperFromAspectRatio(
  x: number,
  y: number,
  aspectRatio: ImageAspectRatio | number,
  surfaceWidth: number,
  surfaceHeight: number,
  rowsCount: number = GRID_ROWS_COUNT,
  columnsCount: number = GRID_COLUMNS_COUNT
): ImageCropper {
  const [width, height] = getDimentionsForAspectRatio(
    surfaceWidth,
    surfaceHeight,
    aspectRatio
  );
  const scale = getScaleByAspectRatio(surfaceWidth, surfaceHeight, aspectRatio);

  return getImageCropper(x, y, width, height, surfaceWidth, surfaceHeight, scale, rowsCount, columnsCount);
}

export function getImageCropper(
  x: number,
  y: number,
  width: number,
  height: number,
  surfaceWidth: number,
  surfaceHeight: number,
  scale: [number, number],
  rowsCount: number = GRID_ROWS_COUNT,
  columnsCount: number = GRID_COLUMNS_COUNT
): ImageCropper {
  return {
    x,
    y,
    width,
    height,
    scale,
    surfaceWidth,
    surfaceHeight,
    rows: getGridRows(width, height, rowsCount),
    columns: getGridColumns(width, height, columnsCount),
    styles: {
      'width': `${width}px`,
      'height': `${height}px`
    },
    covers: {
      top: getImageCover(x, y, width, height, surfaceWidth, surfaceHeight, ImageCoverPosition.top),
      left: getImageCover(x, y, width, height, surfaceWidth, surfaceHeight, ImageCoverPosition.left),
      right: getImageCover(x, y, width, height, surfaceWidth, surfaceHeight, ImageCoverPosition.right),
      bottom: getImageCover(x, y, width, height, surfaceWidth, surfaceHeight, ImageCoverPosition.bottom)
    }
  }
}

function getGridRows(width: number, height: number, count = GRID_ROWS_COUNT): ImageCropperRow[] {
  const result: ImageCropperRow [] = [];
  const step = height / (count - 1);
  let currentY = 0;

  for(let i = 0; i < count; i++) {
    result.push({
      styles: {
        display: 'block',
        position: 'absolute',
        background: 'rgba(255, 255, 255, 0.3)',
        width: `${width}px`,
        height: '1px',
        top: `${currentY}px`,
        left: '0px'
      }
    });

    currentY += step;
  }

  return result;
}

function getGridColumns(width: number, height: number, count = GRID_COLUMNS_COUNT): ImageCropperColumn[] {
  const result: ImageCropperColumn[] = [];
  const step = width / (count - 1);
  let currentX = 0;

  for(let i = 0; i < count; i++) {
    result.push({
      styles: {
        display: 'block',
        position: 'absolute',
        background: 'rgba(255, 255, 255, 0.3)',
        height: `${height}px`,
        width: '1px',
        top: '0px',
        left: `${currentX}px`
      }
    });

    currentX += step;
  }

  return result;
}

function getImageCover(
  x: number,
  y: number,
  imageWidth: number,
  imageHeight: number,
  surfaceWidth: number,
  surfaceHeight: number,
  position: ImageCoverPosition
): ImageCropperCover {
  if(position === ImageCoverPosition.top) {
    return {
      x: 0,
      y: 0,
      width: surfaceWidth,
      height: y,
      position,
      styles: {
        'position': 'absolute',
        'top': '0',
        'left': '0',
        'width': `${surfaceWidth}px`,
        'height': `${y / window.devicePixelRatio}px`,
        'background-color': 'rgba(0.0, 0.0, 0.0, 0.3)'
      }
    };
  }

  if(position === ImageCoverPosition.left) {
    return {
      x: 0,
      y: y / window.devicePixelRatio,
      width: x / window.devicePixelRatio,
      height: imageHeight,
      position,
      styles: {
        'position': 'absolute',
        'left': '0',
        'top': `${y / window.devicePixelRatio}px`,
        'width': `${x / window.devicePixelRatio}px`,
        'height': `${imageHeight}px`,
        'background-color': 'rgba(0.0, 0.0, 0.0, 0.3)'
      }
    };
  }

  if(position === ImageCoverPosition.right) {
    return {
      x: x + imageWidth,
      y: y,
      width: surfaceWidth - (x / window.devicePixelRatio + imageWidth),
      height: imageHeight,
      position,
      styles: {
        'position': 'absolute',
        'top': `${y / window.devicePixelRatio}px`,
        'left': `${x / window.devicePixelRatio + imageWidth}px`,
        'width': `${surfaceWidth - (x / window.devicePixelRatio + imageWidth)}px`,
        'height': `${imageHeight}px`,
        'background-color': 'rgba(0.0, 0.0, 0.0, 0.3)'
      }
    };
  }

  if(position === ImageCoverPosition.bottom) {
    return {
      x: 0,
      y: y / window.devicePixelRatio + imageHeight,
      width: surfaceWidth,
      height: surfaceHeight - (y / window.devicePixelRatio + imageHeight),
      position,
      styles: {
        'position': 'absolute',
        'top': `${y / window.devicePixelRatio + imageHeight}px`,
        'left': '0',
        'width': `${surfaceWidth}px`,
        'height': `${surfaceHeight - (y / window.devicePixelRatio + imageHeight)}px`,
        'background-color': 'rgba(0.0, 0.0, 0.0, 0.3)'
      }
    };
  }
}

export interface ImageCropperProps extends ImageControlProps {
  surface: DraggingSurface;
  onSaveClick: () => void;
}
export function ImageCropperComponent(props: ImageCropperProps) {
  const [isDirty, setDirtyState] = createSignal(false);
  const [translation, setTranslation] = createSignal<[number, number]>([
    props.surface.element.offsetWidth / 2,
    props.surface.element.offsetHeight / 2
  ]);
  const [scale, setScale] = createSignal<[number, number]>([1, 1]);
  const [origin, setOrigin] = createSignal<[number, number]>([0, 0]);
  const [imageCropper, setImageCropper] = createSignal<ImageCropper>(
    getImageCropperFromAspectRatio(
      translation()[0] + origin()[0],
      translation()[1] + origin()[1],
      props.imageState.aspectRatio,
      props.surface.element.offsetWidth,
      props.surface.element.offsetHeight
    )
  );

  onMount(() => {
    updateCropper(props.imageState.aspectRatio);
  });

  createEffect(on(() => props.imageState.aspectRatio, (aspectRatio) => {
    updateCropper(aspectRatio);
    setDirtyState(aspectRatio !== ImageAspectRatio.original);
  }));

  const updateCropper = (aspectRatio: ImageAspectRatio | number) => {
    const imageCropper = getImageCropperFromAspectRatio(
      translation()[0] + origin()[0],
      translation()[1] + origin()[1],
      aspectRatio,
      props.surface.element.offsetWidth,
      props.surface.element.offsetHeight
    );
    const updatedOrigin = [
      -imageCropper.width / 2 * window.devicePixelRatio,
      -imageCropper.height / 2 * window.devicePixelRatio
    ] as [number, number];
    const updatedTranslation = [
      props.surface.element.offsetWidth / 2 * window.devicePixelRatio,
      props.surface.element.offsetHeight / 2 * window.devicePixelRatio
    ] as [number, number];

    batch(() => {
      setTranslation(updatedTranslation);
      setOrigin(updatedOrigin);
      setImageCropper(getImageCropperFromAspectRatio(
        updatedTranslation[0] + updatedOrigin[0],
        updatedTranslation[1] + updatedOrigin[1],
        aspectRatio,
        props.surface.element.offsetWidth,
        props.surface.element.offsetHeight
      ));
    });
  }

  const onMove = (translation: [number, number]) => {
    batch(() => {
      setDirtyState(true);
      setImageCropper((currentCropper) =>
        getImageCropper(
          translation[0] + origin()[0],
          translation[1] + origin()[1],
          imageCropper().width,
          imageCropper().height,
          props.surface.element.offsetWidth,
          props.surface.element.offsetHeight,
          currentCropper.scale
        )
      );
      setTranslation(translation);
    });
  }

  const onResize = (scale: [number, number]) => {
    let newWidth = imageCropper().width * scale[0];
    let newHeight = imageCropper().height * scale[1];

    if(newWidth > props.surface.element.offsetWidth) {
      newWidth = props.surface.element.offsetWidth;
    }
    if(newHeight > props.surface.element.offsetHeight) {
      newHeight = props.surface.element.offsetHeight;
    }
    const t = translation();
    const o = origin();
    const center = [
      t[0] - o[0],
      t[1] - o[1]
    ];
    const newTranslation = [
      center[0] + o[0],
      center[1] + o[1]
    ] as [number, number];
    const newOrigin = [-newWidth / 2, -newHeight / 2] as [number, number];

    batch(() => {
      setDirtyState(true);
      setImageCropper(currentCropper =>
        getImageCropper(
          newTranslation[0] + newOrigin[0],
          newTranslation[1] + newOrigin[1],
          newWidth,
          newHeight,
          props.surface.element.offsetWidth,
          props.surface.element.offsetHeight,
          currentCropper.scale
        )
      );
      setScale([1, 1]);
      setTranslation(newTranslation);
      setOrigin(newOrigin);
    });
  }

  const handleSave = () => {
    if(isDirty()) {
      const cropper = imageCropper();
      const scale = [
        props.imageState.resultWidth / cropper.surfaceWidth,
        props.imageState.resultHeight / cropper.surfaceHeight
      ];
      props.onImageChange({
        type: ImageChangeType.crop,
        x: props.imageState.resultX + cropper.x,
        y: props.imageState.resultY + cropper.y,
        width: cropper.width * scale[0],
        height: cropper.height * scale[1]
      });
      setDirtyState(false);
    } else {
      props.onSaveClick();
    }
  };

  return (
    <>
      <div class="image-cropper">
        <Draggable
          class="image-cropper-wrapper"
          surface={props.surface}
          active={true}
          movable={true}
          resizable={true}
          rotatable={false}
          removable={false}
          translation={translation()}
          scale={scale()}
          rotation={0}
          origin={origin()}
          onMove={onMove}
          onResize={onResize}
        >
          <div class="image-cropper" style={imageCropper().styles}>
            <For each={imageCropper().rows}>
              {(row) => <div class="image-cropper--row" style={row.styles}></div>}
            </For>
            <For each={imageCropper().columns}>
              {(column) => <div class="image-cropper--column" style={column.styles}></div>}
            </For>
          </div>
        </Draggable>
        <div class="image-cropper-cover cover-top"
          style={imageCropper().covers.top.styles}>
        </div>
        <div class="image-cropper-cover cover-left"
          style={imageCropper().covers.left.styles}>
        </div>
        <div class="image-cropper-cover cover-right"
          style={imageCropper().covers.right.styles}>
        </div>
        <div class="image-cropper-cover cover-bottom"
          style={imageCropper().covers.bottom.styles}>
        </div>
      </div>
      <Show when={!props.isMobile}>
        <div class="image-editor__save-button">
          <ButtonIconTsx
            class="btn-circle btn-corner"
            icon="check"
            onClick={handleSave}
          />
        </div>
      </Show>
    </>
  );
}
