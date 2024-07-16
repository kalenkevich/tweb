export interface DrawObject {
  name: string; // object name, mostly used for debugging
  zIndex: number; // order of the rendering object, might be usefull
}

export interface DrawObjectAttribute<AttributeType, SizeType, ArrayType> {
  type: AttributeType;
  size: SizeType; // dimention of the element: number -> 1, vec2 -> 2, vec3 -> 3, vec4 -> 4 and etc.
  buffer: ArrayType;
}

export enum DrawObjectAttributeType {
  BYTE = 0x1400,
  UNSIGNED_BYTE = 0x1401,
  SHORT = 0x1402,
  UNSIGNED_SHORT = 0x1403,
  INT = 0x1404,
  UNSIGNED_INT = 0x1405,
  FLOAT = 0x1406,
}

export enum VERTEX_QUAD_POSITION {
  TOP_LEFT = 0,
  TOP_RIGHT = 1,
  BOTTOM_LEFT = 2,
  BOTTOM_RIGHT = 3,
}
