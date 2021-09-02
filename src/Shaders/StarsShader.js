import {
  U_MODELMATRIX,
  U_VIEWMATRIX,
  U_PROJECTIONMATRIX,
  ATTR_POSITION,
  U_TEXTURE_STARS
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
uniform sampler2D ${U_TEXTURE_STARS};

varying vec3 vp;

void main() {
  vec4 d = texture2D(${U_TEXTURE_STARS}, vp.xy * 0.211);
  gl_FragColor = vec4(vec3(1.0), d.r * d.g);
}
`

export const StarsShader = new ShaderProgram(vertexShader, fragmentShader)