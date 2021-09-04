import {
  U_MODELMATRIX,
  U_VIEWMATRIX,
  U_PROJECTIONMATRIX,
  ATTR_POSITION,
  U_TEXTURE,
  U_TEXTURE_STARS,
  U_TIME,
  U_FADE_AMOUNT
} from '../Graphics/sharedLiterals.js'
import { ShaderProgram } from '../Graphics/ShaderProgram.js'

export const vertexShader = `/*glsl*/
varying vec2 uv;
varying vec3 vp;

void main() {
  uv = ${ATTR_POSITION}.xy * 0.5 + 0.5;
  vp = (${U_MODELMATRIX} * vec4(${ATTR_POSITION}, 1.0)).xyz;

  gl_Position = ${U_PROJECTIONMATRIX} * ${U_VIEWMATRIX} * ${U_MODELMATRIX} * vec4(${ATTR_POSITION}, 1.0);
}
`

export const fragmentShader = `/*glsl*/
uniform sampler2D ${U_TEXTURE};
uniform sampler2D ${U_TEXTURE_STARS};
uniform float ${U_TIME};
uniform float ${U_FADE_AMOUNT};
varying vec2 uv;
varying vec3 vp;

vec3 hsv2rgb(vec3 c)
{
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
  vec4 data = texture2D(${U_TEXTURE}, uv);
  vec4 starData = texture2D(${U_TEXTURE_STARS}, uv + 3.714 * vp.z + ${U_TIME});

  float sn = noise(vp);
  float sn2 = noise(vec3(vp.xy, 10.0));
  vec3 color = hsv2rgb(vec3(data.b + sn * 0.08, 1.0, 0.7 - sn2 * 0.2));

  vec3 cc = mix(color, vec3(1.0), data.g * data.g * data.g);
  cc = mix(cc, vec3(1.0), starData.g);

  float a = (sqrt(data.r) - (abs(vp.z) * abs(vp.z) * 2.0) - ${U_FADE_AMOUNT}) * (1.0 - ${U_FADE_AMOUNT});
  if (data.w < 0.5) {
    a *= (sin(${U_TIME} * 300.0) + 2.0) * 0.333;
  }

  if (starData.r > 0.5 && starData.g > 0.5 && a > 0.0) a *= 0.9;
  else if (data.g > 0.0) {
    a *= max(0.07, (data.g + ${U_FADE_AMOUNT}) * 0.1);
  }
  else a *= 0.07;

  gl_FragColor = vec4(cc, a);
}
`

export const PuzzleShader = new ShaderProgram(vertexShader, fragmentShader)