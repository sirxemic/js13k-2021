import { ATTR_POSITION, U_COLOR, U_GALAXY_CENTER, U_GALAXY_CONNECTION, U_LOCKED, U_SPACE_CONNECTION, U_SPACE_POS, U_TIME, U_WORLD_SIZE } from '../Graphics/sharedLiterals.js'
import { ShaderProgram } from '../Graphics/ShaderProgram.js'

export const vertexShader = `/*glsl*/
uniform vec2 ${U_SPACE_POS};
uniform vec2 ${U_WORLD_SIZE};
varying vec2 vp; // position
varying vec2 wp; // worldPos

void main() {
  vp = ${ATTR_POSITION}.xy;
  wp = ${ATTR_POSITION}.xy * 0.5 + ${U_SPACE_POS};
  gl_Position = vec4((wp * 2.0) / ${U_WORLD_SIZE} - 1.0, 0.0, 1.0);
}
`

export const fragmentShader = `/*glsl*/
uniform vec4 ${U_SPACE_CONNECTION};
uniform vec2 ${U_GALAXY_CENTER};
uniform vec2 ${U_WORLD_SIZE};
uniform float ${U_COLOR};
uniform float ${U_GALAXY_CONNECTION};
uniform float ${U_LOCKED};
uniform float ${U_TIME};
varying vec2 vp; // position
varying vec2 wp; // worldPos

float getMask(vec2 pos, float h, float v, float d) {
  if (d > 0.0) return 1.0;
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
  vec4 t = ${U_SPACE_CONNECTION};

  float cL = t.x > 1.5 ? 1.0 : -t.x;
  float cR = t.x;
  float cT = t.y;
  float cB = t.y > 1.5 ? 1.0 : -t.y;
  float cTR = t.z;
  float cBL = t.z > 1.5 ? 1.0 : -t.z;
  float cTL = t.w;
  float cBR = t.w > 1.5 ? 1.0 : -t.w;

  float m = 0.0;
  if (vp.x < 0.0) {
    if (vp.y > 0.0) {
      m = getMask(abs(vp), cL, cT, cTL);
    } else {
      m = getMask(abs(vp), cL, cB, cBL);
    }
  } else {
    if (vp.y > 0.0) {
      m = getMask(abs(vp), cR, cT, cTR);
    } else {
      m = getMask(abs(vp), cR, cB, cBR);
    }
  }

  float md = 100.0; // min distance
  for (int x = -1; x <= 1; x++) {
    for (int y = -1; y <= 1; y++) {
      md = min(md, length(wp + ${U_WORLD_SIZE} * vec2(x, y) - ${U_GALAXY_CENTER}));
    }
  }
  float g = 1.0 - md * 0.7; // glow amount
  if (${U_LOCKED} > 0.0) {
    g = max(g, (1.0 - length(vp)));
  }

  gl_FragColor = vec4(m, g, ${U_COLOR}, ${U_GALAXY_CONNECTION});
}
`

export const TileShader = new ShaderProgram(vertexShader, fragmentShader)