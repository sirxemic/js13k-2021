export let Input = {
  x: -1000,
  y: -1000,
  mouseX: 300,
  mouseY: 300,
  scale: 1,
  usingMouse: false,
  pointerDown: false,

  onPanStart: () => {},
  onPanUpdate: () => {},
  onPanEnd: () => {},

  postUpdate () {
    this.panX = 0
    this.panY = 0
  }
}

function updateMousePos (e) {
  Input.mouseX = e.pageX
  Input.mouseY = e.pageY
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

let touchStartPositions = {}

document.addEventListener('touchstart', e => {
  if (Input.usingMouse) {
    return
  }

  e.preventDefault()

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
})

document.addEventListener('gesturestart', e => {
  e.preventDefault()
})

document.addEventListener('touchmove', e => {
  e.preventDefault()

  updateMousePos(e.touches[0])

  const touchPositions = {}
  for (const touch of e.touches) {
    touchPositions[touch.identifier] = touch
  }

  Input.onPanUpdate(touchPositions)
})

function handleTouchEnd (e) {
  for (const touch of e.changedTouches) {
    delete touchStartPositions[touch.identifier]
  }

  if (Input.usingMouse) {
    return
  }

  if (e.touches.length === 1) {
    Input.onPanEnd()
  } else if (e.touches.length === 0) {
    Input.pointerDown = false
  }
}

document.addEventListener('touchend', handleTouchEnd)
document.addEventListener('touchcancel', handleTouchEnd)

document.body.addEventListener('mousemove', onMouseMove)