export class Vector4 {
  constructor (x, y, z, w) {
    this.x = x
    this.y = y
    this.z = z
    this.w = w
  }

  set (x, y, z, w) {
    this.x = x
    this.y = y
    this.z = z
    this.w = w
    return this
  }

  array () {
    return new Float32Array([this.x, this.y, this.z, this.w])
  }
}