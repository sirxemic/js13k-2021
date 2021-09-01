import {
  U_MODELMATRIX,
  U_VIEWMATRIX,
  U_PROJECTIONMATRIX,
  ATTR_POSITION,
  U_TEXTURE_STARS
} from '../Graphics/sharedLiterals'
import { ShaderProgram } from '../Graphics/ShaderProgram'

export const vertexShader = `/*glsl*/
varying vec3 position;

void main() {
  position = (${U_MODELMATRIX} * vec4(${ATTR_POSITION}, 1.0)).xyz;

  gl_Position = ${U_PROJECTIONMATRIX} * ${U_VIEWMATRIX} * ${U_MODELMATRIX} * vec4(${ATTR_POSITION}, 1.0);
}
`

export const fragmentShader = `/*glsl*/
uniform sampler2D ${U_TEXTURE_STARS};

varying vec3 position;

void main() {
  vec4 starsData = texture2D(${U_TEXTURE_STARS}, position.xy * 0.211);
  vec2 p = position.xy * 0.5 + 0.53;
  float x = mod(p.x, 1.0) < 0.06 ? 1.0 : 0.0;
  x += mod(p.y, 1.0) < 0.06 ? 1.0 : 0.0;
  gl_FragColor = vec4(vec3(min(0.1, x) + starsData.r * starsData.g), 1.0);
}
`

export const GridShader = new ShaderProgram(vertexShader, fragmentShader)