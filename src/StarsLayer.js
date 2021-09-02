import { StarFieldTexture } from './Assets.js'
import { TheCamera } from './Camera.js'
import { Quad } from './Geometries/Quad.js'
import { gl } from './Graphics.js'
import { U_MODELMATRIX, U_TEXTURE_STARS } from './Graphics/sharedLiterals.js'
import { Matrix4 } from './Math/Matrix4.js'
import { Vector3 } from './Math/Vector3.js'
import { StarsShader } from './Shaders/StarsShader.js'

export class StarsLayer {
  constructor (z) {
    this.z = z
  }
  render () {
    const m = new Matrix4([
      50, 0, 0, 0,
      0, 50, 0, 0,
      0, 0, 1, 0,
      Math.round(TheCamera.x), Math.round(TheCamera.y), this.z, 1
    ])
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    StarsShader.use({
      [U_TEXTURE_STARS]: { slot: 0, texture: StarFieldTexture },
      [U_MODELMATRIX]: m
    })
    Quad.draw()
  }
}
