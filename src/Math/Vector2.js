export class Vector2 {
  constructor (x, y) {
    this.x = x
    this.y = y
  }

  set (x, y) {
    this.x = x
    this.y = y
    return this
  }

  copy (vec) {
    this.x = vec.x
    this.y = vec.y
    return this
  }

  length () {
    return Math.sqrt(this.x ** 2 + this.y ** 2)
  }

  isZero () {
    return this.length === 0
  }

  normalize () {
    const length = this.length()
    this.x /= length
    this.y /= length
    return this
  }

  multiplyScalar (scalar) {
    this.x *= scalar
    this.y *= scalar
    return this
  }

  subVectors (v1, v2) {
    return this.set(
      v1.x - v2.x,
      v1.y - v2.y
    )
  }

  clone () {
    return new Vector2(this.x, this.y)
  }

  array () {
    return new Float32Array([this.x, this.y])
  }
}