import { Matrix4 } from './Math/Matrix4'
import { TheCanvas } from './Graphics'
import { FOVX } from './constants'
import { tempVector1, tempVector2, tempVector3 } from './temps'

class Camera {
  constructor () {
    this.matrix = new Matrix4()
    this.projectionMatrix = new Matrix4()
    this.projectionMatrixInverse = new Matrix4()
    this.viewMatrix = new Matrix4()
  }

  step () {
    const x = 0
    const lookAt = tempVector1
    lookAt.set(x, 0, 0)
    const lookFrom = tempVector2
    lookFrom.set(x, -10, 20)
    const up = tempVector3
    up.set(0, 0, 1)
    this.matrix.setTranslation(lookFrom)
    this.matrix.lookAt(lookFrom, lookAt, up)

    this.viewMatrix.getInverse(this.matrix)

    this.projectionMatrix.fromPerspective(FOVX, TheCanvas.width / TheCanvas.height, 1, 1000)
    this.projectionMatrixInverse.getInverse(this.projectionMatrix)
  }
}

export const TheCamera = new Camera()