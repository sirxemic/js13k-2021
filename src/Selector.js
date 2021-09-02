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
  constructor ({ x, y, isValid }) {
    super()

    this.x = x
    this.y = y
    this.isValid = isValid

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
    this.cursors = []
    this.oppositeCubes = []
    this.invalidOppositeCubes = []
    this.dragging = false

    this.selectedId = -1

    this.previousCube = null

    const fsm = this.fsm = new FSM({
      [DEFAULT_STATE]: {
        enter: () => {
          this.cursors = []
        },

        execute: () => {
          if (Input.pointerDown) {
            this.fsm.setState(DRAG_OR_DRAW_STATE)
          } else if (Input.usingMouse) {
            this.cursors = []
            this.selectedId = this.getIdAtPointer()
            this.createCursorAtPointer()
          }
        },

        leave: () => {
          this.cursors = []
        }
      },

      [DRAG_OR_DRAW_STATE]: {
        enter: () => {
          this.selectedId = this.getIdAtPointer()
          this.previousCube = this.createCursorAtPointer()
          console.log('set selected id to', this.selectedId)
        },

        execute: () => {
          if (!Input.pointerDown) {
            if (this.cursors.length === 1) {
              currentPuzzle.unsetSymmetricallyAt(this.previousCube.x, this.previousCube.y)
            }

            fsm.setState(DEFAULT_STATE)
          }
          else if (Input.panning) {
            fsm.setState(DRAGGING_CAMERA_STATE)
          } else {
            const { x, y } = this.getTilePosAtPointer()

            // Check the ID when moving over a second tile to determine the action
            const firstCube = this.previousCube
            if (x !== firstCube.x || y !== firstCube.y) {
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
        }
      },

      [ERASING_STATE]: {
        enter: () => {
          for (const cursor of this.cursors) {
            currentPuzzle.unsetSymmetricallyAt(cursor.x, cursor.y)
          }
          const { x, y } = this.getTilePosAtPointer()
          currentPuzzle.unsetSymmetricallyAt(x, y)
          this.createCursorAtPointer(-1)
        },

        execute: () => {
          if (!Input.pointerDown) {
            fsm.setState(DEFAULT_STATE)
            return
          }

          const { x, y } = this.getTilePosAtPointer()
          const previousCube = this.cursors[this.cursors.length - 1]
          const idAtCursor = this.getIdAtPointer()
          if ((idAtCursor === this.selectedId || idAtCursor === -1 || this.selectedId === -1) && (x !== previousCube.x || y !== previousCube.y)) {
            currentPuzzle.unsetSymmetricallyAt(x, y)
            this.createCursorAtPointer(-1)
          }
        }
      },

      [DRAWING_STATE]: {
        enter: () => {
          this.previousCube = this.createCursorAtPointer()
          for (const cursor of this.cursors.slice()) {
            currentPuzzle.setSymmetricallyAt(cursor.x, cursor.y, this.selectedId)
            this.createCursorsAtOppositeOf(cursor)
          }
        },

        execute: () => {
          if (!Input.pointerDown) {
            fsm.setState(DEFAULT_STATE)
            return
          }

          const { x, y } = this.getTilePosAtPointer()
          const previousCube = this.cursors[this.cursors.length - 1]
          if (x !== previousCube.x || y !== previousCube.y) {
            this.previousCube = this.createCursorAtPointer()
            currentPuzzle.setSymmetricallyAt(x, y, this.selectedId)
            this.createCursorsAtOppositeOf(this.previousCube)
          }
        }
      },

      [DRAGGING_CAMERA_STATE]: {
        enter: () => {
          this.cursors = []
        },

        execute: () => {
          if (!Input.panning) {
            fsm.setState(DEFAULT_STATE)
          }
        }
      }
    }, DEFAULT_STATE)
  }

  getTilePosAtPointer () {
    return {
      x: Math.round(Input.x / 2) + 2,
      y: Math.round(Input.y / 2) + 2
    }
  }

  createCursorAtPointer (expected = this.selectedId) {
    const { x, y } = this.getTilePosAtPointer()
    return this.createCursorAt(x, y, expected)
  }

  createCursorsAtOppositeOf ({ x, y }) {
    const opposite = currentPuzzle.getOpposite(x, y, this.selectedId)

    opposite.x = closestModulo(x, opposite.x, currentPuzzle.width)
    opposite.y = closestModulo(y, opposite.y, currentPuzzle.height)

    for (let ix = -1; ix <= 1; ix++) {
      for (let iy = -1; iy <= 1; iy++) {
        this.createCursorAt(
          opposite.x + ix * currentPuzzle.width,
          opposite.y + iy * currentPuzzle.height
        )
      }
    }
  }

  createCursorAt (x, y, expected = this.selectedId) {
    const id = currentPuzzle.getIdAt(x, y)

    const cursor = new Cursor({ x, y, isValid: id === expected })
    this.cursors.push(cursor)
    return cursor
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
    for (const cursor of this.cursors.filter(cursor => cursor.isValid)) {
      cursor.render()
    }
    gl.disable(gl.BLEND)
  }

  renderPass2 () {
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    gl.blendEquation(gl.FUNC_REVERSE_SUBTRACT)
    SelectorShader.use()
    for (const cursor of this.cursors.filter(cursor => !cursor.isValid)) {
      cursor.render()
    }
    gl.disable(gl.BLEND)
  }
}