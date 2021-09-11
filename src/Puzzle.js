import { Board } from './Board.js'
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

    this.reset()
  }

  reset () {
    this.board = new Board(this.width, this.height, this.wrapping)
    this.grid = this.board.grid

    for (const center of this.centers) {
      this.board.addGalaxyAt(center)
    }

    this.centerTiles = []
    this.board.galaxies.forEach(galaxy => {
      this.centerTiles.push(...galaxy.centerCells)
    })

    this.locks = new Map()
    for (const cell of this.board.grid) {
      this.locks.set(cell, false)
    }

    this.updateConnections()
  }

  solve () {
    this.solution.forEach((galaxy, index) => {
      for (const cell of galaxy.cells) {
        this.board.setAt(cell, index)
      }
    })

    this.updateConnections()
  }

  isSolved () {
    for (const cell of this.board.grid) {
      if (cell.id === -1) {
        return false
      }
    }

    return this.disconnectedTiles.size === 0
  }

  toggleLockedAt (pos) {
    const cell = this.getTileAt(pos)
    if (!cell || cell.id === -1 || this.isCenter(pos)) {
      return false
    }
    const oppositeCell = this.board.getOppositeCellFromId(pos, cell.id)
    const newLock = !this.locks.get(cell)
    this.locks.set(cell, newLock)
    this.locks.set(oppositeCell, newLock)
    return true
  }

  setSymmetricallyAt (pos, id) {
    const cell = this.getTileAt(pos)

    if (cell.id === id) {
      return false
    }

    // Get the cells and their IDs that are about to be changed
    const oppositeCell = this.board.getOppositeCellFromId(pos, id)

    if (this.locks.get(cell) || !oppositeCell || this.locks.get(oppositeCell)) {
      return false
    }

    const result = this.board.setSymmetricallyAt(pos, id, true)

    this.updateConnections()

    return result
  }

  unsetSymmetricallyAt (pos) {
    const cell = this.getTileAt(pos)

    if (cell.id === -1 || !this.canUnsetAt(pos) || this.locks.get(cell)) {
      return false
    }

    this.board.unsetSymmetricallyAt(pos)

    this.updateConnections()

    return true
  }

  getIdAt (pos) {
    const cell = this.getTileAt(pos)
    return cell ? cell.id : INVALID_POS
  }

  getTileAt (pos) {
    return this.board.getCellAt(pos)
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
    return this.board.isGalaxyCenter(pos)
  }

  isConnectedAt(id, pos) {
    return this.getIdAt(pos) === id
  }

  updateConnections () {
    const connected = new Set()
    const toVisit = [...this.centerTiles]

    while (toVisit.length > 0) {
      const cell = toVisit.pop()
      connected.add(cell)
      this.board.getNeighbouringCells(cell).forEach(neighbour => {
        if (neighbour.id === cell.id && !connected.has(neighbour)) toVisit.push(neighbour)
      })
    }

    this.disconnectedTiles = new Set()
    this.connectedTileCount = 0
    this.connectionData = []

    this.board.grid.forEach((cell) => {
      const { x, y, id } = cell
      if (!connected.has(cell)) {
        this.disconnectedTiles.add(`${cell.x}_${cell.y}`)
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
