import { StarFieldTexture } from './Assets.js'
import { Quad } from './Geometries/Quad.js'
import { U_MODELMATRIX, U_TEXTURE_STARS } from './Graphics/sharedLiterals.js'
import { Matrix4 } from './Math/Matrix4.js'
import { GridShader } from './Shaders/GridShader.js'

export class Grid {
  render () {
    const m = new Matrix4()
    m.set3x3(200, 0, 0, 0, 200, 0, 0, 0, 1)
    GridShader.use({
      [U_TEXTURE_STARS]: { slot: 0, texture: StarFieldTexture },
      [U_MODELMATRIX]: m
    })
    Quad.draw()
  }
}
