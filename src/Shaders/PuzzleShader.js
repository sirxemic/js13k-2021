import {
  U_MODELMATRIX,
  U_VIEWMATRIX,
  U_PROJECTIONMATRIX,
  ATTR_POSITION,
  U_COLOR,
  U_GALAXY_CENTER,
  U_TILE_CENTER,
  U_TILE_CONNECTION,
  U_TEXTURE,
  U_TEXTURE_STARS,
  U_TIME
} from '../Graphics/sharedLiterals'
import { ShaderProgram } from '../Graphics/ShaderProgram'

export const vertexShader = `/*glsl*/
varying vec2 uv;
varying vec3 position;

void main() {
  uv = ${ATTR_POSITION}.xy * 0.5 + 0.5;
  position = (${U_MODELMATRIX} * vec4(${ATTR_POSITION}, 1.0)).xyz;

  gl_Position = ${U_PROJECTIONMATRIX} * ${U_VIEWMATRIX} * ${U_MODELMATRIX} * vec4(${ATTR_POSITION}, 1.0);
}
`

export const fragmentShader = `/*glsl*/
uniform sampler2D ${U_TEXTURE};
uniform sampler2D ${U_TEXTURE_STARS};
uniform float ${U_TIME};
varying vec2 uv;
varying vec3 position;

vec3 hsv2rgb(vec3 c)
{
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
  vec4 data = texture2D(${U_TEXTURE}, uv);
  vec4 starData = texture2D(${U_TEXTURE_STARS}, uv + position.z + ${U_TIME});
  float sn = noise(position);
  float sn2 = noise(vec3(position.xy, 10.0));
  vec3 color = hsv2rgb(vec3(data.b + sn * 0.08, 1.0, 0.7 - sn2 * 0.2));
  vec3 cc = mix(color, vec3(1.0), data.g * data.g * data.g);
  float alpha = sqrt(data.r) - (abs(position.z) * abs(position.z) * 2.0);
  cc = mix(cc, vec3(1.0), starData.g);
  if (starData.r > 0.5 && starData.g > 0.5 && alpha > 0.0) alpha *= 0.9;
  else alpha *= 0.07;
  gl_FragColor = vec4(cc, alpha);
}
`

export const PuzzleShader = new ShaderProgram(vertexShader, fragmentShader)