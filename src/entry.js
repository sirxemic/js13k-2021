import { TheCamera } from './Camera.js'
import { gl, TheCanvas } from './Graphics.js'
import { Input } from './Input.js'
import { currentPuzzle, delta, setCurrentPuzzle, setDelta } from './globals.js'
import { updateUI } from './UI.js'
import { clamp } from './utils.js'
import { Puzzle } from './Puzzle.js'
import { loadAssets } from './Assets.js'
import { loadProgress } from './Progress.js'
import { PuzzleRenderer } from './PuzzleRenderer.js'
import { Grid } from './Grid.js'
import { Selector } from './Selector.js'
import { StarsLayer } from './StarsLayer.js'
import { FSM } from './FSM.js'

function resizeCanvas () {
  TheCanvas.width = window.innerWidth
  TheCanvas.height = window.innerHeight
}

resizeCanvas()
window.onresize = resizeCanvas

loadProgress()

/**
 * Global graphics
 */
const grid = new Grid()
const bg = new StarsLayer(-2)
const fg = new StarsLayer(4)
const fg2 = new StarsLayer(8)

// Some shared variables for the different states
let renderer
let selector
let transitionTime

/**
 * The main state machine
 */
const PUZZLE_STATE = '1'
const PUZZLE_END_TRANSITION = '2'

const mainFSM = new FSM({
  [PUZZLE_STATE]: {
    enter () {
      setCurrentPuzzle(new Puzzle(5, 5))
      renderer = new PuzzleRenderer()
      selector = new Selector()
      TheCamera.x %= 2
      TheCamera.y %= 2
    },

    execute () {
      if (currentPuzzle.isSolved()) {
        mainFSM.setState(PUZZLE_END_TRANSITION)
      }
    }
  },

  [PUZZLE_END_TRANSITION]: {
    enter () {
      transitionTime = 0
      selector = null
      renderer.finishUp()
    },

    execute () {
      transitionTime += delta
      if (transitionTime >= 2) {
        mainFSM.setState(PUZZLE_STATE)
      }
    }
  }
}, PUZZLE_STATE)

function step () {
  mainFSM.updateFSM()

  TheCamera.step()
  if (selector) { // closure compiler doesn't like the ?. operator here and in render :(
    selector.step()
  }
  renderer.step()

  Input.postUpdate()
}

function render () {
  gl.viewport(0, 0, TheCanvas.width, TheCanvas.height)
  gl.clearColor(0.02, 0, 0.05, 1)
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

  bg.render()
  grid.render()
  if (selector) {
    selector.render()
  }
  renderer.render()
  if (selector) {
    selector.renderPass2()
  }
  fg.render()
  fg2.render()
}

let lastTime = 0
function tick (time) {
  requestAnimationFrame(tick)

  setDelta(clamp((time - lastTime) / 1000, 0.001, 0.5))
  lastTime = time
  if (isNaN(delta)) {
    return
  }

  step()
  render()

  updateUI()
}

loadAssets().then(tick)
