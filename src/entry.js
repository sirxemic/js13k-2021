import { TheCamera } from './Camera.js'
import { gl, TheCanvas } from './Graphics.js'
import { Input } from './Input.js'
import { delta, setCurrentPuzzle, setDelta } from './globals.js'
import { updateUI } from './UI.js'
import { clamp } from './utils.js'
import { Puzzle } from './Puzzle.js'
import { loadAssets } from './Assets.js'
import { loadProgress } from './Progress.js'
import { PuzzleRenderer } from './PuzzleRenderer.js'
import { Grid } from './Grid.js'
import { Selector } from './Selector.js'
import { StarsLayer } from './StarsLayer.js'

function resizeCanvas () {
  TheCanvas.width = window.innerWidth
  TheCanvas.height = window.innerHeight
}

resizeCanvas()
window.onresize = resizeCanvas

loadProgress()

setCurrentPuzzle(new Puzzle(5, 5))

const renderer = new PuzzleRenderer()
const grid = new Grid()
const selector = new Selector()
const bg = new StarsLayer(-2)
const fg = new StarsLayer(4)
const fg2 = new StarsLayer(8)

function step () {
  TheCamera.step()

  selector.step()

  Input.postUpdate()
}

function render () {
  gl.viewport(0, 0, TheCanvas.width, TheCanvas.height)
  gl.clearColor(0, 0, 0, 1)
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

  bg.render()
  grid.render()
  selector.render()
  renderer.render()
  selector.renderPass2()
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
