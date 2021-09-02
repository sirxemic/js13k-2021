import { TheCamera } from './Camera.js'
import { FSM } from './FSM.js'
import { SelectorCube } from './Geometries/SelectorCube.js'
import { currentPuzzle } from './globals.js'
import { gl } from './Graphics.js'
import { U_TIME, U_VARIANT } from './Graphics/sharedLiterals.js'
import { Input } from './Input.js'
import { Vector3 } from './Math/Vector3.js'
import { SelectorShader } from './Shaders/SelectorShader.js'
import { Transform3D } from './Transform3D.js'
import { closestModulo } from './utils.js'

export class Cursor extends Transform3D {
  constructor ({ x, y }) {
    super()

    this.x = x
    this.y = y

    this.matrix.setTranslation(new Vector3(this.x * 2 - 4, this.y * 2 - 4, 0))
    this.updateMatrices()
  }

  render () {
    SelectorShader.use({
      [U_TIME]: performance.now() / 1000,
      ...this.getCommonUniforms()
    })
    SelectorCube.draw()
  }
}

const DEFAULT_STATE = 1
const DRAG_OR_DRAW_STATE = 2
const DRAGGING_CAMERA_STATE = 3
const ERASING_STATE = 4
const DRAWING_STATE = 5

export class Selector {
  constructor () {
    this.clearCursors()

    this.selectedId = -1

    this.lastCursorPos = null

    const fsm = this.fsm = new FSM({
      [DEFAULT_STATE]: {
        enter: () => {
          this.clearCursors()
        },

        execute: () => {
          if (Input.pointerDown) {
            this.fsm.setState(DRAG_OR_DRAW_STATE)
          } else if (Input.usingMouse) {
            this.clearCursors()
            this.addCursorAtPointer(this.getIdAtPointer())
          }
        },

        leave: () => {
          this.clearCursors()
        }
      },

      [DRAG_OR_DRAW_STATE]: {
        enter: () => {
          this.lastCursorPos = this.getTilePosAtPointer()
          this.selectedId = this.getIdAtPointer()
          this.addCursorAt(this.lastCursorPos)
          if (this.selectedId !== -1) {
            this.createCursorsAtOppositeOf(this.lastCursorPos, this.selectedId)
          }
        },

        execute: () => {
          if (!Input.pointerDown) {
            currentPuzzle.unsetSymmetricallyAt(this.lastCursorPos.x, this.lastCursorPos.y)
            fsm.setState(DEFAULT_STATE)
          }
          else if (Input.panning) {
            fsm.setState(DRAGGING_CAMERA_STATE)
          } else {
            const { x, y } = this.getTilePosAtPointer()

            // Check the ID when moving over a second tile to determine the action
            if (x !== this.lastCursorPos.x || y !== this.lastCursorPos.y) {
              if (this.selectedId === -1) {
                fsm.setState(ERASING_STATE)
              } else {
                const secondId = this.getIdAtPointer()
                if (secondId !== this.selectedId) {
                  fsm.setState(DRAWING_STATE)
                } else {
                  fsm.setState(ERASING_STATE)
                }
              }
            }
          }
        },

        leave: () => {
          this.clearCursors()
        }
      },

      [ERASING_STATE]: {
        enter: () => {
          const currentCursorPos = this.getTilePosAtPointer()
          currentPuzzle.unsetSymmetricallyAt(this.lastCursorPos.x, this.lastCursorPos.y)
          currentPuzzle.unsetSymmetricallyAt(currentCursorPos.x, currentCursorPos.y)

          this.addCursorAt(this.lastCursorPos, -1)
          this.addCursorAt(currentCursorPos, -1)

          this.lastCursorPos = currentCursorPos
        },

        execute: () => {
          if (!Input.pointerDown) {
            fsm.setState(DEFAULT_STATE)
            return
          }

          const currentCursorPos = this.getTilePosAtPointer()
          const idAtCursor = this.getIdAtPointer()
          if (
            (currentCursorPos.x !== this.lastCursorPos.x || currentCursorPos.y !== this.lastCursorPos.y) &&
            (idAtCursor === this.selectedId || idAtCursor === -1 || this.selectedId === -1)
          ) {
            currentPuzzle.unsetSymmetricallyAt(currentCursorPos.x, currentCursorPos.y)
            this.addCursorAt(currentCursorPos, -1)
            this.lastCursorPos = currentCursorPos
          }
        }
      },

      [DRAWING_STATE]: {
        enter: () => {
          const currentPos = this.getTilePosAtPointer()
          currentPuzzle.setSymmetricallyAt(currentPos.x, currentPos.y, this.selectedId)
          this.addCursorAt(currentPos)
          this.createCursorsAtOppositeOf(currentPos)
        },

        execute: () => {
          if (!Input.pointerDown) {
            fsm.setState(DEFAULT_STATE)
            return
          }

          const currentCursorPos = this.getTilePosAtPointer()
          if (currentCursorPos.x !== this.lastCursorPos.x || currentCursorPos.y !== this.lastCursorPos.y) {
            currentPuzzle.setSymmetricallyAt(currentCursorPos.x, currentCursorPos.y, this.selectedId)
            this.addCursorAt(currentCursorPos)
            this.createCursorsAtOppositeOf(currentCursorPos)
            this.lastCursorPos = currentCursorPos
          }
        }
      },

      [DRAGGING_CAMERA_STATE]: {
        enter: () => {
          this.clearCursors()
        },

        execute: () => {
          if (Input.panning) {
            TheCamera.x += Input.panX
            TheCamera.y += Input.panY
          }
          else {
            fsm.setState(DEFAULT_STATE)
          }
        }
      }
    }, DEFAULT_STATE)
  }

  clearCursors () {
    this.validCursors = {}
    this.invalidCursors = {}
  }

  getTilePosAtPointer () {
    return {
      x: Math.round(Input.x / 2) + 2,
      y: Math.round(Input.y / 2) + 2
    }
  }

  addCursorAtPointer (expected = this.selectedId) {
    return this.addCursorAt(this.getTilePosAtPointer(), expected)
  }

  createCursorsAtOppositeOf ({ x, y }, expected = this.selectedId) {
    const opposite = currentPuzzle.getOpposite(x, y, this.selectedId)

    opposite.x = closestModulo(x, opposite.x, currentPuzzle.width)
    opposite.y = closestModulo(y, opposite.y, currentPuzzle.height)

    for (let ix = -1; ix <= 1; ix++) {
      for (let iy = -1; iy <= 1; iy++) {
        this.addCursorAt(
          {
            x:  opposite.x + ix * currentPuzzle.width,
            y: opposite.y + iy * currentPuzzle.height
          },
          expected
        )
      }
    }
  }

  addCursorAt ({ x, y }, expected = this.selectedId) {
    const id = currentPuzzle.getIdAt(x, y)

    const targetCollection = id === expected ? this.validCursors : this.invalidCursors

    return targetCollection[x+';'+y] = new Cursor({ x, y })
  }

  getIdAtPointer () {
    const pos = this.getTilePosAtPointer()
    return currentPuzzle.getIdAt(pos.x, pos.y)
  }

  step () {
    this.fsm.step()
  }

  render () {
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE)
    gl.blendEquation(gl.FUNC_ADD)
    SelectorShader.use({
      [U_TIME]: performance.now() / 1000,
      [U_VARIANT]: 1
    })
    for (const cursor of Object.values(this.validCursors)) {
      cursor.render()
    }
    gl.disable(gl.BLEND)
  }

  renderPass2 () {
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    gl.blendEquation(gl.FUNC_REVERSE_SUBTRACT)
    SelectorShader.use()
    for (const cursor of Object.values(this.invalidCursors)) {
      cursor.render()
    }
    gl.disable(gl.BLEND)
  }
}