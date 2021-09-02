import { Matrix4 } from './Math/Matrix4.js'
import { TheCanvas } from './Graphics.js'
import { FOVY } from './constants.js'
import { Input } from './Input.js'
import { currentPuzzle, delta } from './globals.js'
import { Vector3 } from './Math/Vector3.js'
import { clamp } from './utils.js'

class Camera {
  constructor () {
    this.matrix = new Matrix4()
    this.projectionMatrix = new Matrix4()
    this.projectionMatrixInverse = new Matrix4()
    this.viewMatrix = new Matrix4()
    this.x = 0
    this.y = 0
    this.zoom = 1

    document.addEventListener('wheel', this.onWheel.bind(this))
  }

  get position()
  {
    return this.matrix.getTranslation(new Vector3())
  }

  onWheel (e) {
    this.zoom *= Math.pow(2, e.deltaY * 0.001)

    this.zoom = clamp(this.zoom, 1, currentPuzzle.width / 2)
  }

  step () {
    if (Input.usingMouse) {
      if (Input.mouseX < 100) this.x -= delta * (100 - Input.mouseX) / 10
      if (Input.mouseY < 100) this.y += delta * (100 - Input.mouseY) / 10
      if (Input.mouseX > TheCanvas.width - 100) this.x += delta * (Input.mouseX - TheCanvas.width + 100) / 10
      if (Input.mouseY > TheCanvas.height - 100) this.y -= delta * (Input.mouseY - TheCanvas.height + 100) / 10
    }

    const lookAt = new Vector3(this.x, this.y, 0)
    const lookFrom = new Vector3(this.x, this.y - 5 * this.zoom, 18 * this.zoom)
    const up = new Vector3(0, 0, 1)
    this.matrix.setTranslation(lookFrom)
    this.matrix.lookAt(lookFrom, lookAt, up)

    this.viewMatrix.getInverse(this.matrix)

    this.projectionMatrix.fromPerspective(FOVY, TheCanvas.width / TheCanvas.height, 1, 1000)
    this.projectionMatrixInverse.getInverse(this.projectionMatrix)
  }

  handlePanStart (e) {

  }

  handlePanUpdate (e) {

  }

  handlePanEnd (e) {

  }

  getRayGridIntersection (x, y) {
    x = 2 * x / TheCanvas.width - 1
    y = 1 - 2 * y / TheCanvas.height

    const origin = this.position

    const direction = new Vector3(x, y, 0.5)
    direction.unproject(this)
    direction.subtract(origin)
    direction.normalize()

    return origin.addScaled(direction, -origin.z / direction.z)
  }
}

export const TheCamera = new Camera()