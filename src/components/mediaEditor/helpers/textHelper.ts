import {TextLayer, TextStyle, TextAlignment} from '../types';
import {anyColorToHexColor, anyColorToRgbaColor, Color, ColorRgba} from '../../../helpers/color';
import {measureText as measureCanvasText, TextMeasurements, getCanvas2DFontStyle} from '../helpers/canvas2dHelper';
import {ImageElementTextureSource, createImageElementTextureSource} from '../webgl/helpers/webglTexture';

// ---------------------------------  1 line text rendering utils -------------------------------------------------------
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

// ---------------------------------  multiline text rendering utils -------------------------------------------------------
export interface TextBox {
  width: number;
  height: number;
  rows: TextRow[];
  styles?: StyledTextAreaStyles;
}

export interface TextRow {
  text: string;
  width: number;
  height: number;
  mesurement: TextMeasurements;
  styles?: Record<string, string>;
  leftTopJoin?: Record<string, string>;
  leftBottomJoin?: Record<string, string>;
  rightTopJoin?: Record<string, string>;
  rightBottomJoin?: Record<string, string>;
}

export interface StyledTextAreaStyles {
  textareaWrapper: Record<string, string>,
  textarea: Record<string, string>,
  textareaBackground: Record<string, string>,
  rowWrapper: Record<string, string>,
}

export async function renderTextLayerMultiline(text: string, layer: TextLayer, ratio = window.devicePixelRatio || 1): Promise<ImageElementTextureSource> {
  const textBox = getTextBox(text, layer);
  const fontStyle = getCanvas2DFontStyle(layer);
  const canvas = new OffscreenCanvas(
    textBox.width * ratio,
    textBox.height * ratio
  );
  const ctx = canvas.getContext('2d') as OffscreenCanvasRenderingContext2D;
  ctx.scale(ratio, ratio);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  let currentHeightOffset = 0;
  for(let i = 0; i < textBox.rows.length; i++) {
    const row = textBox.rows[i];
    const {text, width, height} = row;
    const padding = getTextRowPadding(textBox.rows, i, layer);
    const margin = getTextRowMargin(textBox, textBox.rows, i, layer);
    const borderRadius = getTextRowBorderRadius(textBox.rows, i, layer);
    const fontBoundingBoxDescent = row.mesurement.fontBoundingBoxDescent || row.mesurement.actualBoundingBoxDescent;

    if(layer.style === TextStyle.stroke) {
      ctx.beginPath();
      ctx.font = fontStyle;
      ctx.lineWidth = layer.strokeWidth;
      ctx.strokeStyle = anyColorToHexColor(layer.strokeColor);
      ctx.strokeText(
        text,
        margin.left + layer.strokeWidth,
        margin.top + currentHeightOffset + height - layer.strokeWidth
      );
      ctx.fillStyle = anyColorToHexColor(layer.color);
      ctx.fillText(
        text,
        margin.left + layer.strokeWidth,
        margin.top + currentHeightOffset + height - layer.strokeWidth
      );
      ctx.stroke();
      ctx.fill();
    } else if(layer.style === TextStyle.default) {
      ctx.beginPath();
      ctx.font = fontStyle;
      ctx.fillStyle = anyColorToHexColor(layer.color);
      ctx.fillText(text, margin.left, margin.top + currentHeightOffset + height);
      ctx.fill();
    } else if(layer.style === TextStyle.fill_background) {
      ctx.beginPath();
      ctx.font = fontStyle;
      ctx.fillStyle = anyColorToHexColor(layer.color);
      ctx.roundRect(
        margin.left,
        currentHeightOffset,
        width + padding.left + padding.right,
        height + padding.bottom + padding.top,
        [borderRadius.topLeft, borderRadius.topRight, borderRadius.bottomRight, borderRadius.bottomLeft]
      );
      ctx.fill();
      ctx.fillStyle = anyColorToHexColor(layer.secondColor);
      ctx.fillText(
        text,
        margin.left + padding.left,
        margin.top + currentHeightOffset + height + padding.top - fontBoundingBoxDescent
      );
    }

    currentHeightOffset += height + padding.bottom + padding.top;
  }

  return createImageElementTextureSource(canvas);
}

export function getTextLayerTextareaElementStyles(text: string, layer: TextLayer, placeholder: string = ''): TextBox {
  const textbox = getTextBox(text, layer, placeholder);
  const baseTextareaStyle = {
    'border': 'none',
    'outline': 'none',
    'background': 'none',
    'resize': 'none',
    'padding': '0',
    'overflow': 'hidden',
    'box-sizing': 'content-box',
    'width': `${textbox.width}px`,
    'height': `${textbox.height}px`,
    'font-family': layer.fontName,
    'font-size': `${layer.fontSize}px`,
    'font-weight': `${layer.fontWeight}`,
    'line-height': `${layer.fontSize}px`,
    'text-align': layer.alignment
  };

  if(layer.style === TextStyle.default) {
    return {
      ...textbox,
      styles: {
        textareaWrapper: {
          'height': `${textbox.height}px`
        },
        textarea: {
          ...baseTextareaStyle,
          color: anyColorToHexColor(layer.color)
        },
        textareaBackground: {},
        rowWrapper: {}
      }
    };
  }

  if(layer.style === TextStyle.stroke) {
    const textareaMargin = layer.alignment === TextAlignment.right ?
      `0 0 0 -${layer.padding}px` :
      layer.alignment === TextAlignment.left ?
      `0 0 0 ${layer.padding}px` :
      '';

    return {
      ...textbox,
      styles: {
        textareaWrapper: {
          'height': `${textbox.height}px`
        },
        textarea: {
          ...baseTextareaStyle,
          'margin': textareaMargin,
          'paint-order': 'stroke fill',
          '-webkit-text-stroke': `${layer.strokeWidth}px ${anyColorToHexColor(layer.strokeColor)}`,
          'color': anyColorToHexColor(layer.color)
        },
        textareaBackground: {},
        rowWrapper: {}
      }
    }
  }

  if(layer.style === TextStyle.fill_background) {
    const textareaMargin = layer.alignment === TextAlignment.right ?
      `0 0 0 -${layer.padding}px` :
      layer.alignment === TextAlignment.left ?
      `0 0 0 ${layer.padding}px` :
      '';

    return {
      ...textbox,
      rows: textbox.rows.map((row, index) => {
        const rowStyles = getTextRowStyles(textbox, textbox.rows, index, layer);

        return {
          ...row,
          ...rowStyles
        };
      }),
      styles: {
        textareaWrapper: {
          'position': 'relative',
          'top': '0',
          'left': '0',
          'width': `${textbox.width}px`,
          'height': `${textbox.height}px`
        },
        textarea: {
          ...baseTextareaStyle,
          'position': 'absolute',
          'top': '0',
          'left': '0',
          'z-index': '1',
          'margin': textareaMargin,
          'width': `${textbox.width}px`,
          'height': `${textbox.height}px`,
          'color': anyColorToHexColor(layer.secondColor),
          'line-height': `${textbox.rows[0].height + layer.padding}px`
        },
        textareaBackground: {
          'width': `${textbox.width}px`,
          'height': `${textbox.height}px`,
          'position': 'absolute',
          'top': '0',
          'left': '0',
          'color': 'transparent',
          'font-family': layer.fontName,
          'font-size': `${layer.fontSize}px`,
          'font-weight': `${layer.fontWeight}`,
          'line-height': `${layer.fontSize - layer.padding}px`,
          'box-sizing': 'content-box'
        },
        rowWrapper: {
          'display': 'flex'
        }
      }
    }
  }

  // We should not get here!
  return {
    ...textbox,
    styles: {
      textareaWrapper: {},
      textarea: baseTextareaStyle,
      textareaBackground: {},
      rowWrapper: {}
    }
  };
}

export function getTextBox(text: string, layer: TextLayer, placeholder: string = ''): TextBox {
  let boxWidth = 0;
  let boxHeight = 0;
  const rows: TextRow[] = [];

  for(const rowText of (text || placeholder).split('\n')) {
    const mesurement = measureCanvasText(rowText || '|', layer.fontName, layer.fontSize, layer.fontWeight, layer.style === TextStyle.stroke ? layer.strokeWidth : 0);
    boxWidth = Math.max(mesurement.width, boxWidth);
    boxHeight += mesurement.maxHeight;

    rows.push({
      text: rowText,
      width: mesurement.width,
      height: mesurement.maxHeight,
      mesurement,
      styles: {} as Record<string, string>
    });
  }

  if(layer.style === TextStyle.fill_background) {
    boxWidth += layer.padding * 2;
    boxHeight += rows.length * layer.padding;
  }

  return {
    width: boxWidth,
    height: boxHeight,
    rows
  };
}

export function getTextRowStyles(box: TextBox, rows: TextRow[], index: number, layer: TextLayer) {
  const row = rows[index];
  const marginStyles = getTextRowMarginStyles(box, rows, index, layer);
  const borderRadiusStyles = getTextRowBorderRadiusStyles(rows, index, layer);
  const paddingStyles = getTextRowPaddingStyles(rows, index, layer);
  const color = anyColorToHexColor(layer.color);

  return {
    styles: {
      'position': 'relative',
      'line-height': `${layer.fontSize}px`,
      'background-color': color,
      'width': `${row.width}px`,
      'height': `${row.height}px`,
      ...marginStyles,
      ...paddingStyles,
      ...borderRadiusStyles
    },
    ...getTextRowJoinStyles(rows, index, layer)
  }
};

export function getTextRowMargin(box: TextBox, rows: TextRow[], index: number, layer: TextLayer) {
  const boxWidth = box.width;
  const row = rows[index];
  const padding = layer.style === TextStyle.fill_background ? layer.padding : 0;

  if(layer.alignment === TextAlignment.left) {
    return {
      top: 0,
      left: 0,
      right: 0,
      bottom: 0
    };
  }

  if(layer.alignment === TextAlignment.right) {
    const emptySpace = boxWidth - row.width - padding * 2;

    return {
      top: 0,
      left: emptySpace,
      right: 0,
      bottom: 0
    };
  }

  if(layer.alignment === TextAlignment.center) {
    const emptySpace = (boxWidth - row.width - padding * 2) / 2;

    return {
      top: 0,
      left: emptySpace,
      right: emptySpace,
      bottom: 0
    };
  }

  return {
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  };
}

export function getTextRowMarginStyles(box: TextBox, rows: TextRow[], index: number, layer: TextLayer) {
  const margin = getTextRowMargin(box, rows, index, layer);

  return {
    'margin-top': `${margin.top}px`,
    'margin-left': `${margin.left}px`,
    'margin-right': `${margin.right}px`,
    'margin-bottom': `${margin.bottom}px`
  };
}

export function getTextRowPadding(rows: TextRow[], index: number, layer: TextLayer) {
  if(layer.style !== TextStyle.fill_background) {
    return {
      top: 0,
      left: 0,
      right: 0,
      bottom: 0
    };
  }

  const paddingValue = layer.padding;
  const halfPaddingValue = layer.padding / 2;
  const isFirstRow = index === 0;
  const isLastRow = index === rows.length - 1;

  if(isFirstRow) {
    if(isLastRow) {
      return {
        top: halfPaddingValue,
        left: paddingValue,
        right: paddingValue,
        bottom: halfPaddingValue
      };
    }

    return {
      top: halfPaddingValue,
      left: paddingValue,
      right: paddingValue,
      bottom: halfPaddingValue
    };
  }

  if(isLastRow) {
    return {
      top: halfPaddingValue,
      left: paddingValue,
      right: paddingValue,
      bottom: halfPaddingValue
    };
  }

  return {
    top: halfPaddingValue,
    left: paddingValue,
    right: paddingValue,
    bottom: halfPaddingValue
  };
}

export function getTextRowPaddingStyles(rows: TextRow[], index: number, layer: TextLayer) {
  const padding = getTextRowPadding(rows, index, layer);

  return {
    'padding-top': `${padding.top}px`,
    'padding-left': `${padding.left}px`,
    'padding-right': `${padding.right}px`,
    'padding-bottom': `${padding.bottom}px`
  };
}

export function getTextRowBorderRadius(rows: TextRow[], index: number, layer: TextLayer) {
  if(layer.style !== TextStyle.fill_background) {
    return {
      topLeft: 0,
      topRight: 0,
      bottomLeft: 0,
      bottomRight: 0
    };
  }

  const borderValue = layer.borderRadius;
  const isFirstRow = index === 0;
  const isLastRow = index === rows.length - 1;
  const prevRow = isFirstRow ? undefined : rows[index - 1];
  const row = rows[index];
  const nextRow = isLastRow ? undefined : rows[index + 1];

  if(layer.alignment === TextAlignment.left) {
    if(isFirstRow) {
      const bottomLeftRadius = isLastRow ?  borderValue : 0;
      const bottomRightRadius = isLastRow || nextRow.width < row.width ? borderValue : 0;

      return {
        topLeft: borderValue,
        topRight: borderValue,
        bottomLeft: bottomLeftRadius,
        bottomRight: bottomRightRadius
      };
    }

    if(isLastRow) {
      const topRightRadius = prevRow.width > row.width ?
        0 :
        borderValue;

      return {
        topLeft: 0,
        topRight: topRightRadius,
        bottomLeft: borderValue,
        bottomRight: borderValue
      };
    }

    const borderTopRightRadius = prevRow.width > row.width ? 0 : borderValue;
    const borderBottomRightRadius = nextRow.width > row.width ? 0 : borderValue;

    return {
      topLeft: 0,
      topRight: borderTopRightRadius,
      bottomLeft: 0,
      bottomRight: borderBottomRightRadius
    };
  }

  if(layer.alignment === TextAlignment.center) {
    if(isFirstRow) {
      const bottomBottomRadius = isLastRow || nextRow.width < row.width ?  borderValue : 0;

      return {
        topLeft: borderValue,
        topRight: borderValue,
        bottomLeft: bottomBottomRadius,
        bottomRight: bottomBottomRadius
      };
    }

    if(isLastRow) {
      const topRadius = prevRow.width > row.width ?
        0 :
        borderValue;

      return {
        topLeft: topRadius,
        topRight: topRadius,
        bottomLeft: borderValue,
        bottomRight: borderValue
      };
    }

    const borderTopRadius = prevRow.width > row.width ? 0 : borderValue;
    const borderBottomRadius = nextRow.width > row.width ? 0 : borderValue;

    return {
      topLeft: borderTopRadius,
      topRight: borderTopRadius,
      bottomLeft: borderBottomRadius,
      bottomRight: borderBottomRadius
    };
  }

  if(layer.alignment === TextAlignment.right) {
    if(isFirstRow) {
      const borderLeftBottomRadius = isLastRow || nextRow.width < row.width ?  borderValue : 0;
      const borderRightBottomRadius = isLastRow ? borderValue : 0;

      return {
        topLeft: borderValue,
        topRight: borderValue,
        bottomLeft: borderLeftBottomRadius,
        bottomRight: borderRightBottomRadius
      };
    }

    if(isLastRow) {
      const topRadius = prevRow.width > row.width ?
        0 :
        borderValue;

      return {
        topLeft: topRadius,
        topRight: 0,
        bottomLeft: borderValue,
        bottomRight: borderValue
      };
    }

    const borderTopLeftRadius = prevRow.width > row.width ? 0 : borderValue;
    const borderBottomLeftRadius = nextRow.width > row.width ? 0 : borderValue;

    return {
      topLeft: borderTopLeftRadius,
      topRight: 0,
      bottomLeft: borderBottomLeftRadius,
      bottomRight: 0
    };
  }

  return {
    topLeft: 0,
    topRight: 0,
    bottomLeft: 0,
    bottomRight: 0
  };
}

export function getTextRowBorderRadiusStyles(rows: TextRow[], index: number, layer: TextLayer) {
  const values = getTextRowBorderRadius(rows, index, layer);

  return {
    'border-top-left-radius': `${values.topLeft}px`,
    'border-top-right-radius': `${values.topRight}px`,
    'border-bottom-left-radius': `${values.bottomLeft}px`,
    'border-bottom-right-radius': `${values.bottomRight}px`
  };
}

export enum JoinType {
  rightTop = 'rightTop',
  rightBottom = 'rightBottom',
  leftTop = 'leftTop',
  leftBottom = 'leftBottom'
}

export function getTextRowJoinStyles(rows: TextRow[], index: number, layer: TextLayer) {
  const hasLeftTopJoin = hasJoin(rows, index, layer, JoinType.leftTop);
  const hasLeftBottomJoin = hasJoin(rows, index, layer, JoinType.leftBottom);
  const hasRightTopJoin = hasJoin(rows, index, layer, JoinType.rightTop);
  const hasRightBottomJoin = hasJoin(rows, index, layer, JoinType.rightBottom);

  return {
    leftTopJoin: hasLeftTopJoin ? getJoinStyles(rows, index, layer, JoinType.leftTop) : undefined,
    leftBottomJoin: hasLeftBottomJoin ? getJoinStyles(rows, index, layer, JoinType.leftBottom) : undefined,
    rightTopJoin: hasRightTopJoin ? getJoinStyles(rows, index, layer, JoinType.rightTop) : undefined,
    rightBottomJoin: hasRightBottomJoin ? getJoinStyles(rows, index, layer, JoinType.rightBottom) : undefined
  };
}

export function hasJoin(rows: TextRow[], index: number, layer: TextLayer, side: JoinType): boolean {
  const isFirstRow = index === 0;
  const isLastRow = index === rows.length - 1;
  const prevRow = isFirstRow ? undefined : rows[index - 1];
  const row = rows[index];
  const nextRow = isLastRow ? undefined : rows[index + 1];
  const radius = layer.borderRadius;

  if(layer.alignment === TextAlignment.left) {
    if(side === JoinType.rightTop) {
      return isFirstRow ? false: row.width + radius < prevRow.width;
    }

    if(side === JoinType.rightBottom) {
      return isLastRow ? false : row.width + radius < nextRow.width;
    }

    return false;
  }

  if(layer.alignment === TextAlignment.right) {
    if(side === JoinType.leftTop) {
      return isFirstRow ? false : row.width + radius < prevRow.width;
    }

    if(side === JoinType.leftBottom) {
      return isLastRow ? false : row.width + radius < nextRow.width;
    }

    return false;
  }

  if(layer.alignment = TextAlignment.center) {
    if(side === JoinType.rightTop) {
      return isFirstRow ? false : row.width + radius < prevRow.width;
    }

    if(side === JoinType.rightBottom) {
      return isLastRow ? false : row.width + radius < nextRow.width;
    }

    if(side === JoinType.leftTop) {
      return isFirstRow ? false : row.width + radius < prevRow.width;
    }

    if(side === JoinType.leftBottom) {
      return isLastRow ? false : row.width + radius < nextRow.width;
    }
  }

  return false;
}

export function getJoinStyles(rows: TextRow[], index: number, layer: TextLayer, type: JoinType) {
  const backgroundColor = anyColorToHexColor(layer.color);
  const radius = layer.borderRadius;
  // || rows[index].height / 2;

  switch(type) {
    case JoinType.rightTop: return {
      'position': 'absolute',
      'right': `-${radius}px`,
      'top': '0',
      'width': `${radius}px`,
      'height': `${radius}px`,
      'clip-path': `path('M0,0 Q${radius},0 ${radius},${radius} L${radius},0')`,
      'transform': 'rotateZ(-90deg)',
      'background-color': backgroundColor
    };
    case JoinType.rightBottom: return {
      'position': 'absolute',
      'right': `-${radius}px`,
      'bottom': '0',
      'width': `${radius}px`,
      'height': `${radius}px`,
      'clip-path': `path('M0,0 Q${radius},0 ${radius},${radius} L${radius},0')`,
      'transform': 'rotateZ(180deg)',
      'background-color': backgroundColor
    };
    case JoinType.leftTop: return {
      'position': 'absolute',
      'left': `-${radius}px`,
      'top': '0',
      'width': `${radius}px`,
      'height': `${radius}px`,
      'clip-path': `path('M0,0 Q${radius},0 ${radius},${radius} L${radius},0')`,
      'background-color': backgroundColor
    };
    case JoinType.leftBottom: return {
      'position': 'absolute',
      'left': `-${radius}px`,
      'bottom': '0',
      'width': `${radius}px`,
      'height': `${radius}px`,
      'clip-path': `path('M0,0 Q${radius},0 ${radius},${radius} L${radius},0')`,
      'transform': 'rotateZ(90deg)',
      'background-color': backgroundColor
    };
  }
}
