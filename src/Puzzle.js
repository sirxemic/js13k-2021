import { Vector4 } from './Math/Vector4.js'
import { shuffle } from './utils.js'

export const INVALID_POS = -2
export const EMPTY = -1

export class Puzzle {
  constructor (width, height, galaxies, wrapping) {
    this.solution = galaxies.map(galaxy => {
      return {
        center: galaxy.center,
        cells: [...galaxy.cells]
      }
    })

    this.width = width
    this.height = height
    this.centers = galaxies.map(galaxy => galaxy.center)
    this.wrapping = wrapping

    this.gridOffset = {
      x: this.width / 2 - 0.5,
      y: this.height / 2 - 0.5
    }

    this.colorIds = shuffle([
      0, 1, 2, 3, 4, 5
    ])

    this.setCenterTiles()

    this.reset()
  }

  reset () {
    this.tiles = Array.from(
      { length: this.width * this.height },
      (_, index) => {
        const x = index % this.width
        const y = Math.floor(index / this.width)
        return { x, y, id: EMPTY }
      }
    )

    this.centerTiles.forEach(tile => {
      this.tiles[tile.x + tile.y * this.width] = tile
    })

    this.updateConnections()
  }

  solve () {
    this.solution.forEach((galaxy, index) => {
      for (const cell of galaxy.cells) {
        this.tiles[cell.x + cell.y * this.width].id = index
      }
    })

    this.updateConnections()
  }

  isSolved () {
    for (const tile of this.tiles) {
      if (tile.id === EMPTY) {
        return false
      }
    }

    return this.disconnectedTiles.size === 0
  }

  setSymmetricallyAt (pos, id) {
    const currentId = this.getIdAt(pos)

    if (currentId === id) {
      return false
    }

    const opposite = this.getOpposite(pos, id)

    // When not wrapping, the opposite can be outside of the board
    if (this.getIdAt(opposite) === INVALID_POS) {
      return false
    }

    if (this.isCenter(pos) || this.isCenter(opposite)) {
      return false
    }

    // TODO: check if this even is intuitive
    let oldId = this.getIdAt(pos)
    if (oldId > -1 && oldId !== id) {
      const opposite2 = this.getOpposite(pos, oldId)
      if (this.canUnsetAt(opposite2)) {
        this.setAt(opposite2, EMPTY)
      }
    }

    // TODO: check if this even is intuitive
    oldId = this.getIdAt(opposite)
    if (oldId > -1 && oldId !== id) {
      const oppositeOpposite = this.getOpposite(opposite, oldId)
      if (this.canUnsetAt(oppositeOpposite)) {
        this.setAt(oppositeOpposite, EMPTY)
      }
    }

    this.setAt(pos, id)
    this.setAt(opposite, id)

    this.updateConnections()

    return true
  }

  unsetSymmetricallyAt (pos) {
    const id = this.getIdAt(pos)
    if (id < 0 || !this.canUnsetAt(pos)) {
      return false
    }

    this.setAt(pos, EMPTY)

    const opposite = this.getOpposite(pos, id)

    if (this.canUnsetAt(opposite)) {
      this.setAt(opposite, EMPTY)
    }

    this.updateConnections()

    return true
  }

  getTileAt ({ x, y }) {
    if (!this.wrapping) {
      if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
        return null
      }
      return this.tiles[x + y * this.width]
    }
    if (x < 0) x %= this.width
    x = (x + this.width) % this.width
    if (y < 0) y %= this.height
    y = (y + this.height) % this.height
    return this.tiles[x + y * this.width]
  }

  getIdAt (pos) {
    const tile = this.getTileAt(pos)
    return tile ? tile.id : INVALID_POS
  }

  setCenterTiles () {
    this.centerTiles = []
    this.centers.forEach(({ x, y }, id) => {
      x -= 0.5
      y -= 0.5
      if (x % 1 === 0 && y % 1 === 0) {
        this.centerTiles.push({ x, y, id })
      } else if (x % 1 === 0 && y % 1 !== 0) {
        this.centerTiles.push({ x, y: (y - 0.5 + this.height) % this.height , id })
        this.centerTiles.push({ x, y: (y + 0.5) % this.height, id })
      } else if (x % 1 !== 0 && y % 1 === 0) {
        this.centerTiles.push({ x: (x - 0.5 + this.width) % this.width, y, id })
        this.centerTiles.push({ x: (x + 0.5) % this.width, y, id })
      } else {
        this.centerTiles.push({ x: (x - 0.5 + this.width) % this.width, y: (y - 0.5 + this.height) % this.height, id })
        this.centerTiles.push({ x: (x + 0.5) % this.width, y: (y - 0.5 + this.height) % this.height, id })
        this.centerTiles.push({ x: (x - 0.5 + this.width) % this.width, y: (y + 0.5) % this.height, id })
        this.centerTiles.push({ x: (x + 0.5) % this.width, y: (y + 0.5) % this.height, id })
      }
    })
  }

  setAt (pos, id) {
    const tile = this.getTileAt(pos)
    tile.id = id
  }

  getOpposite ({ x, y }, id) {
    const center = this.centers[id]
    return {
      x: 2 * center.x - x - 1,
      y: 2 * center.y - y - 1
    }
  }

  canUnsetAt (pos) {
    if (this.isCenter(pos)) {
      return false
    }

    return this.getIdAt(pos) !== INVALID_POS
  }

  isCenter (pos) {
    const tile = this.getTileAt(pos)
    return this.centerTiles.includes(tile)
  }

  isConnectedAt(id, pos) {
    return this.getIdAt(pos) === id
  }

  updateConnections () {
    const visited = new Set()
    const toVisit = this.centerTiles.slice()

    while (toVisit.length > 0) {
      const tile = toVisit.pop()
      visited.add(tile)
      const { x, y, id } = tile
      ;[
        this.getTileAt({ x: x - 1, y }),
        this.getTileAt({ x: x + 1, y }),
        this.getTileAt({ x, y: y - 1 }),
        this.getTileAt({ x, y: y + 1 })
      ].forEach(otherTile => {
        if (otherTile && otherTile.id === id && !visited.has(otherTile)) toVisit.push(otherTile)
      })
    }

    this.disconnectedTiles = new Set()
    this.connectedTileCount = 0
    this.connectionData = []

    this.tiles.forEach((tile) => {
      const { x, y, id } = tile
      if (!visited.has(tile)) {
        this.disconnectedTiles.add(`${tile.x}_${tile.y}`)
      }
      else if (id > -1) {
        this.connectedTileCount++
      }
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

      this.connectionData.push(
          new Vector4(
          h,
          v,
          tileUpRight && tileDownLeft ? 2 : tileUpRight ? 1 : tileDownLeft ? -1 : 0,
          tileUpLeft && tileDownRight ? 2 : tileUpLeft ? 1 : tileDownRight ? -1 : 0
        )
      )
    })
  }

  getShaderConnectionData ({ x, y }) {
    return this.connectionData[x + y * this.width]
  }

  isTileConnectedToCenter ({ x, y }) {
    return !this.disconnectedTiles.has(`${x}_${y}`)
  }
}
