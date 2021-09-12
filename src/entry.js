import { TheCamera } from './Camera.js'
import { gl, TheCanvas } from './Graphics.js'
import { delta, puzzleSettings, setCurrentPuzzle, setDelta, updatePuzzleSettings, updateTime } from './globals.js'
import {
  bindDifficultySelect,
  bindStart,
  bindNewGame,
  bindRestart,
  bindSolve,
  bindUndo,
  bindTutorial,
  bindTutorialEnd,

  hideButtons,
  hideCongratulations,
  showButtons,
  toggleUndo,
  updateDifficultyButton,

  start,
  showTutorial
} from './UI.js'
import { clamp } from './utils.js'
import { loadAssets, MainSong } from './Assets.js'
import { PuzzleRenderer } from './PuzzleRenderer.js'
import { Selector } from './Selector.js'
import { StarsLayer } from './StarsLayer.js'
import { FSM } from './FSM.js'
import { PuzzleGenerator } from './PuzzleGenerator.js'
import { TheAudioContext } from './Audio/Context.js'
import { Puzzle } from './Puzzle.js'
import { Vector2 } from './Math/Vector2.js'

function resizeCanvas () {
  TheCanvas.width = window.innerWidth
  TheCanvas.height = window.innerHeight
  TheCamera.updateMaxZoom()
}

window.onresize = resizeCanvas

/**
 * Global graphics
 */
const bg = new StarsLayer(-2)
const fg = new StarsLayer(5)

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
const TUTORIAL_FADE = 5
const TUTORIAL = 6

async function playMusic () {
  await TheAudioContext.resume()
  if (!MainSong.playing) {
    MainSong.play()
  }
}

const mainFSM = new FSM({
  [INTRO]: {
    enter () {
      const puzzle = new PuzzleGenerator(puzzleSettings).generate()
      setCurrentPuzzle(puzzle)

      resizeCanvas()

      renderer = new PuzzleRenderer()
      TheCamera.reset()

      bindStart(() => {
        playMusic()
        mainFSM.setState(PUZZLE_STATE)
      })

      bindTutorial(() => {
        if (mainFSM.activeState !== TUTORIAL) {
          playMusic()
          mainFSM.setState(TUTORIAL_FADE)
        }
      })

      bindTutorialEnd(() => {
        mainFSM.setState(PUZZLE_FADE_OUT)
      })

      bindDifficultySelect((settings) => {
        updatePuzzleSettings(settings)
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

      bindSolve(() => {
        if (selector) {
          selector.solvePuzzle()
        }
      })

      start()
    }
  },

  [TUTORIAL_FADE]: {
    enter () {
      transitionTime = 0
      renderer.handleCancel()
    },

    execute () {
      transitionTime += delta
      if (transitionTime >= 0.5) {
        mainFSM.setState(TUTORIAL)
      }
    }
  },

  [TUTORIAL]: {
    enter () {
      showTutorial()

      const puzzle = new Puzzle(6, [
        { center: new Vector2(1, 0.5), spaces: [] },
        { center: new Vector2(2, 1.5), spaces: [] },
        { center: new Vector2(4, 0.5), spaces: [] },
        { center: new Vector2(4.5, 2.5), spaces: [] },
        { center: new Vector2(0.5, 2.5), spaces: [] },
        { center: new Vector2(2, 3.5), spaces: [] },
        { center: new Vector2(3.5, 4.5), spaces: [] },
        { center: new Vector2(2.5, 5.5), spaces: [] },
        { center: new Vector2(5.5, 3), spaces: [] }
      ], false)
      puzzle.setSymmetricallyAt({ x: 0, y: 1 }, 1)
      puzzle.setSymmetricallyAt({ x: 1, y: 2 }, 1)
      setCurrentPuzzle(puzzle)
      renderer = new PuzzleRenderer()
      selector = new Selector()
      TheCamera.reset()
      TheCamera.y = 2
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
      showButtons()

      bindRestart(() => {
        selector.resetPuzzle()
      })
    },

    leave () {
      hideButtons()
    }
  },

  [PUZZLE_FADE_OUT]: {
    enter () {
      transitionTime = 0
      selector = null
      renderer.handleCancel()
      hideCongratulations()
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
    if (mainFSM.activeState === PUZZLE_STATE) {
      toggleUndo(selector.canUndo())
    }
  }
  renderer.step()
}

function render () {
  gl.viewport(0, 0, TheCanvas.width, TheCanvas.height)
  gl.clearColor(0.02, 0, 0.05, 1)
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

  bg.render()
  if (selector) {
    selector.render()
  }
  renderer.render()
  if (selector) {
    selector.renderPass2()
  }
  fg.render()
}

let lastTime = 0
function tick (time) {
  setDelta(clamp((time - lastTime) / 1000, 0.001, 0.5))
  updateTime()
  lastTime = time
  if (!isNaN(delta)) {
    step()
    render()
    updateDifficultyButton(puzzleSettings)
  }

  requestAnimationFrame(tick)
}

loadAssets().then(tick)
