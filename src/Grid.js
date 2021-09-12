import { StarFieldTexture } from './Assets.js'
import { TheCamera } from './Camera.js'
import { Quad } from './Geometries/Quad.js'
import { currentPuzzle } from './globals.js'
import { gl } from './Graphics.js'
import { U_FADE_AMOUNT, U_MODELMATRIX, U_TEXTURE_STARS } from './Graphics/sharedLiterals.js'
import { Matrix4 } from './Math/Matrix4.js'
import { GridShader } from './Shaders/GridShader.js'

export class Grid {
  render (fadeAmount) {
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

    const scale = currentPuzzle.wrapping ? 100 : currentPuzzle.size + 0.1
    const pos = currentPuzzle.wrapping ? TheCamera : { x: currentPuzzle.size - 1, y: currentPuzzle.size - 1 }

    const m = new Matrix4([
      scale, 0, 0, 0,
      0, scale, 0, 0,
      0, 0, 1, 0,
      pos.x, pos.y, 0, 1
    ])
    GridShader.use({
      [U_TEXTURE_STARS]: { slot: 0, texture: StarFieldTexture },
      [U_MODELMATRIX]: m,
      [U_FADE_AMOUNT]: fadeAmount
    })
    Quad.draw()
  }
}
