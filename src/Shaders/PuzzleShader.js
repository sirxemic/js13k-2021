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
  float t = ${U_TIME} * 0.1;
  float fi = 1.0 - ${U_FADE_AMOUNT};
  vec4 data = texture2D(${U_TEXTURE}, uv);
  vec4 starData = texture2D(${U_TEXTURE_STARS}, (vp.xy + t) * 0.1);

  float sn = noise(vec3(vp + t));
  vec3 color = hsv2rgb(vec3(data.b + sn * 0.08, 1.0, 1.0)) + 0.15;

  vec3 cc = mix(color, vec3(1.3), (data.g + starData.y * starData.x) * data.g + starData.y * starData.x * 0.5);
  cc = mix(cc, vec3(1.0), starData.x);


  float a = (1.0 + data.g + ${U_FADE_AMOUNT} + starData.y) * data.r * data.r * fi;

  a = sqrt(a) - pow(${U_FADE_AMOUNT} * 0.5, 2.0);
  if (data.w < 0.5) {
    a *= (sin(t * 50.0) + 2.0) * 0.333;
  }

  gl_FragColor = vec4(cc * a, 1.0);
}
`

export const PuzzleShader = new ShaderProgram(vertexShader, fragmentShader)