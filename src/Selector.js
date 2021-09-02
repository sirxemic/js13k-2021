import { TheCamera } from './Camera.js'
import { FSM } from './FSM.js'
import { SelectorCube } from './Geometries/SelectorCube.js'
import { currentPuzzle } from './globals.js'
import { gl } from './Graphics.js'
import { U_MODELMATRIX, U_TIME, U_VARIANT } from './Graphics/sharedLiterals.js'
import { Input } from './Input.js'
import { Matrix4 } from './Math/Matrix4.js'
import { SelectorShader } from './Shaders/SelectorShader.js'
import { closestModulo } from './utils.js'

export class Cursor {
  constructor ({ x, y }) {
    this.x = x
    this.y = y

    this.worldMatrix = new Matrix4([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      this.x * 2 - 4, this.y * 2 - 4, 0, 1
    ])
  }

  render () {
    SelectorShader.use({
      [U_TIME]: performance.now() / 1000,
      [U_MODELMATRIX]: this.worldMatrix
    })
    SelectorCube.draw()
  }
}

const DEFAULT_STATE = 1
const DRAG_OR_DRAW_STATE = 2
const MOVING_CAMERA_STATE = 3
const ERASING_STATE = 4
const DRAWING_STATE = 5
const AFTER_MOVING_CAMERA_STATE = 6

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
            fsm.setState(DRAG_OR_DRAW_STATE)
          }
          else if (Input.usingMouse) {
            // Hover visual
            this.clearCursors()
            const pos = this.getTilePosAtPointer()
            const id = this.getIdAtPointer()
            this.addCursorAt(pos, id)
            if (id > -1) {
              this.createCursorsAtOppositeOf(pos, id)
            }
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
          if (this.selectedId > -1) {
            this.createCursorsAtOppositeOf(this.lastCursorPos, this.selectedId)
          }
        },

        execute: () => {
          if (!Input.pointerDown) {
            currentPuzzle.unsetSymmetricallyAt(this.lastCursorPos)
            fsm.setState(DEFAULT_STATE)
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
          currentPuzzle.unsetSymmetricallyAt(this.lastCursorPos)
          currentPuzzle.unsetSymmetricallyAt(currentCursorPos)

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
            currentPuzzle.unsetSymmetricallyAt(currentCursorPos)
            this.addCursorAt(currentCursorPos, -1)
            this.lastCursorPos = currentCursorPos
          }
        }
      },

      [DRAWING_STATE]: {
        enter: () => {
          const currentPos = this.getTilePosAtPointer()
          currentPuzzle.setSymmetricallyAt(currentPos, this.selectedId)
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
            currentPuzzle.setSymmetricallyAt(currentCursorPos, this.selectedId)
            this.addCursorAt(currentCursorPos)
            this.createCursorsAtOppositeOf(currentCursorPos)
            this.lastCursorPos = currentCursorPos
          }
        }
      },

      [MOVING_CAMERA_STATE]: {
        enter: () => {
          this.clearCursors()

          Input.onPanUpdate = (e) => {
            TheCamera.handlePanUpdate(e)
          }
        },

        leave: () => {
          Input.onPanUpdate = () => {}
        }
      },

      [AFTER_MOVING_CAMERA_STATE]: {
        execute: () => {
          if (Input.pointerDown) {
            fsm.setState(DEFAULT_STATE)
          }
        }
      }
    }, DEFAULT_STATE)

    Input.onPanStart = (e) => {
      fsm.setState(MOVING_CAMERA_STATE)
      TheCamera.handlePanStart(e)
    }
    Input.onPanEnd = (e) => {
      fsm.setState(AFTER_MOVING_CAMERA_STATE)
      TheCamera.handlePanEnd(e)
    }
  }

  clearCursors () {
    this.validCursors = {}
    this.invalidCursors = {}
  }

  getTilePosAtPointer () {
    const { x, y } = TheCamera.getRayGridIntersection(Input.mouseX, Input.mouseY)

    return {
      x: Math.round(x / 2) + 2,
      y: Math.round(y / 2) + 2
    }
  }

  addCursorAtPointer (expected = this.selectedId) {
    return this.addCursorAt(this.getTilePosAtPointer(), expected)
  }

  createCursorsAtOppositeOf ({ x, y }, expected = this.selectedId) {
    const opposite = currentPuzzle.getOpposite({ x, y }, expected)

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

  addCursorAt (pos, expected = this.selectedId) {
    const id = currentPuzzle.getIdAt(pos)

    const targetCollection = id === expected ? this.validCursors : this.invalidCursors

    return targetCollection[`${pos.x},${pos.y}`] = new Cursor(pos)
  }

  getIdAtPointer () {
    const pos = this.getTilePosAtPointer()
    return currentPuzzle.getIdAt(pos)
  }

  step () {
    this.fsm.updateFSM()
  }

  render () {
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE)
    SelectorShader.use({
      [U_TIME]: performance.now() / 1000,
      [U_VARIANT]: 1
    })
    for (const cursor of Object.values(this.validCursors)) {
      cursor.render()
    }
  }

  renderPass2 () {
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    gl.blendEquation(gl.FUNC_REVERSE_SUBTRACT)
    SelectorShader.use()
    for (const cursor of Object.values(this.invalidCursors)) {
      cursor.render()
    }
    gl.blendEquation(gl.FUNC_ADD)
  }
}