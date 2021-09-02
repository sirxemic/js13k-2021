import { StarFieldTexture } from './Assets.js'
import { TheCamera } from './Camera.js'
import { Quad } from './Geometries/Quad.js'
import { gl } from './Graphics.js'
import { U_MODELMATRIX, U_TEXTURE_STARS } from './Graphics/sharedLiterals.js'
import { Matrix4 } from './Math/Matrix4.js'
import { GridShader } from './Shaders/GridShader.js'

export class Grid {
  render () {
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    const m = new Matrix4([
      50, 0, 0, 0,
      0, 50, 0, 0,
      0, 0, 1, 0,
      Math.round(TheCamera.x), Math.round(TheCamera.y), 0, 1
    ])
    GridShader.use({
      [U_TEXTURE_STARS]: { slot: 0, texture: StarFieldTexture },
      [U_MODELMATRIX]: m
    })
    Quad.draw()
  }
}
