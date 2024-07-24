export function uint32_to_rgba(color: number) {
  var a = (color >> 24) & 0xff;
  var b = (color >> 16) & 0xff;
  var g = (color >> 8) & 0xff;
  var r = color & 0xff;
  return [r, g, b, a];
}

export function rgba_to_uint32(r: number, g: number, b: number, a: number) {
  return (a << 24) | (b << 16) | (g << 8) | r;
}

export function rgb888_to_rgb565(r: number, g: number, b: number) {
  return ((r << 8) & 0xf800) | ((g << 2) & 0x03e0) | (b >> 3);
}

export function rgba8888_to_rgba4444(r: number, g: number, b: number, a: number) {
  return (r >> 4) | (g & 0xf0) | ((b & 0xf0) << 4) | ((a & 0xf0) << 8);
}

export function rgb888_to_rgb444(r: number, g: number, b: number) {
  return ((r >> 4) << 8) | (g & 0xf0) | (b >> 4);
}

// Alternative 565 ?
// return ((r & 0xf8) << 8) + ((g & 0xfc) << 3) + (b >> 3);

// Alternative 4444 ?
// ((a & 0xf0) << 8) | ((r & 0xf0) << 4) | (g & 0xf0) | (b >> 4);
