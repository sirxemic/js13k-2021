import { StarFieldTexture } from './Assets.js'
import { TheCamera } from './Camera.js'
import { Quad } from './Geometries/Quad.js'
import { currentPuzzle, currentTime, delta } from './globals.js'
import { gl, TheCanvas } from './Graphics.js'
import { RenderTarget } from './Graphics/RenderTarget.js'
import {
  U_COLOR,
  U_FADE_AMOUNT,
  U_GALAXY_CENTER,
  U_GALAXY_CONNECTION,
  U_LOCKED,
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
import { smoothstep } from './utils.js'

const RESOLUTION = 64

function getValueFromColorId (id) {
  switch (id % 6) {
    case 0: return 0.985
    case 1: return 0.067
    case 2: return 0.32
    case 3: return 0.51
    case 4: return 0.667
    case 5: return 0.83
  }
}

export class PuzzleRenderer {
  constructor () {
    this.mask = new RenderTarget(1024, 1024)
    this.fadeSpeed = 0.5
    this.fadeT = 0
  }

  handleCancel () {
    this.fadeSpeed = -2
  }

  renderMask () {
    this.mask.bind()
    gl.viewport(0, 0, 1024, 1024)
    gl.clearColor(0, 0, 0, 1)
    gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT)
    gl.blendFunc(gl.ONE, gl.ZERO)
    for (let cell of currentPuzzle.grid) {
      if (cell.id < 0) continue
      this.renderTileMask(cell)
    }
    gl.enable(gl.DEPTH_TEST)
    RenderTarget.unbind()
  }

  step () {
    this.fadeT = Math.min(1, this.fadeT + delta * this.fadeSpeed)
    this.fadeAmount = smoothstep(1, 0, this.fadeT)
  }

  render () {
    const { width, height } = currentPuzzle
    this.renderMask()
    gl.viewport(0, 0, TheCanvas.width, TheCanvas.height)
    gl.disable(gl.DEPTH_TEST)
    gl.blendFunc(gl.ONE, gl.ONE)

    PuzzleShader.use({
      [U_TEXTURE]: { slot: 0, texture: this.mask },
      [U_TEXTURE_STARS]: { slot: 1, texture: StarFieldTexture },
      [U_FADE_AMOUNT]: this.fadeAmount,
      [U_TIME]: currentTime
    })

    const modelMatrix = new Matrix4([
      width, 0, 0, 0,
      0, height, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    ])
    const currentCellPos = TheCamera.getRayGridIntersection(TheCanvas.width / 2, TheCanvas.height / 2)

    currentCellPos.x = Math.floor((currentCellPos.x + 1) / (width * 2))
    currentCellPos.y = Math.floor((currentCellPos.y + 1) / (height * 2))

    const marginH = currentPuzzle.wrapping ? 3 : 0
    const marginV = currentPuzzle.wrapping ? 2 : 0

    const offX = (width - 1) / 2
    const offY = (height - 1) / 2

    for (let x = -marginH; x <= marginH; x++) {
      for (let y = -marginV; y <= marginV; y++) {
        PuzzleShader.use({
          [U_MODELMATRIX]: modelMatrix.setTranslation(
            new Vector3(
              ((x + currentCellPos.x) * width + offX) * 2,
              ((y + currentCellPos.y) * height + offY) * 2,
              -0.5
            )
          ),
        })
        Quad.draw()
      }
    }

    gl.enable(gl.DEPTH_TEST)
  }

  renderTileMask (tile) {
    TileShader.use({
      [U_TILE_POS]: new Vector2(tile.x + 0.5, tile.y + 0.5),
      [U_WORLD_SIZE]: new Vector2(currentPuzzle.width, currentPuzzle.height),
      [U_COLOR]: getValueFromColorId(currentPuzzle.colorIds[tile.id % currentPuzzle.colorIds.length]),
      [U_GALAXY_CENTER]: currentPuzzle.centers[tile.id],
      [U_LOCKED]: currentPuzzle.locks.get(tile) ? 1 : 0,
      [U_TILE_CONNECTION]: currentPuzzle.getShaderConnectionData(tile),
      [U_GALAXY_CONNECTION]: currentPuzzle.isTileConnectedToCenter(tile),
      [U_TIME]: currentTime
    })
    Quad.draw()
  }
}
