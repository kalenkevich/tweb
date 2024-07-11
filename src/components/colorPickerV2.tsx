import {createEffect, createSignal, For, on, onMount} from 'solid-js';
import {Color, ColorFormatType, anyColorToHexColor, anyColorToHslaColor, anyColorToHsvColor, anyColorToRgbaColor, rbgToString, hslaToString} from '../helpers/color';
import {ButtonIconTsx} from './buttonIconTsx';
import {InputState} from './inputField';
import {InputFieldTsx} from './inputFieldTsx';
import clamp from '../helpers/number/clamp';
import attachGrabListeners from '../helpers/dom/attachGrabListeners';

export interface PalleteSwitchButtonProps {
  onClick: () => void;
}
export function PalleteSwitchButton(props: PalleteSwitchButtonProps) {
  return (
    <ButtonIconTsx onClick={() => props.onClick()}>
      <div class="pallete-switch-button color-button"/>
    </ButtonIconTsx>
  )
}

export interface QuickPalleteProps {
  colors: Color[];
  onColorClick: (color: Color) => void;
  onPalleteSwitchClick: () => void;
}
export function QuickPallete(props: QuickPalleteProps) {
  return (
    <div class="color-picker-v2__quick-pallete quick-pallete">
      <For each={props.colors}>
        {(color) => (
          <ButtonIconTsx onClick={() => props.onColorClick(color)}>
            <div class="quick-pallete__color-button color-button"
              style={{'background-color': anyColorToHexColor(color)}}
            />
          </ButtonIconTsx>
        )}
      </For>
      <PalleteSwitchButton onClick={() => props.onPalleteSwitchClick()}/>
    </div>
  );
}

export interface ColorSliderProps {
  color: Color;
  onChange: (color: Color) => void;
}
export function ColorSlider(props: ColorSliderProps) {
  const [hueRef, setHueRef] = createSignal<SVGSVGElement>();
  const [hueDraggerRef, setHueDraggerRef] = createSignal<SVGSVGElement>();

  const hslaColor = () => anyColorToHslaColor(props.color);
  const [hue, setHue] = createSignal<number>(hslaColor().h);
  const [saturation, setSaturation] = createSignal<number>(hslaColor().s);
  const [lightness, setLightness] = createSignal<number>(hslaColor().l);
  const [alpha, setAlpha] = createSignal<number>(hslaColor().a);

  onMount(() => {
    attachGrabListeners(hueRef() as any, () => {
      onGrabStart();
    }, (pos) => {
      hueHandler(pos.x);
    }, () => {
      onGrabEnd();
    });

    const hueRect = hueRef().getBoundingClientRect();
    const percentHue = hslaColor().h / 360;
    const hueX = hueRect.left + hueRect.width * percentHue;
    hueHandler(hueX, false);
  });

  createEffect(on(() => props.color, (val) => {
    const hslaColor = anyColorToHslaColor(val);

    setHue(hslaColor.h);
    setSaturation(hslaColor.s);
    setLightness(hslaColor.l);
    setAlpha(hslaColor.a);

    const hueRect = hueRef().getBoundingClientRect();
    const percentHue = hslaColor.h / 360;
    const hueX = hueRect.left + hueRect.width * percentHue;

    hueHandler(hueX, false);
  }));

  const onGrabStart = () => {
    document.documentElement.style.cursor = hueDraggerRef().style.cursor = 'grabbing';
  };

  const onGrabEnd = () => {
    document.documentElement.style.cursor = hueDraggerRef().style.cursor = '';
  };

  const hueHandler = (pageX: number, update = true) => {
    const hueRect = hueRef().getBoundingClientRect();
    const eventX = clamp(pageX - hueRect.left, 0, hueRect.width);
    const percents = eventX / hueRect.width;
    const hueValue = Math.round(360 * percents);

    setHue(hueValue);

    const hsla = `hsla(${hueValue}, 100%, 50%, ${alpha()})`;

    hueDraggerRef().setAttributeNS(null, 'x', (percents * 100) + '%');
    hueDraggerRef().setAttributeNS(null, 'fill', hsla);

    if(update) {
      updatePicker();
    }
  }

  const updatePicker = () => {
    const color = getCurrentColor();

    hueDraggerRef().setAttributeNS(null, 'fill', anyColorToHexColor(color));

    props.onChange(color);
  };

  const getCurrentColor = (): Color => {
    return {
      type: ColorFormatType.hsla,
      value: {
        h: hue(),
        s: saturation(),
        l: lightness(),
        a: alpha()
      }
    };
  }

  return (
    <div class="color-picker-v2__color-slider color-sliders">
      <svg class="color-slider" viewBox="0 0 380 24" ref={(el) => setHueRef(el)}>
        <defs>
          <linearGradient id="hue-v2" x1="100%" y1="0%" x2="0%" y2="0%">
            <stop offset="0%" stop-color="#f00"></stop>
            <stop offset="16.666%" stop-color="#f0f"></stop>
            <stop offset="33.333%" stop-color="#00f"></stop>
            <stop offset="50%" stop-color="#0ff"></stop>
            <stop offset="66.666%" stop-color="#0f0"></stop>
            <stop offset="83.333%" stop-color="#ff0"></stop>
            <stop offset="100%" stop-color="#f00"></stop>
          </linearGradient>
        </defs>
        <rect rx="10" ry="10" x="0" y="3" width="380" height="20" fill="url(#hue-v2)"></rect>
        <svg class="color-slider-dragger" x="0" y="13" ref={(el) => setHueDraggerRef(el)}>
          <circle r="14" fill="inherit" stroke="#fff" stroke-width="3"></circle>
        </svg>
      </svg>
    </div>
  );
}

export interface ColorPalleteBoxProps {
  color: Color;
  onChange: (color: Color) => void;
}
export function ColorPalleteBox(props: ColorPalleteBoxProps) {
  const [boxRef, setBoxRef] = createSignal<SVGSVGElement>();
  const [boxDraggerRef, setBoxDraggerRef] = createSignal<SVGSVGElement>();
  const [saturationRef, setSaturationRef] = createSignal<SVGLinearGradientElement>();

  const hslaColor = () => anyColorToHslaColor(props.color);
  const [hue, setHue] = createSignal<number>(hslaColor().h);
  const [saturation, setSaturation] = createSignal<number>(hslaColor().s);
  const [lightness, setLightness] = createSignal<number>(hslaColor().l);
  const [alpha, setAlpha] = createSignal<number>(hslaColor().a);

  onMount(() => {
    attachGrabListeners(boxRef() as any, () => {
      onGrabStart();
    }, (pos) => {
      saturationHandler(pos.x, pos.y);
    }, () => {
      onGrabEnd();
    });

    const boxRect = boxRef().getBoundingClientRect();
    const boxX = boxRect.width / 100 * hslaColor().s;
    const percentY = 100 - (hslaColor().l / (100 - hslaColor().s / 2)) * 100;
    const boxY = boxRect.height / 100 * percentY;
    saturationHandler(boxRect.left + boxX, boxRect.top + boxY, false);
  });

  createEffect(on(() => props.color, (val) => {
    const hslaColor = anyColorToHslaColor(val);

    setHue(hslaColor.h);
    setSaturation(hslaColor.s);
    setLightness(hslaColor.l);
    setAlpha(hslaColor.a);

    saturationRef().lastElementChild.setAttributeNS(null, 'stop-color', hslaToString(hslaColor));

    const boxRect = boxRef().getBoundingClientRect();
    const boxX = boxRect.width / 100 * hslaColor.s;
    const percentY = 100 - (hslaColor.l / (100 - hslaColor.s / 2)) * 100;
    const boxY = boxRect.height / 100 * percentY;

    saturationHandler(boxRect.left + boxX, boxRect.top + boxY, false);
  }));

  const onGrabStart = () => {
    document.documentElement.style.cursor = boxDraggerRef().style.cursor = 'grabbing';
  };

  const onGrabEnd = () => {
    document.documentElement.style.cursor = boxDraggerRef().style.cursor = '';
  };

  const saturationHandler = (pageX: number, pageY: number, update = true) => {
    const boxRect = boxRef().getBoundingClientRect()
    const maxX = boxRect.width;
    const maxY = boxRect.height;

    const eventX = clamp(pageX - boxRect.left, 0, maxX);
    const eventY = clamp(pageY - boxRect.top, 0, maxY);

    const posX = eventX / maxX * 100;
    const posY = eventY / maxY * 100;

    const boxDragger = boxDraggerRef();
    const color = getCurrentColor();
    boxDragger.setAttributeNS(null, 'x', posX + '%');
    boxDragger.setAttributeNS(null, 'y', posY + '%');
    boxDraggerRef().setAttributeNS(null, 'fill', anyColorToHexColor(color));

    const saturation = clamp(posX, 0, 100);

    const lightnessX = 100 - saturation / 2;
    const lightnessY = 100 - clamp(posY, 0, 100);

    const lightness = clamp(lightnessY / 100 * lightnessX, 0, 100);

    setSaturation(saturation);
    setLightness(lightness);

    if(update) {
      updatePicker();
    }
  };

  const updatePicker = () => {
    const color = getCurrentColor();

    boxDraggerRef().setAttributeNS(null, 'fill', anyColorToHexColor(color));

    props.onChange(color);
  };

  const getCurrentColor = (): Color => {
    return {
      type: ColorFormatType.hsla,
      value: {
        h: hue(),
        s: saturation(),
        l: lightness(),
        a: alpha()
      }
    };
  }

  return (
    <div class="color-picker-v2__color-pallete color-pallete">
      <svg class="color-picker-v2-pallete-box" viewBox="0 0 200 120" ref={(el) => setBoxRef(el)}>
        <defs>
          <linearGradient id="color-picker-saturation-v2" x1="0%" y1="0%" x2="100%" y2="0%" ref={(el) => setSaturationRef(el)}>
            <stop offset="0%" stop-color="#fff"></stop>
            <stop offset="100%" stop-color="hsl(0,100%,50%)"></stop>
          </linearGradient>
          <linearGradient id="color-picker-brightness-v2" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="rgba(0,0,0,0)"></stop>
            <stop offset="100%" stop-color="#000"></stop>
          </linearGradient>
          <pattern id="color-picker-pattern-v2" width="100%" height="100%">
            <rect x="0" y="0" width="100%" height="100%" fill="url(#color-picker-saturation-v2)"></rect>
            <rect x="0" y="0" width="100%" height="100%" fill="url(#color-picker-brightness-v2)"></rect>
          </pattern>
        </defs>
        <rect rx="10" ry="10" x="0" y="0" width="200" height="120" fill="url(#color-picker-pattern-v2)"></rect>
        <svg class="color-picker-v2-dragger color-picker-v2-box-dragger" x="0" y="0" ref={(el) => setBoxDraggerRef(el)}>
          <circle r="11" fill="inherit" stroke="#fff" stroke-width="2"></circle>
        </svg>
      </svg>
    </div>
  );
}

// patched https://stackoverflow.com/a/34029238/6758968
const rgbRegExp = /^(?:rgb)?\(?([01]?\d\d?|2[0-4]\d|25[0-5])(?:\W+)([01]?\d\d?|2[0-4]\d|25[0-5])\W+(?:([01]?\d\d?|2[0-4]\d|25[0-5])\)?)$/;
export interface AdvancedPalleteProps {
  color: Color;
  onChange: (color: Color) => void;
  onPalleteSwitchClick: () => void;
}
export function AdvancedPallete(props: AdvancedPalleteProps) {
  const [hexInputValue, setHexInputValue] = createSignal(anyColorToHexColor(props.color));
  const [rgbInputValue, setRgbInputValue] = createSignal(rbgToString(...anyColorToRgbaColor(props.color), false));
  const [hexInputState, setHexInputState] = createSignal(InputState.Neutral);
  const [rgbInputState, setRgbInputState] = createSignal(InputState.Neutral);

  createEffect(on(() => props.color, (newVal) => {
    setHexInputValue(anyColorToHexColor(newVal));
    setRgbInputValue(rbgToString(...anyColorToRgbaColor(newVal), false));
  }));

  const handleHexInputChange = (v: string) => {
    let value = v.replace(/#/g, '').slice(0, 6);
    const match = value.match(/([a-fA-F\d]+)/);
    const valid = match && match[0].length === value.length && [/* 3, 4,  */6].includes(value.length);

    setHexInputValue(v);
    setHexInputState(valid ? InputState.Neutral : InputState.Error);

    value = '#' + value;

    if(valid) {
      props.onChange({type: ColorFormatType.hexa, value});
    }
  };

  const handleRgbInputChange = (v: string) => {
    const match = v.match(rgbRegExp);

    setRgbInputValue(v);
    setRgbInputState(match ? InputState.Neutral : InputState.Error);

    if(match) {
      props.onChange({
        type: ColorFormatType.rgba,
        value: [+match[1], +match[2], +match[3], 1]
      });
    }
  };

  return (
    <div class="color-picker-v2__advance-pallete advance-pallete">
      <div class="color-slider-container">
        <ColorSlider
          color={props.color}
          onChange={(color) => props.onChange(color)}
        />
        <PalleteSwitchButton onClick={() => props.onPalleteSwitchClick()}/>
      </div>
      <div class="box-pallete-container">
        <ColorPalleteBox
          color={props.color}
          onChange={(color) => props.onChange(color)}
        />
        <div class="color-inputs">
          <InputFieldTsx
            class="color-input"
            plainText={true}
            value={hexInputValue()}
            state={hexInputState()}
            label={'Appearance.Color.Hex'}
            onRawInput={handleHexInputChange}
          />
          <InputFieldTsx
            class="color-input"
            plainText={true}
            state={rgbInputState()}
            value={rgbInputValue()}
            label={'Appearance.Color.RGB'}
            onRawInput={handleRgbInputChange}
          />
        </div>
      </div>
    </div>
  );
}

export interface ColorPickerProps {
  color: Color;
  quickPallete?: Color[];
  outputColorFormat: ColorFormatType;
  onChange: (color: Color) => void;
}
export function ColorPickerV2(props: ColorPickerProps) {
  const [advansedPalleteOpened, setAdvansedPalleteOpened] = createSignal(false);
  const handleColorChange = (color: Color): void => {
    let resultColor = color;

    switch(props.outputColorFormat) {
      case (ColorFormatType.hexa): {
        resultColor = {
          type: ColorFormatType.hexa,
          value: anyColorToHexColor(color)
        };
        break;
      }
      case (ColorFormatType.rgba): {
        resultColor = {
          type: ColorFormatType.rgba,
          value: anyColorToRgbaColor(color)
        };
        break;
      }
      case (ColorFormatType.hsla): {
        resultColor = {
          type: ColorFormatType.hsla,
          value: anyColorToHslaColor(color)
        };
        break;
      }
      case (ColorFormatType.hsv): {
        resultColor = {
          type: ColorFormatType.hsv,
          value: anyColorToHsvColor(color)
        };
        break;
      }
    }

    props.onChange(resultColor);
  }

  return (
    <div class="color-picker-v2">
      { advansedPalleteOpened() ?
        <AdvancedPallete
          color={props.color}
          onChange={(selectedColor) => handleColorChange(selectedColor)}
          onPalleteSwitchClick={() => setAdvansedPalleteOpened(false)}
        /> :
        <QuickPallete
          colors={props.quickPallete}
          onColorClick={(selectedColor) => handleColorChange(selectedColor)}
          onPalleteSwitchClick={() => setAdvansedPalleteOpened(true)}
        />
      }
    </div>
  )
}
