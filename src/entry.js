import { TheCamera } from './Camera'
import { gl, TheCanvas } from './Graphics'
import { Input } from './Input'
import { delta, setDelta } from './globals'
import { updateUI } from './UI'
import { clamp } from './utils'
import { Puzzle } from './Puzzle'
import { loadAssets } from './Assets'
import { loadProgress } from './Progress'

function resizeCanvas () {
  TheCanvas.width = window.innerWidth
  TheCanvas.height = window.innerHeight
}

resizeCanvas()
window.onresize = resizeCanvas

loadProgress()

const currentPuzzle = new Puzzle(5, 5)

function step () {
  TheCamera.step()

  currentPuzzle.step()

  Input.postUpdate()
}

function render () {
  gl.viewport(0, 0, TheCanvas.width, TheCanvas.height)
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

  currentPuzzle.render()
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
