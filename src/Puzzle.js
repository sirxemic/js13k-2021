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
    ].forEach(pos => {
      const tile = this.getTileAt(pos)
      tile.id = 0
    })

    ;[
      { x: 0, y: 1},
      { x: 0, y: 2},
      { x: 1, y: 2},
      { x: 1, y: 3},
      { x: 4, y: 1},
      { x: 4, y: 0}
    ].forEach(pos => {
      const tile = this.getTileAt(pos)
      tile.id = 1
    })

    ;[
      { x: 1, y: 4},
      { x: 2, y: 4},
      { x: 3, y: 4},
      { x: 4, y: 4},
      { x: 2, y: 3},
      { x: 3, y: 5}
    ].forEach(pos => {
      const tile = this.getTileAt(pos)
      tile.id = 2
    })

    ;[
      { x: 2, y: 2}
    ].forEach(pos => {
      const tile = this.getTileAt(pos)
      tile.id = 3
    })

    ;[
      { x: 4, y: 2}
    ].forEach(pos => {
      const tile = this.getTileAt(pos)
      tile.id = 4
    })

    this.updateConnections()
  }

  getTileAt ({ x, y }) {
    if (x < 0) x %= this.width
    x = (x + this.width) % this.width
    if (y < 0) y %= this.height
    y = (y + this.height) % this.height
    return this.tiles[x + y * this.width]
  }

  getIdAt (pos) {
    return this.getTileAt(pos).id
  }

  setAt (pos, id) {
    this.getTileAt(pos).id = id
  }

  setSymmetricallyAt (pos, id) {
    const opposite = this.getOpposite(pos, id)

    for (const center of this.centers) {
      if (this.touchesCenter(pos, center)) {
        return
      }
      if (this.touchesCenter(opposite, center)) {
        return
      }
    }

    // TODO: check if this even is intuitive
    let oldId = this.getIdAt(pos)
    if (oldId !== -1 && oldId !== id) {
      const opposite2 = this.getOpposite(pos, oldId)
      if (this.canUnsetAt(opposite2)) {
        this.setAt(opposite2, -1)
      }
    }

    // TODO: check if this even is intuitive
    oldId = this.getIdAt(opposite)
    if (oldId !== -1 && oldId !== id) {
      const oppositeOpposite = this.getOpposite(opposite, oldId)
      if (this.canUnsetAt(oppositeOpposite)) {
        this.setAt(oppositeOpposite, -1)
      }
    }

    this.setAt(pos, id)
    this.setAt(opposite, id)

    this.updateConnections()
  }

  getOpposite ({ x, y }, id) {
    const center = this.centers[id]
    return {
      x: 2 * center.x - x - 1,
      y: 2 * center.y - y - 1
    }
  }

  unsetSymmetricallyAt (pos) {
    const id = this.getIdAt(pos)
    if (id < 0) {
      return
    }


    if (this.canUnsetAt(pos)) {
      this.setAt(pos, -1)

      const opposite = this.getOpposite(pos, id)

      if (this.canUnsetAt(opposite)) {
        this.setAt(opposite, -1)
      }

      this.updateConnections()
    }
  }

  canUnsetAt (pos) {
    for (const center of this.centers) {
      if (this.touchesCenter(pos, center)) {
        return false
      }
    }

    return true
  }

  touchesCenter ({ x, y }, center) {
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

  isConnectedAt(id, pos) {
    return this.getTileAt(pos).id === id
  }

  updateConnections () {
    this.connections = this.tiles.map(({ x, y, id }) => {
      const tileLeft = this.isConnectedAt(id, { x: x - 1, y })
      const tileRight = this.isConnectedAt(id, { x: x + 1, y })
      const tileDown = this.isConnectedAt(id, { x, y: y - 1 })
      const tileUp = this.isConnectedAt(id, { x, y: y + 1 })
      const tileUpLeft = tileLeft && tileUp && this.isConnectedAt(id, { x: x - 1, y: y + 1 })
      const tileUpRight = tileRight && tileUp && this.isConnectedAt(id, { x: x + 1, y: y + 1 })
      const tileDownLeft = tileLeft && tileDown && this.isConnectedAt(id, { x: x - 1, y: y - 1 })
      const tileDownRight = tileRight && tileDown && this.isConnectedAt(id, { x: x + 1, y: y - 1 })

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

  getConnection ({ x, y }) {
    return this.connections[x + y * this.width]
  }
}
