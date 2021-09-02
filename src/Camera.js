import { Matrix4 } from './Math/Matrix4.js'
import { TheCanvas } from './Graphics.js'
import { FOVY } from './constants.js'
import { tempVector1, tempVector2, tempVector3 } from './temps.js'
import { Input } from './Input.js'
import { delta } from './globals.js'

class Camera {
  constructor () {
    this.matrix = new Matrix4()
    this.projectionMatrix = new Matrix4()
    this.projectionMatrixInverse = new Matrix4()
    this.viewMatrix = new Matrix4()
    this.x = 0
    this.y = 0
  }

  setPosition (x, y) {
    this.x = x
    this.y = y
  }

  step () {
    if (Input.dragging) {
      this.x += Input.dragX
      this.y += Input.dragY
    }
    else if (Input.usingMouse) {
      if (Input.mouseX < 100) this.x -= delta * (100 - Input.mouseX) / 10
      if (Input.mouseY < 100) this.y += delta * (100 - Input.mouseY) / 10
      if (Input.mouseX > TheCanvas.width - 100) this.x += delta * (Input.mouseX - TheCanvas.width + 100) / 10
      if (Input.mouseY > TheCanvas.height - 100) this.y -= delta * (Input.mouseY - TheCanvas.height + 100) / 10
    }

    const lookAt = tempVector1.set(this.x, this.y, 0)
    const lookFrom = tempVector2.set(this.x, this.y - 15, 30)
    const up = tempVector3.set(0, 0, 1)
    this.matrix.setTranslation(lookFrom)
    this.matrix.lookAt(lookFrom, lookAt, up)

    this.viewMatrix.getInverse(this.matrix)

    this.projectionMatrix.fromPerspective(FOVY, TheCanvas.width / TheCanvas.height, 1, 1000)
    this.projectionMatrixInverse.getInverse(this.projectionMatrix)
  }

  getRayGridIntersection (x, y) {
    const origin = this.matrix.getTranslation(tempVector1)

    const direction = tempVector2.set(x, y, 0.5)
    direction.unproject(this)
    direction.subtract(origin)
    direction.normalize()

    return origin.addScaled(direction, -origin.z / direction.z)
  }
}

export const TheCamera = new Camera()