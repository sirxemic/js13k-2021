import { noop } from './utils.js'

export let Input = {
  x: -1000,
  y: -1000,
  mouseX: 300,
  mouseY: 300,
  scale: 1,
  usingMouse: false,
  pointerDown: false,

  onPanStart: noop,
  onPanUpdate: noop,
  onPanEnd: noop
}

function updateMousePos (e) {
  Input.mouseX = e.pageX
  Input.mouseY = e.pageY
}

let touched = false

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

document.addEventListener('gesturestart', e => {
  e.preventDefault()
})

let touchStartPositions = {}

function onMouseMove (e) {
  Input.usingMouse = true
  updateMousePos(e)
}

function onTouchStart(e) {
  if (Input.usingMouse) {
    return
  }

  if (!touched) {
    document.body.removeEventListener('mousemove', onMouseMove)
  }

  for (const touch of e.changedTouches) {
    touchStartPositions[touch.identifier] = touch
  }

  if (e.touches.length > 1) {
    Input.onPanStart(touchStartPositions)
  } else {
    updateMousePos(e.changedTouches[0])
    Input.pointerDown = true
  }
}

function onTouchMove (e) {
  updateMousePos(e.touches[0])

  const touchPositions = {}
  for (const touch of e.touches) {
    touchPositions[touch.identifier] = touch
  }

  Input.onPanUpdate(touchPositions)
}

function onTouchEnd (e) {
  for (const touch of e.changedTouches) {
    delete touchStartPositions[touch.identifier]
  }

  if (Input.usingMouse) {
    return
  }

  if (e.touches.length <= 1) {
    Input.pointerDown = false
    Input.onPanEnd()
  }
}

document.body.addEventListener('mousemove', onMouseMove)

document.addEventListener('touchstart', onTouchStart)
document.addEventListener('touchmove', onTouchMove)
document.addEventListener('touchend', onTouchEnd)
document.addEventListener('touchcancel', onTouchEnd)
