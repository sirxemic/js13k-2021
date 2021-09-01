import { TheCanvas } from './Graphics'
import { TheCamera } from './Camera'
import { Vector3 } from './Math/Vector3'

export let Input = {
  x: -1000,
  y: -1000,
  scale: 1,
  mousePress: 0,

  postUpdate () {
    Input.mousePress = 0
  }
}

function updateMousePos (e) {
  const dx = 2 * e.pageX / TheCanvas.width - 1
  const dy = 1 - 2 * e.pageY / TheCanvas.height

  const origin = TheCamera.matrix.getTranslation(new Vector3())

  const direction = new Vector3(dx, dy, 0.5)
  direction.unproject(TheCamera)
  direction.subtract(origin)
  direction.normalize()

  const t = origin.z / direction.z

  const intersection = origin.addScaled(direction, -t)

  Input.x = intersection.x
  Input.y = intersection.y
}

let touched = false
let usingMouse = false

function onMouseMove (e) {
  usingMouse = true
  updateMousePos(e)
}

document.body.addEventListener('mousedown', e => {
  if (!usingMouse) {
    return
  }

  if (e.button === 0) {
    updateMousePos(e)
    Input.mousePress = 1
  }
})

document.addEventListener('touchstart', e => {
  if (usingMouse) {
    return
  }

  if (!touched) {
    document.body.removeEventListener('mousemove', onMouseMove)
  }

  updateMousePos(e.changedTouches[0])
  Input.mousePress = 1
})

document.body.addEventListener('mousemove', onMouseMove)