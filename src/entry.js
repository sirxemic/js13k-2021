import { TheCamera } from './Camera.js'
import { gl, TheCanvas } from './Graphics.js'
import { currentPuzzle, delta, setCurrentPuzzle, setDelta } from './globals.js'
import { bindDifficultySelect, bindIntroDismiss, bindNewGame, bindUndo, toggleUndo, updateDifficultyButton } from './UI.js'
import { clamp } from './utils.js'
import { loadAssets } from './Assets.js'
import { loadProgress } from './Progress.js'
import { PuzzleRenderer } from './PuzzleRenderer.js'
import { Grid } from './Grid.js'
import { Selector } from './Selector.js'
import { StarsLayer } from './StarsLayer.js'
import { FSM } from './FSM.js'
import { PuzzleGenerator } from './PuzzleGenerator.js'

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
const INTRO = 1
const PUZZLE_FADE_IN = 2
const PUZZLE_STATE = 3
const PUZZLE_FADE_OUT = 4
const PUZZLE_SOLVED = 5

let puzzleSettings = {
  width: 7,
  height: 7,
  difficulty: 0,
  wrapping: false
}

const mainFSM = new FSM({
  [INTRO]: {
    enter () {
      const puzzle = new PuzzleGenerator(puzzleSettings).generate()
      setCurrentPuzzle(puzzle)
      renderer = new PuzzleRenderer()
      TheCamera.reset()

      bindIntroDismiss(() => {
        mainFSM.setState(PUZZLE_STATE)
      })

      bindDifficultySelect((settings) => {
        puzzleSettings = settings

        mainFSM.setState(PUZZLE_FADE_OUT)
      })

      bindNewGame(() => {
        mainFSM.setState(PUZZLE_FADE_OUT)
      })

      bindUndo(() => {
        if (selector) {
          selector.undo()
        }
      })
    }
  },

  [PUZZLE_FADE_IN]: {
    enter () {
      const puzzle = new PuzzleGenerator(puzzleSettings).generate()
      setCurrentPuzzle(puzzle)
      renderer = new PuzzleRenderer()
      toggleUndo(false)
      TheCamera.reset()
    },

    execute () {
      if (renderer.fadeAmount < 0.2) {
        mainFSM.setState(PUZZLE_STATE)
      }
    }
  },

  [PUZZLE_STATE]: {
    enter () {
      selector = new Selector()
    },

    execute () {
      if (currentPuzzle.isSolved()) {
        mainFSM.setState(PUZZLE_SOLVED)
      }
    }
  },

  [PUZZLE_SOLVED]: {
    enter () {
      selector = null
    }
  },

  [PUZZLE_FADE_OUT]: {
    enter () {
      transitionTime = 0
      selector = null
      renderer.handleCancel()
    },

    execute () {
      transitionTime += delta
      if (transitionTime >= 0.5) {
        mainFSM.setState(PUZZLE_FADE_IN)
      }
    }
  }
}, INTRO)

/**
 * Game loop stuff
 */
function step () {
  mainFSM.updateFSM()

  TheCamera.step()
  if (selector) { // closure compiler doesn't like the ?. operator here and in render :(
    selector.step()
  }
  renderer.step()
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
  setDelta(clamp((time - lastTime) / 1000, 0.001, 0.5))
  lastTime = time
  if (!isNaN(delta)) {
    step()
    render()

    toggleUndo(selector?.canUndo())
    updateDifficultyButton(puzzleSettings)
  }

  requestAnimationFrame(tick)
}

loadAssets().then(tick)
