import { TheCanvas } from './Graphics.js'
import { TheCamera } from './Camera.js'
import { Vector3 } from './Math/Vector3.js'

export let Input = {
  x: -1000,
  y: -1000,
  mouseX: 300,
  mouseY: 300,
  dragX: 0,
  dragY: 0,
  scale: 1,
  usingMouse: false,
  pointerDown: false,
  dragging: false,

  postUpdate () {
    this.dragX = 0
    this.dragY = 0
  }
}

function pointerPosToGridPos (e) {
  const dx = 2 * e.pageX / TheCanvas.width - 1
  const dy = 1 - 2 * e.pageY / TheCanvas.height

  return TheCamera.getRayGridIntersection(dx, dy)
}

function updateMousePos (e) {
  const point = pointerPosToGridPos(e)

  Input.mouseX = e.pageX
  Input.mouseY = e.pageY
  Input.x = point.x
  Input.y = point.y
}

let touched = false

function onMouseMove (e) {
  Input.usingMouse = true
  updateMousePos(e)
}

document.body.addEventListener('mousedown', e => {
  if (!Input.usingMouse) {
    return
  }

  if (e.button === 0) {
    updateMousePos(e)
    Input.pointerDown = true
  }
})

document.body.addEventListener('mouseup', e => {
  if (!Input.usingMouse) {
    return
  }

  if (e.button === 0) {
    updateMousePos(e)
    Input.pointerDown = false
  }
})

let previousTouchPos = {}

document.addEventListener('touchstart', e => {
  if (Input.usingMouse) {
    return
  }

  e.preventDefault()

  if (!touched) {
    document.body.removeEventListener('mousemove', onMouseMove)
  }

  if (e.touches.length > 1) {
    Input.panning = true
    Input.dragX = 0
    Input.dragY = 0
  } else {
    updateMousePos(e.changedTouches[0])
    Input.pointerDown = true
  }

  for (const touch of e.touches) {
    previousTouchPos[touch.identifier] = pointerPosToGridPos(touch)
  }
})

document.addEventListener('gesturestart', function (e) {
  e.preventDefault();
})

document.addEventListener('touchmove', e => {
  e.preventDefault()

  updateMousePos(e.touches[0])

  let dx = 0
  let dy = 0
  for (const touch of e.touches) {
    const pos = pointerPosToGridPos(touch)
    dx -= pos.x - previousTouchPos[touch.identifier].x
    dy -= pos.y - previousTouchPos[touch.identifier].y
    previousTouchPos[touch.identifier] = pointerPosToGridPos(touch)
  }

  Input.dragX = dx / e.touches.length
  Input.dragY = dy / e.touches.length
})

document.addEventListener('touchend', e => {
  if (Input.usingMouse) {
    return
  }

  if (e.touches.length === 1) {
    Input.panning = false
    Input.dragX = 0
    Input.dragY = 0
  } else if (e.touches.length === 0) {
    Input.pointerDown = false
  }
})

document.body.addEventListener('mousemove', onMouseMove)