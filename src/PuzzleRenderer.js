import { StarFieldTexture } from './Assets.js'
import { TheCamera } from './Camera.js'
import { Quad } from './Geometries/Quad.js'
import { StackedQuads } from './Geometries/StackedQuads.js'
import { currentPuzzle } from './globals.js'
import { gl, TheCanvas } from './Graphics.js'
import { RenderTarget } from './Graphics/RenderTarget.js'
import {
  U_COLOR,
  U_GALAXY_CENTER,
  U_MODELMATRIX,
  U_TEXTURE,
  U_TEXTURE_STARS,
  U_TILE_CONNECTION,
  U_TILE_POS,
  U_TIME,
  U_WORLD_SIZE
} from './Graphics/sharedLiterals.js'
import { Matrix4 } from './Math/Matrix4.js'
import { Vector2 } from './Math/Vector2.js'
import { Vector3 } from './Math/Vector3.js'
import { PuzzleShader } from './Shaders/PuzzleShader.js'
import { TileShader } from './Shaders/TileShader.js'

const RESOLUTION = 64

export class PuzzleRenderer {
  constructor () {
    this.mask = new RenderTarget(RESOLUTION * currentPuzzle.width, RESOLUTION * currentPuzzle.height)
  }

  renderMask () {
    this.mask.bind()
    gl.viewport(0, 0, RESOLUTION * currentPuzzle.width, RESOLUTION * currentPuzzle.height)
    gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT)
    for (let tile of currentPuzzle.tiles) {
      if (tile.id < 0) continue
      this.renderTileMask(tile)
    }
    gl.enable(gl.DEPTH_TEST)
    RenderTarget.unbind()
  }

  render () {
    const { width, height } = currentPuzzle
    this.renderMask()
    gl.viewport(0, 0, TheCanvas.width, TheCanvas.height)
    gl.disable(gl.DEPTH_TEST)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE)
    gl.blendEquation(gl.FUNC_ADD)

    PuzzleShader.use({
      [U_TEXTURE]: { slot: 0, texture: this.mask },
      [U_TEXTURE_STARS]: { slot: 1, texture: StarFieldTexture },
      [U_TIME]: performance.now() / 100000
    })

    const modelMatrix = new Matrix4()
    modelMatrix.set3x3(width, 0, 0, 0, height, 0, 0, 0, 1)

    const currentCellPos = TheCamera.getRayGridIntersection(0, 0)
    currentCellPos.x = Math.round(currentCellPos.x / (width * 2))
    currentCellPos.y = Math.round(currentCellPos.y / (height * 2))

    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        PuzzleShader.use({
          [U_MODELMATRIX]: modelMatrix.setTranslation(
            new Vector3(
              ((x + currentCellPos.x) * width) * 2,
              ((y + currentCellPos.y) * height) * 2,
              -0.5
            )
          ),
        })
        StackedQuads.draw()
      }
    }

    gl.disable(gl.BLEND)
    gl.enable(gl.DEPTH_TEST)
  }

  renderTileMask (tile) {
    TileShader.use({
      [U_TILE_POS]: new Vector2(tile.x + 0.5, tile.y + 0.5),
      [U_WORLD_SIZE]: new Vector2(currentPuzzle.width, currentPuzzle.height),
      [U_COLOR]: currentPuzzle.colorIds[tile.id] / 6,
      [U_GALAXY_CENTER]: currentPuzzle.centers[tile.id],
      [U_TILE_CONNECTION]: currentPuzzle.getConnection(tile.x, tile.y)
    })
    Quad.draw()
  }
}
