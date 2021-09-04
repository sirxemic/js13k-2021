import { Matrix4 } from './Math/Matrix4.js'
import { TheCanvas } from './Graphics.js'
import { FOVY } from './constants.js'
import { Input } from './Input.js'
import { currentPuzzle, delta } from './globals.js'
import { Vector3 } from './Math/Vector3.js'
import { clamp } from './utils.js'

export class Camera {
  constructor () {
    this.matrix = new Matrix4()
    this.projectionMatrix = new Matrix4()
    this.projectionMatrixInverse = new Matrix4()
    this.viewMatrix = new Matrix4()
    this.x = 0
    this.y = 0
    this.zoom = 1000

    document.addEventListener('wheel', this.onWheel.bind(this))
  }

  reset () {
    this.x = currentPuzzle.width - 1
    this.y = currentPuzzle.height - 1

    const fovX = 2 * Math.atan(TheCanvas.width / TheCanvas.height * Math.tan(FOVY / 2))
    const zX = currentPuzzle.width / Math.tan(fovX)
    const zY = currentPuzzle.height / Math.tan(FOVY)

    this.zoom = this.maxZoom = 3 * Math.max(zX, zY)
  }

  get lookAt () {
    return new Vector3(this.x, this.y, 0)
  }

  get lookFrom () {
    return new Vector3(this.x, this.y - 0.1 * this.zoom, this.zoom)
  }

  updateMatrix () {
    this.zoom = clamp(this.zoom, 16, this.maxZoom)

    const up = new Vector3(0, 1, 0)
    this.matrix.setTranslation(this.lookFrom)
    this.matrix.lookAt(this.lookFrom, this.lookAt, up)
  }

  onWheel (e) {
    this.zoom *= Math.pow(2, Math.sign(e.deltaY) * 0.04)
  }

  step () {
    if (Input.usingMouse) {
      const margin = 25
      const scale = delta

      if (Input.mouseX < margin) this.x -= (margin - Input.mouseX) * scale
      if (Input.mouseY < margin) this.y += (margin - Input.mouseY) * scale
      if (Input.mouseX > TheCanvas.width - margin) this.x += (Input.mouseX - TheCanvas.width + margin) * scale
      if (Input.mouseY > TheCanvas.height - margin) this.y -= (Input.mouseY - TheCanvas.height + margin) * scale
    }

    if (!currentPuzzle.wrapping) {
      this.x = clamp(this.x, 0, (currentPuzzle.width - 1) * 2)
      this.y = clamp(this.y, 0, (currentPuzzle.height - 1) * 2)
    }

    this.updateMatrix()

    this.viewMatrix.getInverse(this.matrix)

    this.projectionMatrix.fromPerspective(FOVY, TheCanvas.width / TheCanvas.height, 1, 1000)
    this.projectionMatrixInverse.getInverse(this.projectionMatrix)
  }

  handlePanStart (e) {
    this.panning = true
    this.targetX = this.x
    this.targetY = this.y
    this.panStartState = {
      x: this.x,
      y: this.y,
      zoom: this.zoom,
      touchStartGridPositions: {}
    }
    for (const id in e) {
      this.panStartState.touchStartGridPositions[id] = this.getRayGridIntersection(e[id].pageX, e[id].pageY)
    }
  }

  handlePanUpdate (e) {
    this.x = this.panStartState.x
    this.y = this.panStartState.y
    this.zoom = this.panStartState.zoom

    this.updateMatrix()

    const ids = Object.keys(e)
    const touchGridPositions = {}
    for (const id in e) {
      touchGridPositions[id] = this.getRayGridIntersection(e[id].pageX, e[id].pageY)
    }

    const start1 = this.panStartState.touchStartGridPositions[ids[0]]
    const start2 = this.panStartState.touchStartGridPositions[ids[1]]
    const target1 = touchGridPositions[ids[0]]
    const target2 = touchGridPositions[ids[1]]

    const originalCenter = start1.clone().add(start2).multiplyScalar(0.5)
    const originalDistance = start1.distanceTo(start2)
    const newCenter = target1.clone().add(target2).multiplyScalar(0.5)
    const newDistance = target1.distanceTo(target2)

    const zoomFactor = originalDistance / newDistance

    this.x = this.panStartState.x - (newCenter.x - originalCenter.x) * zoomFactor
    this.y = this.panStartState.y - (newCenter.y - originalCenter.y) * zoomFactor
    this.zoom = this.panStartState.zoom * zoomFactor
  }

  handlePanEnd (e) {
    this.panning = false
  }

  getRayGridIntersection (x, y) {
    x = 2 * x / TheCanvas.width - 1
    y = 1 - 2 * y / TheCanvas.height

    const origin = this.matrix.getTranslation(new Vector3())

    const direction = new Vector3(x, y, 0.5)
    direction.unproject(this)
    direction.subtract(origin)
    direction.normalize()

    return origin.addScaled(direction, -origin.z / direction.z)
  }
}

export const TheCamera = new Camera()