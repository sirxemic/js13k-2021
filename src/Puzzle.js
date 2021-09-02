import { TheCamera } from './Camera.js'
import { Vector2 } from './Math/Vector2.js'
import { Vector4 } from './Math/Vector4.js'

export class Puzzle {
  constructor (width, height) {
    this.width = width
    this.height = height

    this.gridOffset = {
      x: this.width / 2 - 0.5,
      y: this.height / 2 - 0.5
    }

    TheCamera.setPosition(0, 0)

    this.centers = [
      new Vector2(2, 1),
      new Vector2(0.5, 2),
      new Vector2(3, 4.5),
      new Vector2(2.5, 2.5),
      new Vector2(4.5, 2.5)
    ]

    this.colorIds = [
      0, 1, 2, 3, 4
    ]

    this.tiles = Array.from(
      { length: width * height },
      (_, index) => {
        const x = index % width
        const y = Math.floor(index / width)
        return { x, y, id: -1 }
      }
    )

    ;[
      { x: 0, y: 0},
      { x: 1, y: 0},
      { x: 2, y: 0},
      { x: 1, y: 1},
      { x: 2, y: 1},
      { x: 3, y: 1},
      { x: 3, y: 2},
      { x: 3, y: 3},
      { x: 0, y: 4},
      { x: 0, y: 3},
      { x: 4, y: 3}
    ].forEach(item => {
      const tile = this.getTileAt(item.x, item.y)
      tile.id = 0
    })

    ;[
      { x: 0, y: 1},
      { x: 0, y: 2},
      { x: 1, y: 2},
      { x: 1, y: 3},
      { x: 4, y: 1},
      { x: 4, y: 0}
    ].forEach(item => {
      const tile = this.getTileAt(item.x, item.y)
      tile.id = 1
    })

    ;[
      { x: 1, y: 4},
      { x: 2, y: 4},
      { x: 3, y: 4},
      { x: 4, y: 4},
      { x: 2, y: 3},
      { x: 3, y: 5}
    ].forEach(item => {
      const tile = this.getTileAt(item.x, item.y)
      tile.id = 2
    })

    ;[
      { x: 2, y: 2}
    ].forEach(item => {
      const tile = this.getTileAt(item.x, item.y)
      tile.id = 3
    })

    ;[
      { x: 4, y: 2}
    ].forEach(item => {
      const tile = this.getTileAt(item.x, item.y)
      tile.id = 4
    })

    this.updateConnections()
  }

  getTileAt(x, y) {
    if (window.BLAAT) console.log(x, y)
    if (x < 0) x %= this.width
    x = (x + this.width) % this.width
    if (y < 0) y %= this.height
    y = (y + this.height) % this.height
    if (window.BLAAT) console.log(x, y)
    return this.tiles[x + y * this.width]
  }

  getIdAt(x, y) {
    return this.getTileAt(x, y).id
  }

  setAt (x, y, id) {
    this.getTileAt(x, y).id = id
  }

  setSymmetricallyAt (x, y, id) {
    const opposite = this.getOpposite(x, y, id)

    for (const center of this.centers) {
      if (this.touchesCenter(x, y, center)) {
        return
      }
      if (this.touchesCenter(opposite.x, opposite.y, center)) {
        return
      }
    }

    // TODO: check if this even is intuitive
    let oldId = this.getIdAt(x, y)
    if (oldId !== -1 && oldId !== id) {
      const opposite2 = this.getOpposite(x, y, oldId)
      if (this.canUnsetAt(opposite2.x, opposite2.y)) {
        this.setAt(opposite2.x, opposite2.y, -1)
      }
    }

    // TODO: check if this even is intuitive
    oldId = this.getIdAt(opposite.x, opposite.y)
    if (oldId !== -1 && oldId !== id) {
      const oppositeOpposite = this.getOpposite(opposite.x, opposite.y, oldId)
      if (this.canUnsetAt(oppositeOpposite.x, oppositeOpposite.y)) {
        this.setAt(oppositeOpposite.x, oppositeOpposite.y, -1)
      }
    }

    this.setAt(x, y, id)
    this.setAt(opposite.x, opposite.y, id)

    this.updateConnections()
  }

  getOpposite (x, y, id) {
    const center = this.centers[id]
    return {
      x: 2 * center.x - x - 1,
      y: 2 * center.y - y - 1
    }
  }

  unsetSymmetricallyAt (x, y) {
    console.log('unset Symmetrically At', x, y)
    const id = this.getIdAt(x, y)
    if (id < 0) {
      return
    }


    if (this.canUnsetAt(x, y)) {
      this.setAt(x, y, -1)

      const opposite = this.getOpposite(x, y, id)

      if (this.canUnsetAt(opposite.x, opposite.y)) {
        this.setAt(opposite.x, opposite.y, -1)
      }

      this.updateConnections()
    }
  }

  canUnsetAt (x, y) {
    for (const center of this.centers) {
      if (this.touchesCenter(x, y, center)) {
        return false
      }
    }

    return true
  }

  touchesCenter (x, y, center) {
    if (x < 0) x %= this.width
    x = (x + this.width) % this.width
    if (y < 0) y %= this.height
    y = (y + this.height) % this.height
    if (
      Math.abs((x + 0.5) - center.x) < 1 &&
      Math.abs((y + 0.5) - center.y) < 1) {
      return true
    }
    return false
  }

  isConnectedAt(id, x, y) {
    return this.getTileAt(x, y).id === id
  }

  updateConnections () {
    this.connections = this.tiles.map(({ x, y, id }) => {
      const tileLeft = this.isConnectedAt(id, x - 1, y)
      const tileRight = this.isConnectedAt(id, x + 1, y)
      const tileDown = this.isConnectedAt(id, x, y - 1)
      const tileUp = this.isConnectedAt(id, x, y + 1)
      const tileUpLeft = tileLeft && tileUp && this.isConnectedAt(id, x - 1, y + 1)
      const tileUpRight = tileRight && tileUp && this.isConnectedAt(id, x + 1, y + 1)
      const tileDownLeft = tileLeft && tileDown && this.isConnectedAt(id, x - 1, y - 1)
      const tileDownRight = tileRight && tileDown && this.isConnectedAt(id, x + 1, y - 1)

      let h = tileLeft && tileRight ? 2 : tileLeft ? -1 : tileRight ? 1 : 0
      let v = tileUp && tileDown ? 2 : tileDown ? -1 : tileUp ? 1 : 0

      return new Vector4(
        h,
        v,
        tileUpRight && tileDownLeft ? 2 : tileUpRight ? 1 : tileDownLeft ? -1 : 0,
        tileUpLeft && tileDownRight ? 2 : tileUpLeft ? 1 : tileDownRight ? -1 : 0
      )
    })
  }

  getConnection (x, y) {
    return this.connections[x + y * this.width]
  }
}
