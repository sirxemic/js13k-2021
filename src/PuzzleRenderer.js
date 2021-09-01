import { StarFieldTexture } from './Assets'
import { Quad } from './Geometries/Quad'
import { StackedQuads } from './Geometries/StackedQuads'
import { gl, TheCanvas } from './Graphics'
import { RenderTarget } from './Graphics/RenderTarget'
import { U_COLOR, U_GALAXY_CENTER, U_MODELMATRIX, U_TEXTURE, U_TEXTURE_STARS, U_TILE_CONNECTION, U_TILE_POS, U_TIME, U_WORLD_SIZE } from './Graphics/sharedLiterals'
import { Matrix4 } from './Math/Matrix4'
import { Vector2 } from './Math/Vector2'
import { Vector3 } from './Math/Vector3'
import { PuzzleShader } from './Shaders/PuzzleShader'
import { TileShader } from './Shaders/TileShader'
import { Transform3D } from './Transform3D'

const RESOLUTION = 64

export class PuzzleRenderer extends Transform3D {
  constructor (puzzle) {
    super()

    this.puzzle = puzzle

    this.mask = new RenderTarget(RESOLUTION * puzzle.width, RESOLUTION * puzzle.height)

    this.root = new Transform3D()

    this.add(this.root)
  }

  step () {

  }

  renderMask () {
    this.mask.bind()
    gl.viewport(0, 0, RESOLUTION * this.puzzle.width, RESOLUTION * this.puzzle.height)
    gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT)
    for (let tile of this.puzzle.tiles) {
      if (tile.id < 0) continue
      this.renderTileMask(tile)
    }
    gl.enable(gl.DEPTH_TEST)
    RenderTarget.unbind()
  }

  render () {
    const { width, height } = this.puzzle
    this.renderMask()
    gl.viewport(0, 0, TheCanvas.width, TheCanvas.height)
    gl.enable(gl.BLEND)
    gl.disable(gl.DEPTH_TEST)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE)

    PuzzleShader.use({
      [U_TEXTURE]: { slot: 0, texture: this.mask },
      [U_TEXTURE_STARS]: { slot: 1, texture: StarFieldTexture },
      [U_TIME]: performance.now() / 100000
    })

    const modelMatrix = new Matrix4()
    modelMatrix.set3x3(width, 0, 0, 0, height, 0, 0, 0, 1)

    for (let x = -2; x <= 2; x++) {
      for (let y = -2; y <= 2; y++) {
        PuzzleShader.use({
          [U_MODELMATRIX]: modelMatrix.setTranslation(new Vector3(x * width * 2, y * height * 2, -0.5)),
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
      [U_WORLD_SIZE]: new Vector2(this.puzzle.width, this.puzzle.height),
      [U_COLOR]: tile.colorId / 6,
      [U_GALAXY_CENTER]: this.puzzle.centers[tile.id],
      [U_TILE_CONNECTION]: this.puzzle.getConnection(tile.x, tile.y)
    })
    Quad.draw()
  }
}
