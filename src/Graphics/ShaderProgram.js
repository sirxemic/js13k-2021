import { gl } from '../Graphics.js'
import { Vector3 } from '../Math/Vector3.js'
import { Matrix3 } from '../Math/Matrix3.js'
import { Matrix4 } from '../Math/Matrix4.js'
import { TheCamera } from '../Camera.js'
import { U_PROJECTIONMATRIX, U_VIEWMATRIX, ATTR_POSITION, U_MODELMATRIX } from './sharedLiterals.js'
import { common } from './ShaderCommons.js'
import { Vector2 } from '../Math/Vector2.js'
import { Vector4 } from '../Math/Vector4.js'

function createShader (type, source) {
  var shader = gl.createShader(type)
  gl.shaderSource(shader, source)
  gl.compileShader(shader)

  // <dev-only>
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.warn(source.split('\n').map((line, index) => `${index+1} ${line}`).join('\n'))
    throw new Error('compile error: ' + gl.getShaderInfoLog(shader))
  }
  // </dev-only>

  return shader
}

export let currentProgram

const vertexShaderHeader = `/*glsl*/
attribute vec3 ${ATTR_POSITION};
uniform mat4 ${U_MODELMATRIX};
uniform mat4 ${U_VIEWMATRIX};
uniform mat4 ${U_PROJECTIONMATRIX};
`
const fragmentShaderHeader = `/*glsl*/
precision highp float;
${common}
`

export class ShaderProgram {
  constructor (vertexSource, fragmentSource) {
    this.program = gl.createProgram()
    gl.attachShader(this.program, createShader(gl.VERTEX_SHADER, vertexShaderHeader + vertexSource))
    gl.attachShader(this.program, createShader(gl.FRAGMENT_SHADER, fragmentShaderHeader + fragmentSource))

    gl.linkProgram(this.program)

    // <dev-only>
    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      throw new Error('link error: ' + gl.getProgramInfoLog(this.program))
    }
    // </dev-only>

    this.uniformLocations = {}
    let numUniforms = gl.getProgramParameter(this.program, gl.ACTIVE_UNIFORMS)
    for (let i = 0; i < numUniforms; i++) {
        let uniform = gl.getActiveUniform(this.program, i)
        this.uniformLocations[uniform.name] = gl.getUniformLocation(this.program, uniform.name)
    }
  }

  use (uniforms = {}) {
    currentProgram = this.program

    uniforms[U_PROJECTIONMATRIX] = TheCamera.projectionMatrix
    uniforms[U_VIEWMATRIX] = TheCamera.viewMatrix

    gl.useProgram(this.program)
    for (let uniformName in uniforms) {
      const location = this.uniformLocations[uniformName]
      if (uniforms[uniformName] instanceof Vector3) {
        gl.uniform3fv(location, uniforms[uniformName].array())
      } else if (uniforms[uniformName] instanceof Vector2) {
        gl.uniform2fv(location, uniforms[uniformName].array())
      } else if (uniforms[uniformName] instanceof Vector4) {
        gl.uniform4fv(location, uniforms[uniformName].array())
      } else if (uniforms[uniformName] instanceof Matrix3) {
        gl.uniformMatrix3fv(location, false, uniforms[uniformName].els)
      } else if (uniforms[uniformName] instanceof Matrix4) {
        gl.uniformMatrix4fv(location, false, uniforms[uniformName].els)
      } else if (uniforms[uniformName].texture) {
        const slot = uniforms[uniformName].slot || 0
        uniforms[uniformName].texture.use(slot)
        gl.uniform1i(location, slot)
      } else {
        gl.uniform1f(location, uniforms[uniformName])
      }
    }
  }
}
