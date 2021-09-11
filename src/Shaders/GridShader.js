import {
  U_MODELMATRIX,
  U_VIEWMATRIX,
  U_PROJECTIONMATRIX,
  ATTR_POSITION,
  U_FADE_AMOUNT
} from '../Graphics/sharedLiterals.js'
import { ShaderProgram } from '../Graphics/ShaderProgram.js'

export const vertexShader = `/*glsl*/
varying vec3 vp;

void main() {
  vp = (${U_MODELMATRIX} * vec4(${ATTR_POSITION}, 1.0)).xyz;

  gl_Position = ${U_PROJECTIONMATRIX} * ${U_VIEWMATRIX} * ${U_MODELMATRIX} * vec4(${ATTR_POSITION}, 1.0);
}
`

export const fragmentShader = `/*glsl*/
uniform float ${U_FADE_AMOUNT};
varying vec3 vp;

void main() {
  vec2 p = vp.xy - 1.0;
  float x = abs(2.*fract(.5 * p.x)-1.);
  float y = abs(2.*fract(.5 * p.y)-1.);

  float g = smoothstep(0.2, 0.4, sqrt(pow(x, 16.0) + pow(y, 16.0)) * 2.0 - 1.0);
  gl_FragColor = vec4(vec3(1.0), g * 0.08 * (1.0 - ${U_FADE_AMOUNT}));
}
`

export const GridShader = new ShaderProgram(vertexShader, fragmentShader)