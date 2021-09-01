import { ATTR_POSITION, U_COLOR, U_GALAXY_CENTER, U_MODELMATRIX, U_TILE_CONNECTION, U_TILE_POS, U_WORLD_SIZE } from '../Graphics/sharedLiterals'
import { ShaderProgram } from '../Graphics/ShaderProgram'

export const vertexShader = `/*glsl*/
uniform vec2 ${U_TILE_POS};
uniform vec2 ${U_WORLD_SIZE};
varying vec2 vp;
varying vec2 worldPos;

void main() {
  vp = ${ATTR_POSITION}.xy;
  worldPos = ${ATTR_POSITION}.xy * 0.5 + ${U_TILE_POS};
  gl_Position = vec4((worldPos * 2.0) / ${U_WORLD_SIZE} - 1.0, 0.0, 1.0);
}
`

export const fragmentShader = `/*glsl*/
uniform vec4 ${U_TILE_CONNECTION};
uniform vec2 ${U_GALAXY_CENTER};
uniform vec2 ${U_WORLD_SIZE};
uniform float ${U_COLOR};
varying vec2 vp;
varying vec2 worldPos;

float getMask(vec2 pos, float h, float v, float _d) {
  if (_d > 0.0) return 1.0;
  if (h <= 0.0 && v <= 0.0) {
    return 1.0 - length(pos);
  }
  if (h > 0.0 && v > 0.0) {
    return length(1.0 - pos);
  }
  if (h > 0.0) {
    return 1.0 - pos.y;
  }
  if (v > 0.0) {
    return 1.0 - pos.x;
  }
  return 0.0;
}

void main() {
  vec4 t = ${U_TILE_CONNECTION};

  float cLeft = t.x > 1.5 ? 1.0 : -t.x;
  float cRight = t.x;
  float cTop = t.y;
  float cBottom = t.y > 1.5 ? 1.0 : -t.y;
  float cTopRight = t.z;
  float cBottomLeft = t.z > 1.5 ? 1.0 : -t.z;
  float cTopLeft = t.w;
  float cBottomRight = t.w > 1.5 ? 1.0 : -t.w;

  float m = 0.0;
  if (vp.x < 0.0) {
    if (vp.y > 0.0) {
      m = getMask(abs(vp), cLeft, cTop, cTopLeft);
    } else {
      m = getMask(abs(vp), cLeft, cBottom, cBottomLeft);
    }
  } else {
    if (vp.y > 0.0) {
      m = getMask(abs(vp), cRight, cTop, cTopRight);
    } else {
      m = getMask(abs(vp), cRight, cBottom, cBottomRight);
    }
  }

  float minDist = 100.0;
  for (int x = -1; x <= 1; x++) {
    for (int y = -1; y <= 1; y++) {
      minDist = min(minDist, length(worldPos + ${U_WORLD_SIZE} * vec2(x, y) - ${U_GALAXY_CENTER}));
    }
  }
  float g = 1.0 - minDist * 0.7;

  gl_FragColor = vec4(m, g, ${U_COLOR}, 1.0);
}
`

export const TileShader = new ShaderProgram(vertexShader, fragmentShader)