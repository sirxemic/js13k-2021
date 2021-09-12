import { ErrorSound, LockSound, MainSong, PlaceSound, VictorySong } from './Assets.js'
import { playSample } from './Audio.js'
import { TheCamera } from './Camera.js'
import { FSM } from './FSM.js'
import { SelectorCube } from './Geometries/SelectorCube.js'
import { currentPuzzle, currentTime } from './globals.js'
import { gl } from './Graphics.js'
import { U_MODELMATRIX, U_TIME, U_VARIANT } from './Graphics/sharedLiterals.js'
import { Input } from './Input.js'
import { Matrix4 } from './Math/Matrix4.js'
import { SelectorShader } from './Shaders/SelectorShader.js'
import { showCongratulations } from './UI.js'
import { clamp, closestModulo, noop } from './utils.js'

class Cursor {
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
      [U_TIME]: currentTime,
      [U_MODELMATRIX]: this.worldMatrix
    })
    SelectorCube.draw()
  }
}

class Brush {
  constructor (start, callback) {
    this.start = start
    this.callback = callback
  }

  handlePos (pos) {
    for (const pos2 of this.getPathFromTo(pos)) {
      if (!this.callback(pos2)) {
        break
      }
      this.start = pos2
    }
  }

  *getPathFromTo (pos) {
    const dx = pos.x - this.start.x
    const dy = pos.y - this.start.y

    let { x, y } = this.start
    while (x !== pos.x || y !== pos.y) {
      const diffX = Math.abs(x - pos.x)
      const diffY = Math.abs(y - pos.y)
      if (diffX > diffY) {
        x += Math.sign(dx)
        yield { x, y }
      } else if (diffX < diffY) {
        y += Math.sign(dy)
        yield { x, y }
      } else {
        const fromId = currentPuzzle.getIdAt({ x, y })
        const toXId = currentPuzzle.getIdAt({ x: x + Math.sign(dx), y })
        if (toXId === fromId) {
          x += Math.sign(dx)
        } else {
          y += Math.sign(dy)
        }
        yield { x, y }
      }
    }
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

    let lastCursorPos

    // Save bytes by simply not initializing booleans
    // this.hasBeenSolved = false
    this.undoStack = []

    // this.createdErrorCursor = false

    this.startTimestamp = 0

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
            const pos = this.getSpacePosAtPointer()
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
          this.startTimestamp = currentTime
          this.stateBeforeDraw = this.getState()

          lastCursorPos = this.getSpacePosAtPointer()
          this.selectedId = this.getIdAtPointer()
          this.addCursorAt(lastCursorPos)
          if (this.selectedId > -1) {
            this.createCursorsAtOppositeOf(lastCursorPos, this.selectedId)
          }
        },

        execute: () => {
          if (!Input.pointerDown) {
            const spaceAtPointer = currentPuzzle.getSpaceAt(lastCursorPos)
            if (currentTime >= this.startTimestamp + 0.2 || currentPuzzle.isLockedAt(spaceAtPointer)) {
              if (currentPuzzle.toggleLockedAt(lastCursorPos)) {
                playSample(LockSound)
              }
            } else {
              this.eraseAt(lastCursorPos)
            }
            fsm.setState(DEFAULT_STATE)
          } else {
            const pos = this.getSpacePosAtPointer()

            // Check the ID when moving over a second space to determine the action
            if (pos.x !== lastCursorPos.x || pos.y !== lastCursorPos.y) {
              if (this.selectedId === -1) {
                fsm.setState(ERASING_STATE)
              } else {
                const secondId = currentPuzzle.getIdAt(pos)
                if (secondId !== this.selectedId || currentPuzzle.isGalaxyCenter(pos)) {
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
          this.eraseAt(lastCursorPos)

          this.brush = new Brush(lastCursorPos, (pos) => {
            if (this.selectedId === -1 || currentPuzzle.getIdAt(pos) === this.selectedId) {
              this.eraseAt(pos)
              return true
            } else {
              return false
            }
          })

          this.brush.handlePos(this.getSpacePosAtPointer())
        },

        execute: () => {
          if (!Input.pointerDown) {
            fsm.setState(DEFAULT_STATE)
            return
          }

          this.brush.handlePos(this.getSpacePosAtPointer())
        },

        leave: () => {
          this.handleDrawFinish()
        }
      },

      [DRAWING_STATE]: {
        enter: () => {
          this.brush = new Brush(lastCursorPos, (pos) => {
            this.drawAt(pos)
            return currentPuzzle.getIdAt(pos) === this.selectedId
          })

          this.brush.handlePos(this.getSpacePosAtPointer())
        },

        execute: () => {
          if (!Input.pointerDown) {
            fsm.setState(DEFAULT_STATE)
            return
          }

          this.brush.handlePos(this.getSpacePosAtPointer())
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
    return currentPuzzle.grid.map(space => space.id)
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
      currentPuzzle.grid[i].id = state[i]
    }
    currentPuzzle.updateConnections()
  }

  getSpacePosAtPointer () {
    let { x, y } = TheCamera.getRayGridIntersection(Input.mouseX, Input.mouseY)

    x = Math.floor((x + 1) / 2)
    y = Math.floor((y + 1) / 2)

    if (!currentPuzzle.wrapping) {
      x = clamp(x, 0, currentPuzzle.size - 1)
      y = clamp(y, 0, currentPuzzle.size - 1)
    }

    return { x, y }
  }

  addCursorAtPointer (expected = this.selectedId) {
    this.addCursorAt(this.getSpacePosAtPointer(), expected)
  }

  createCursorsAtOppositeOf ({ x, y }, expected = this.selectedId) {
    const center = currentPuzzle.galaxies[expected].center
    const opposite = currentPuzzle.getOppositePositionFrom({ x, y }, center)

    if (currentPuzzle.wrapping) {
      opposite.x = closestModulo(x, opposite.x, currentPuzzle.size)
      opposite.y = closestModulo(y, opposite.y, currentPuzzle.size)

      for (let ix = -1; ix <= 1; ix++) {
        for (let iy = -1; iy <= 1; iy++) {
          this.addCursorAt(
            {
              x: opposite.x + ix * currentPuzzle.size,
              y: opposite.y + iy * currentPuzzle.size
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
    const pos = this.getSpacePosAtPointer()
    return currentPuzzle.getIdAt(pos)
  }

  step () {
    this.fsm.updateFSM()

    if (this.soundToPlay) {
      playSample(this.soundToPlay)
      this.soundToPlay = null
    }

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
      [U_TIME]: currentTime,
      [U_VARIANT]: 0
    })
    for (const cursor of Object.values(this.validCursors)) {
      cursor.render()
    }
  }

  renderPass2 () {
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    gl.blendEquation(gl.FUNC_REVERSE_SUBTRACT)
    SelectorShader.use({
      [U_VARIANT]: 1
    })
    for (const cursor of Object.values(this.invalidCursors)) {
      cursor.render()
    }
    gl.blendEquation(gl.FUNC_ADD)
  }
}