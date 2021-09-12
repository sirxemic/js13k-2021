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
  U_SPACE_CONNECTION,
  U_SPACE_POS,
  U_TIME,
  U_WORLD_SIZE
} from './Graphics/sharedLiterals.js'
import { Grid } from './Grid.js'
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
    this.grid = new Grid()
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
    for (let space of currentPuzzle.grid) {
      if (space.id < 0) continue
      this.renderSpaceMask(space)
    }
    gl.enable(gl.DEPTH_TEST)
    RenderTarget.unbind()
  }

  step () {
    this.fadeT = Math.min(1, this.fadeT + delta * this.fadeSpeed)
    this.fadeAmount = smoothstep(1, 0, this.fadeT)
  }

  render () {
    this.grid.render(this.fadeAmount)

    const { size } = currentPuzzle
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
      size, 0, 0, 0,
      0, size, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    ])
    const currentSpacePos = TheCamera.getRayGridIntersection(TheCanvas.width / 2, TheCanvas.height / 2)

    currentSpacePos.x = Math.floor((currentSpacePos.x + 1) / (size * 2))
    currentSpacePos.y = Math.floor((currentSpacePos.y + 1) / (size * 2))

    const marginH = currentPuzzle.wrapping ? 3 : 0
    const marginV = currentPuzzle.wrapping ? 2 : 0

    const offX = (size - 1) / 2
    const offY = (size - 1) / 2

    for (let x = -marginH; x <= marginH; x++) {
      for (let y = -marginV; y <= marginV; y++) {
        PuzzleShader.use({
          [U_MODELMATRIX]: modelMatrix.setTranslation(
            new Vector3(
              ((x + currentSpacePos.x) * size + offX) * 2,
              ((y + currentSpacePos.y) * size + offY) * 2,
              -0.5
            )
          ),
        })
        Quad.draw()
      }
    }

    gl.enable(gl.DEPTH_TEST)
  }

  renderSpaceMask (space) {
    TileShader.use({
      [U_SPACE_POS]: new Vector2(space.x + 0.5, space.y + 0.5),
      [U_WORLD_SIZE]: new Vector2(currentPuzzle.size, currentPuzzle.size),
      [U_COLOR]: getValueFromColorId(currentPuzzle.colorIds[space.id % currentPuzzle.colorIds.length]),
      [U_GALAXY_CENTER]: currentPuzzle.centers[space.id],
      [U_LOCKED]: currentPuzzle.isLockedAt(space) ? 1 : 0,
      [U_SPACE_CONNECTION]: currentPuzzle.getShaderConnectionData(space),
      [U_GALAXY_CONNECTION]: currentPuzzle.isSpaceConnectedToCenter(space),
      [U_TIME]: currentTime
    })
    Quad.draw()
  }
}
