import { Grid } from './Grid'
import { Vector2 } from './Math/Vector2'
import { Vector4 } from './Math/Vector4'
import { PuzzleRenderer } from './PuzzleRenderer'
import { Selector } from './Selector'

export class Puzzle {
  constructor (width, height) {
    this.width = width
    this.height = height

    this.centers = [
      new Vector2(2, 1),
      new Vector2(0.5, 2),
      new Vector2(3, 4.5),
      new Vector2(2.5, 2.5),
      new Vector2(4.5, 2.5)
    ]

    this.grid = new Grid()
    this.selector = new Selector()

    this.tiles = Array.from(
      { length: width * height },
      (_, index) => {
        const x = index % width
        const y = Math.floor(index / width)
        return { x, y, colorId: 0, id: -1 }
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
      tile.colorId = 0
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
      tile.colorId = 1
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
      tile.colorId = 2
    })

    ;[
      { x: 2, y: 2}
    ].forEach(item => {
      const tile = this.getTileAt(item.x, item.y)
      tile.id = 3
      tile.colorId = 3
    })

    ;[
      { x: 4, y: 2}
    ].forEach(item => {
      const tile = this.getTileAt(item.x, item.y)
      tile.id = 4
      tile.colorId = 4
    })

    this.updateConnections()

    this.renderer = new PuzzleRenderer(this)
  }

  getTileAt(x, y) {
    x = (x + this.width) % this.width
    y = (y + this.height) % this.height
    return this.tiles[x + y * this.width]
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

  step () {
    this.selector.step()
    this.renderer.step()
  }

  render () {
    this.grid.render()
    this.selector.render()
    this.renderer.render()
  }

  getConnection (x, y) {
    return this.connections[x + y * this.width]
  }
}
