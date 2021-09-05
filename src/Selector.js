import { ErrorSound, MainSong, PlaceSound, VictorySong } from './Assets.js'
import { playSample } from './Audio.js'
import { TheCamera } from './Camera.js'
import { FSM } from './FSM.js'
import { SelectorCube } from './Geometries/SelectorCube.js'
import { currentPuzzle } from './globals.js'
import { gl } from './Graphics.js'
import { U_MODELMATRIX, U_TIME, U_VARIANT } from './Graphics/sharedLiterals.js'
import { Input } from './Input.js'
import { Matrix4 } from './Math/Matrix4.js'
import { SelectorShader } from './Shaders/SelectorShader.js'
import { showCongratulations, toggleUndo } from './UI.js'
import { clamp, closestModulo, noop } from './utils.js'

export class Cursor {
  constructor ({ x, y }) {
    this.x = x
    this.y = y

    this.worldMatrix = new Matrix4([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      this.x * 2, this.y * 2, 0, 1
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

    let lastCursorPos = null
    let preventAccidentalDraw = false

    this.hasBeenSolved = false
    this.undoStack = []

    this.createdErrorCursor = false

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
          this.stateBeforeDraw = this.getState()

          lastCursorPos = this.getTilePosAtPointer()
          this.selectedId = this.getIdAtPointer()
          this.addCursorAt(lastCursorPos)
          if (this.selectedId > -1) {
            this.createCursorsAtOppositeOf(lastCursorPos, this.selectedId)
          }
        },

        execute: () => {
          if (!Input.pointerDown) {
            this.eraseAt(lastCursorPos)
            fsm.setState(DEFAULT_STATE)
          } else {
            const { x, y } = this.getTilePosAtPointer()

            // Check the ID when moving over a second tile to determine the action
            if (x !== lastCursorPos.x || y !== lastCursorPos.y) {
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
          this.handleDrawFinish()
          this.clearCursors()
        }
      },

      [ERASING_STATE]: {
        enter: () => {
          const currentCursorPos = this.getTilePosAtPointer()

          this.eraseAt(lastCursorPos)
          this.eraseAt(currentCursorPos)

          lastCursorPos = currentCursorPos
        },

        execute: () => {
          if (!Input.pointerDown) {
            fsm.setState(DEFAULT_STATE)
            return
          }

          const currentCursorPos = this.getTilePosAtPointer()
          const idAtCursor = this.getIdAtPointer()
          if (
            (currentCursorPos.x !== lastCursorPos.x || currentCursorPos.y !== lastCursorPos.y) &&
            (idAtCursor === this.selectedId || idAtCursor === -1 || this.selectedId === -1)
          ) {
            this.eraseAt(currentCursorPos)
            lastCursorPos = currentCursorPos
          }
        },

        leave: () => {
          this.handleDrawFinish()
        }
      },

      [DRAWING_STATE]: {
        enter: () => {
          const currentPos = this.getTilePosAtPointer()
          this.drawAt(currentPos)
        },

        execute: () => {
          if (!Input.pointerDown) {
            fsm.setState(DEFAULT_STATE)
            return
          }

          const currentCursorPos = this.getTilePosAtPointer()
          const idAtCursor = currentPuzzle.getIdAt(currentCursorPos)

          if (preventAccidentalDraw && idAtCursor === this.selectedId) {
            preventAccidentalDraw = false
          }

          if (!preventAccidentalDraw && (currentCursorPos.x !== lastCursorPos.x || currentCursorPos.y !== lastCursorPos.y)) {
            this.drawAt(currentCursorPos)
            lastCursorPos = currentCursorPos

            if (idAtCursor !== this.selectedId) {
              preventAccidentalDraw = true
            }
          }
        },

        leave: () => {
          this.handleDrawFinish()
        }
      },

      [MOVING_CAMERA_STATE]: {
        enter: () => {
          this.clearCursors()

          Input.onPanUpdate = (e) => {
            TheCamera.handlePanUpdate(e)
          }

          Input.onPanEnd = (e) => {
            fsm.setState(AFTER_MOVING_CAMERA_STATE)
            TheCamera.handlePanEnd(e)
          }
        },

        leave: () => {
          Input.onPanEnd = noop
          Input.onPanUpdate = noop
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
      if (fsm.activeState !== MOVING_CAMERA_STATE) {
        fsm.setState(MOVING_CAMERA_STATE)
        TheCamera.handlePanStart(e)
      }
    }
  }

  handleStateChange (beforeState, afterState) {
    if (beforeState.toString() !== afterState.toString()) {
      this.undoStack.push(beforeState)
    }
  }

  resetPuzzle () {
    const stateBefore = this.getState()
    currentPuzzle.reset()
    const stateAfter = this.getState()

    this.handleStateChange(stateBefore, stateAfter)
  }

  solvePuzzle () {
    this.hasBeenSolved = true

    const stateBefore = this.getState()
    currentPuzzle.solve()
    const stateAfter = this.getState()

    this.handleStateChange(stateBefore, stateAfter)
  }

  clearCursors () {
    this.validCursors = {}
    this.invalidCursors = {}
  }

  handleDrawFinish () {
    this.handleStateChange(this.stateBeforeDraw, this.getState())
  }

  getState () {
    return currentPuzzle.tiles.map(tile => tile.id)
  }

  drawAt (pos) {
    const updated = currentPuzzle.setSymmetricallyAt(pos, this.selectedId)
    const addedCursor = this.addCursorAt(pos)
    this.createCursorsAtOppositeOf(pos)

    if (updated) {
      this.soundToPlay = PlaceSound
    } else if (addedCursor && currentPuzzle.getIdAt(pos) !== this.selectedId) {
      this.soundToPlay = ErrorSound
    }
  }

  eraseAt (pos) {
    const updated = currentPuzzle.unsetSymmetricallyAt(pos)
    const addedCursor = this.addCursorAt(pos, -1)

    if (updated) {
      this.soundToPlay = PlaceSound
    } else if (addedCursor && currentPuzzle.getIdAt(pos) !== -1) {
      this.soundToPlay = ErrorSound
    }
  }

  canUndo () {
    return this.undoStack.length > 0
  }

  undo () {
    const state = this.undoStack.pop()
    if (!state) {
      return
    }

    for (let i = 0; i < state.length; i++) {
      currentPuzzle.tiles[i].id = state[i]
    }
    currentPuzzle.updateConnections()
  }

  getTilePosAtPointer () {
    let { x, y } = TheCamera.getRayGridIntersection(Input.mouseX, Input.mouseY)

    x = Math.floor((x + 1) / 2)
    y = Math.floor((y + 1) / 2)

    if (!currentPuzzle.wrapping) {
      x = clamp(x, 0, currentPuzzle.width - 1)
      y = clamp(y, 0, currentPuzzle.height - 1)
    }

    return { x, y }
  }

  addCursorAtPointer (expected = this.selectedId) {
    this.addCursorAt(this.getTilePosAtPointer(), expected)
  }

  createCursorsAtOppositeOf ({ x, y }, expected = this.selectedId) {
    const opposite = currentPuzzle.getOpposite({ x, y }, expected)

    if (currentPuzzle.wrapping) {
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
    } else {
      this.addCursorAt(
        {
          x: opposite.x,
          y: opposite.y
        },
        expected
      )
    }
  }

  addCursorAt (pos, expected = this.selectedId) {
    const id = currentPuzzle.getIdAt(pos)

    const targetCollection = id === expected ? this.validCursors : this.invalidCursors

    const key = `${pos.x},${pos.y}`
    if (targetCollection[key]) {
      return false
    }

    targetCollection[key] = new Cursor(pos)

    return true
  }

  getIdAtPointer () {
    const pos = this.getTilePosAtPointer()
    return currentPuzzle.getIdAt(pos)
  }

  step () {
    this.fsm.updateFSM()

    if (this.soundToPlay) {
      playSample(this.soundToPlay)
      this.soundToPlay = null
    }

    toggleUndo(this.canUndo())

    if (!this.hasBeenSolved && currentPuzzle.isSolved()) {
      this.hasBeenSolved = true
      VictorySong.play()
      MainSong.duckForABit()
      showCongratulations()
    }
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