import {TextLayer, TextStyle, TextAlignment} from '../types';
import {anyColorToHexColor, anyColorToRgbaColor, Color, ColorRgba} from '../../../helpers/color';
import {measureText as measureCanvasText, getCanvas2DFontStyle} from '../helpers/canvas2dHelper';
import {ImageElementTextureSource, createImageElementTextureSource} from '../webgl/helpers/webglTexture';

export async function renderTextLayer(text: string, layer: TextLayer): Promise<ImageElementTextureSource> {
  const {width, height, fontBoundingBoxDescent} = measureCanvasText(text, layer.fontName, layer.fontSize, layer.fontWeight);
  const ratio = window.devicePixelRatio || 1;
  const canvas = new OffscreenCanvas((width + layer.padding * 2) * ratio, (height + layer.padding * 2) * ratio);
  const ctx = canvas.getContext('2d') as OffscreenCanvasRenderingContext2D;
  ctx.scale(ratio, ratio);

  const fontStyle = getCanvas2DFontStyle(layer);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if(layer.style === TextStyle.stroke) {
    ctx.beginPath();
    ctx.font = fontStyle;
    ctx.lineWidth = layer.strokeWidth;
    ctx.strokeStyle = anyColorToHexColor(layer.strokeColor);
    ctx.strokeText(text, 0, height - layer.strokeWidth);
    ctx.fillStyle = anyColorToHexColor(layer.color);
    ctx.fillText(text, 0, height - layer.strokeWidth);
    ctx.stroke();
    ctx.fill();
  } else if(layer.style === TextStyle.default) {
    ctx.beginPath();
    ctx.font = fontStyle;
    ctx.fillStyle = anyColorToHexColor(layer.color);
    ctx.fillText(text, 0, height);
    ctx.fill();
  } else if(layer.style === TextStyle.fill_background) {
    ctx.beginPath();
    ctx.font = fontStyle;
    ctx.fillStyle = anyColorToHexColor(layer.color);
    ctx.roundRect(
      0,
      0,
      width + layer.padding * 2,
      height + layer.padding * 2,
      layer.borderRadius);
    ctx.fill();
    ctx.fillStyle = anyColorToHexColor(layer.secondColor);
    ctx.fillText(text, layer.padding, height + layer.padding - fontBoundingBoxDescent);
  }

  return createImageElementTextureSource(canvas);
}

// export async function renderTextMultiline(text: string, layer: TextLayer): Promise<ImageElementTextureSource> {}

export function getTextLayerInputElementStyles(text: string, layer: TextLayer, placeholder: string = '') {
  const {width, height} = measureCanvasText(text || placeholder, layer.fontName, layer.fontSize, layer.fontWeight, layer.style === TextStyle.stroke ? layer.strokeWidth : 0);

  const baseStyle = {
    'border': 'none',
    'outline': 'none',
    'width': `${width}px`,
    'height': `${height}px`,
    'font-family': layer.fontName,
    'font-size': `${layer.fontSize}px`,
    'font-weight': `${layer.fontWeight}`,
    'line-height': `${layer.fontSize}px`,
    'text-align': layer.alignment,
    'box-sizing': 'content-box',
    'padding': `${layer.padding}px`
  };

  if(layer.style === TextStyle.default) {
    return {
      ...baseStyle,
      color: anyColorToHexColor(layer.color)
    }
  }

  if(layer.style === TextStyle.stroke) {
    return {
      ...baseStyle,
      'paint-order': 'stroke fill',
      '-webkit-text-stroke': `${layer.strokeWidth}px ${anyColorToHexColor(layer.strokeColor)}`,
      'color': anyColorToHexColor(layer.color)
    }
  }

  if(layer.style === TextStyle.fill_background) {
    return {
      ...baseStyle,
      'color': anyColorToHexColor(layer.secondColor),
      'background-color': anyColorToHexColor(layer.color),
      'border-radius': `${layer.borderRadius}px`
    };
  }

  // We should not get here!
  return baseStyle;
};

export interface StyledTextRow {
  text: string;
  width: number;
  height: number;
  styles: Record<string, string>;
  leftJoin?: Record<string, string>;
  rightJoin?: Record<string, string>;
}
export interface StyledTextAreaStyles {
  textareaWrapper: Record<string, string>,
  textarea: Record<string, string>,
  textareaBackground: Record<string, string>,
  rowWrapper: Record<string, string>,
  rows: StyledTextRow[];
}
export function getTextLayerTextareaElementStyles(text: string, layer: TextLayer, placeholder: string = ''): StyledTextAreaStyles {
  let boxWidth = 0;
  let boxHeight = 0;
  const rows: StyledTextRow[] = [];

  for(const rowText of (text || placeholder).split('\n')) {
    const {width, height} = measureCanvasText(rowText, layer.fontName, layer.fontSize, layer.fontWeight, layer.style === TextStyle.stroke ? layer.strokeWidth : 0);
    boxWidth = Math.max(width, boxWidth);
    boxHeight += height;

    rows.push({
      text: rowText,
      width,
      height,
      styles: {} as Record<string, string>
    });
  }

  const baseTextareaStyle = {
    'border': 'none',
    'outline': 'none',
    'background': 'none',
    'resize': 'none',
    'width': `${boxWidth}px`,
    'height': `${boxHeight}px`,
    'font-family': layer.fontName,
    'font-size': `${layer.fontSize}px`,
    'font-weight': `${layer.fontWeight}`,
    'line-height': `${layer.fontSize}px`,
    'text-align': layer.alignment,
    'box-sizing': 'content-box'
  };

  if(layer.style === TextStyle.default) {
    return {
      textareaWrapper: {},
      textarea: {
        ...baseTextareaStyle,
        color: anyColorToHexColor(layer.color)
      },
      textareaBackground: {},
      rowWrapper: {},
      rows
    }
  }

  if(layer.style === TextStyle.stroke) {
    return {
      textareaWrapper: {},
      textarea: {
        ...baseTextareaStyle,
        'paint-order': 'stroke fill',
        '-webkit-text-stroke': `${layer.strokeWidth}px ${anyColorToHexColor(layer.strokeColor)}`,
        'color': anyColorToHexColor(layer.color)
      },
      textareaBackground: {},
      rowWrapper: {},
      rows
    }
  }

  if(layer.style === TextStyle.fill_background) {
    boxWidth += layer.padding * 2;
    boxHeight + layer.padding * 2 * rows.length;

    const textareaBackgroundPadding = layer.alignment === TextAlignment.left ?
      '' :
      layer.alignment === TextAlignment.center ?
      `0 ${layer.padding}px` :
      `0 ${layer.padding * 2}px`

    return {
      textareaWrapper: {
        'position': 'relative',
        'top': '0',
        'left': '0',
        'width': `${boxWidth}px`,
        'height': `${boxHeight}px`
      },
      textarea: {
        ...baseTextareaStyle,
        'position': 'absolute',
        'top': '0',
        'left': '0',
        'z-index': '1',
        'width': `${boxWidth}px`,
        'height': `${boxHeight}px`,
        'color': anyColorToHexColor(layer.secondColor),
        'padding': `${layer.padding}px`,
        'line-height': `${layer.fontSize}px`
      },
      textareaBackground: {
        'width': `${boxWidth}px`,
        'height': `${boxHeight}px`,
        'position': 'absolute',
        'padding': textareaBackgroundPadding,
        'top': '0',
        'left': '0',
        'color': 'transparent',
        'font-family': layer.fontName,
        'font-size': `${layer.fontSize}px`,
        'font-weight': `${layer.fontWeight}`,
        'line-height': `${layer.fontSize - layer.padding}px`,
        'display': 'flex',
        'flex-direction': 'column',
        'align-items': layer.alignment === TextAlignment.center ?
          'center' :
          layer.alignment === TextAlignment.left ?
          'flex-start' :
          'flex-end',
        'box-sizing': 'content-box'
      },
      rowWrapper: {
        'display': 'flex'
      },
      rows: rows.map((row, index) => {
        const rowStyles = getTextRowStyles(rows, index, layer);

        return {
          ...row,
          ...rowStyles
        };
      })
    }
  }

  // We should not get here!
  return {
    textareaWrapper: {},
    textarea: baseTextareaStyle,
    textareaBackground: {},
    rowWrapper: {},
    rows
  };
}

export function getTextRowStyles(rows: StyledTextRow[], index: number, layer: TextLayer) {
  const row = rows[index];
  const borderRadiusStyles = getTextRowBorderStyles(rows, index, layer);
  const paddingStyles = getTextRowPadding(rows, index, layer);

  return {
    styles: {
      'margin-top': '-1px',
      'line-height': `${layer.fontSize}px`,
      'background-color': anyColorToHexColor(layer.color),
      'width': `${row.width}px`,
      'height': `${layer.fontSize}px`,
      ...paddingStyles,
      ...borderRadiusStyles
    }
    // ...getTextRowJoinStyles(rows, index, layer)
  }
};

export function getTextRowPadding(rows: StyledTextRow[], index: number, layer: TextLayer) {
  const paddingValue = `${layer.padding}px`;
  const halfPaddingValue = `${layer.padding / 2}px`
  const isFirstRow = index === 0;
  const isLastRow = index === rows.length - 1;

  if(isFirstRow) {
    if(isLastRow) {
      return {
        'padding-top': paddingValue,
        'padding-left': paddingValue,
        'padding-right': paddingValue,
        'padding-bottom': paddingValue
      };
    }

    return {
      'padding-top': paddingValue,
      'padding-left': paddingValue,
      'padding-right': paddingValue,
      'padding-bottom': '0px'
    };
  }

  if(isLastRow) {
    return {
      'padding-top': '0px',
      'padding-left': paddingValue,
      'padding-right': paddingValue,
      'padding-bottom': paddingValue
    };
  }

  return {
    'padding-top': halfPaddingValue,
    'padding-left': paddingValue,
    'padding-right': paddingValue,
    'padding-bottom': halfPaddingValue
  };
}

export function getTextRowBorderStyles(rows: StyledTextRow[], index: number, layer: TextLayer) {
  const borderValue = `${layer.borderRadius}px`;
  const isFirstRow = index === 0;
  const isLastRow = index === rows.length - 1;
  const prevRow = isFirstRow ? undefined : rows[index - 1];
  const row = rows[index];
  const nextRow = isLastRow ? undefined : rows[index + 1];

  if(layer.alignment === TextAlignment.left) {
    if(isFirstRow) {
      const bottomLeftRadius = isLastRow ?  borderValue : '';
      const bottomRightRadius = isLastRow || nextRow.width < row.width ? borderValue : '';

      return {
        'border-top-left-radius': borderValue,
        'border-top-right-radius': borderValue,
        'border-bottom-left-radius': bottomLeftRadius,
        'border-bottom-right-radius': bottomRightRadius
      };
    }

    if(isLastRow) {
      const topRightRadius = prevRow.width > row.width ?
        '' :
        borderValue;

      return {
        'border-top-left-radius': '',
        'border-top-right-radius': topRightRadius,
        'border-bottom-left-radius': borderValue,
        'border-bottom-right-radius': borderValue
      };
    }

    const borderTopRightRadius = prevRow.width > row.width ? '' : borderValue;
    const borderBottomRightRadius = nextRow.width > row.width ? '' : borderValue;

    return {
      'border-top-left-radius': '',
      'border-top-right-radius': borderTopRightRadius,
      'border-bottom-left-radius': '',
      'border-bottom-right-radius': borderBottomRightRadius
    };
  }

  if(layer.alignment === TextAlignment.center) {
    if(isFirstRow) {
      const bottomBottomRadius = isLastRow || nextRow.width < row.width ?  borderValue : '';

      return {
        'border-top-left-radius': borderValue,
        'border-top-right-radius': borderValue,
        'border-bottom-left-radius': bottomBottomRadius,
        'border-bottom-right-radius': bottomBottomRadius
      };
    }

    if(isLastRow) {
      const topRadius = prevRow.width > row.width ?
        '' :
        borderValue;

      return {
        'border-top-left-radius': topRadius,
        'border-top-right-radius': topRadius,
        'border-bottom-left-radius': borderValue,
        'border-bottom-right-radius': borderValue
      };
    }

    const borderTopRadius = prevRow.width > row.width ? '' : borderValue;
    const borderBottomRadius = nextRow.width > row.width ? '' : borderValue;

    return {
      'border-top-left-radius': borderTopRadius,
      'border-top-right-radius': borderTopRadius,
      'border-bottom-left-radius': borderBottomRadius,
      'border-bottom-right-radius': borderBottomRadius
    };
  }

  if(layer.alignment === TextAlignment.right) {
    if(isFirstRow) {
      const borderLeftBottomRadius = isLastRow || nextRow.width < row.width ?  borderValue : '';
      const borderRightBottomRadius = isLastRow ? borderValue : '';

      return {
        'border-top-left-radius': borderValue,
        'border-top-right-radius': borderValue,
        'border-bottom-left-radius': borderLeftBottomRadius,
        'border-bottom-right-radius': borderRightBottomRadius
      };
    }

    if(isLastRow) {
      const topRadius = prevRow.width > row.width ?
        '' :
        borderValue;

      return {
        'border-top-left-radius': topRadius,
        'border-top-right-radius': '',
        'border-bottom-left-radius': borderValue,
        'border-bottom-right-radius': borderValue
      };
    }

    const borderTopLeftRadius = prevRow.width > row.width ? '' : borderValue;
    const borderBottomLeftRadius = nextRow.width > row.width ? '' : borderValue;

    return {
      'border-top-left-radius': borderTopLeftRadius,
      'border-top-right-radius': '',
      'border-bottom-left-radius': borderBottomLeftRadius,
      'border-bottom-right-radius': ''
    };
  }

  return {};
}

export function getTextRowJoinStyles(rows: StyledTextRow[], index: number, layer: TextLayer) {
  const leftJoinType = getJoinType(rows, index, layer, JoinSide.left);
  const rightJoinType = getJoinType(rows, index, layer, JoinSide.right);

  return {
    leftJoin: getJoinStyles(rows, index, layer, leftJoinType),
    rightJoin: getJoinStyles(rows, index, layer, rightJoinType)
  };
}

export enum JoinType {
  none = 'none',
  rightFull = 'rightFull',
  leftFull = 'leftFull',
  rightTop = 'rightTop',
  rightBottom = 'rightBottom',
  leftTop = 'leftTop',
  leftBottom = 'leftBottom'
}
export enum JoinSide {
  left = 'left',
  right = 'right'
}
export function getJoinType(rows: StyledTextRow[], index: number, layer: TextLayer, side: JoinSide): JoinType {
  const isFirstRow = index === 0;
  const isLastRow = index === rows.length - 1;
  const prevRow = isFirstRow ? undefined : rows[index - 1];
  const row = rows[index];
  const nextRow = isLastRow ? undefined : rows[index + 1];

  if(isFirstRow) {
    return JoinType.none;
  }

  if(isLastRow) {
    return JoinType.none;
  }

  if(layer.alignment === TextAlignment.left) {
    if(side === JoinSide.left) {
      return JoinType.none;
    }

    if(row.width < prevRow.width && row.width < nextRow.width) {
      return JoinType.rightFull;
    }

    if(row.width < prevRow.width && row.width > nextRow.width) {
      return JoinType.rightTop;
    }

    if(row.width > prevRow.width && row.width < nextRow.width) {
      return JoinType.rightBottom;
    }

    return JoinType.none;
  }

  if(layer.alignment === TextAlignment.right) {
    if(side === JoinSide.right) {
      return JoinType.none;
    }

    if(row.width < prevRow.width && row.width < nextRow.width) {
      return JoinType.leftFull;
    }

    if(row.width < prevRow.width && row.width > nextRow.width) {
      return JoinType.leftTop;
    }

    if(row.width > prevRow.width && row.width < nextRow.width) {
      return JoinType.leftBottom;
    }

    return JoinType.none;
  }

  if(layer.alignment = TextAlignment.center) {
    if(side === JoinSide.right) {
      if(row.width < prevRow.width && row.width < nextRow.width) {
        return JoinType.rightFull;
      }

      if(row.width < prevRow.width && row.width > nextRow.width) {
        return JoinType.rightTop;
      }

      if(row.width > prevRow.width && row.width < nextRow.width) {
        return JoinType.rightBottom;
      }
    }

    if(row.width < prevRow.width && row.width < nextRow.width) {
      return JoinType.leftFull;
    }

    if(row.width < prevRow.width && row.width > nextRow.width) {
      return JoinType.leftTop;
    }

    if(row.width > prevRow.width && row.width < nextRow.width) {
      return JoinType.leftBottom;
    }
  }

  return JoinType.none;
}

export function getJoinStyles(rows: StyledTextRow[], index: number, layer: TextLayer, type: JoinType) {
  const [r, g, b, a] = anyColorToRgbaColor(layer.color);
  const row = rows[index];
  const size = row.height + layer.padding;

  switch(type) {
    case JoinType.none: return undefined;
    case JoinType.rightFull: return {
      'margin': '-1px',
      'width': `${size}px`,
      'height': `${size}px`,
      'background-image': `radial-gradient(circle at ${size * 0.75}px ${size * 0.5}px, rgba(${r},${g},${b},0) 0%, rgba(${r},${g},${b},0) 70%, rgba(${r},${g},${b},1) 50%, rgba(${r},${g},${b},1) 100%)`
    };
    case JoinType.rightTop: return {
      'margin': '-1px',
      'width': `${size}px`,
      'height': `${size}px`,
      'background-image': `radial-gradient(circle at ${size}px ${size}px, rgba(${r},${g},${b},0) 0%, rgba(${r},${g},${b},0) 70%, rgba(${r},${g},${b},1) 50%, rgba(${r},${g},${b},1) 100%)`
    };
    case JoinType.rightBottom: return {
      'margin': '-1px',
      'width': `${size}px`,
      'height': `${size}px`,
      'background-image': `radial-gradient(circle at ${size}px 0px, rgba(${r},${g},${b},0) 0%, rgba(${r},${g},${b},0) 70%, rgba(${r},${g},${b},1) 50%, rgba(${r},${g},${b},1) 100%)`
    };
    case JoinType.leftFull: return {
      'margin': '-1px',
      'width': `${size}px`,
      'height': `${size}px`,
      'background-image': `radial-gradient(circle at ${size * 0.25}px ${size * 0.5}px, rgba(${r},${g},${b},0) 0%, rgba(${r},${g},${b},0) 70%, rgba(${r},${g},${b},1) 50%, rgba(${r},${g},${b},1) 100%)`
    };
    case JoinType.leftTop: return {
      'margin': '-1px',
      'width': `${size}px`,
      'height': `${size}px`,
      'background-image': `radial-gradient(circle at 0px ${size}px, rgba(${r},${g},${b},0) 0%, rgba(${r},${g},${b},0) 70%, rgba(${r},${g},${b},1) 50%, rgba(${r},${g},${b},1) 100%)`
    };
    case JoinType.leftBottom: return {
      'margin': '-1px',
      'width': `${size}px`,
      'height': `${size}px`,
      'background-image': `radial-gradient(circle at 0px 0px, rgba(${r},${g},${b},0) 0%, rgba(${r},${g},${b},0) 70%, rgba(${r},${g},${b},1) 50%, rgba(${r},${g},${b},1) 100%)`
    };
  }
}
