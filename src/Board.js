import { Vector2 } from './Math/Vector2.js'

export class Board {
  constructor (width, height, wrapping) {
    this.width = width
    this.height = height
    this.wrapping = wrapping
    this.galaxies = []

    this.reset()
  }

  reset () {
    this.grid = []
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        this.grid.push({ x, y, id: -1 })
      }
    }
  }

  addGalaxyAt ({ x, y }) {
    const center = new Vector2(x, y)
    const id = this.galaxies.length
    const centerCells = this.getTouchingCells(center)

    if (centerCells.some(cell => cell.id !== -1)) {
      return null
    }

    const galaxy = {
      center,
      id,
      centerCells: new Set(centerCells),
      cells: new Set(centerCells)
    }
    this.galaxies.push(galaxy)

    centerCells.forEach(cell => this.setAt(cell, id))

    return galaxy
  }

  isGalaxyCenter (pos) {
    const cell = this.getCellAt(pos)
    if (cell.id === -1) return false
    return this.galaxies[cell.id].centerCells.has(cell)
  }

  getCellAt ({ x, y }) {
    if (this.wrapping) {
      x %= this.width
      y %= this.height
      if (x < 0) {
        x += this.width
      }
      if (y < 0) {
        y += this.height
      }
    } else {
      if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
        return null
      }
    }
    return this.grid[x + y * this.width]
  }

  getOppositePositionFrom ({ x, y }, { x: centerX, y: centerY }) {
    return {
      x: 2 * centerX - x - 1,
      y: 2 * centerY - y - 1
    }
  }

  getOppositeCellFrom (pos, center) {
    return this.getCellAt(this.getOppositePositionFrom(pos, center))
  }

  getOppositeCellFromId (pos, id) {
    const center = this.galaxies[id].center
    return this.getCellAt(this.getOppositePositionFrom(pos, center))
  }

  getNeighbouringCells ({ x, y }) {
    return [
      this.getCellAt({ x, y: y - 1 }),
      this.getCellAt({ x: x - 1, y }),
      this.getCellAt({ x: x + 1, y }),
      this.getCellAt({ x, y: y + 1})
    ].filter(x => x)
  }

  getNeighboursForMultiple (cells) {
    const result = new Set()
    for (const cell of cells) {
      for (const neighbour of this.getNeighbouringCells(cell)) {
        result.add(neighbour)
      }
    }

    return [...result]
  }

  getTouchingCells ({ x, y }) {
    if (x % 1 === 0.5 && y % 1 === 0.5) {
      return [
        this.getCellAt({ x: x - 0.5, y: y - 0.5 })
      ]
    }

    if (x % 1 === 0.5) {
      return [
        this.getCellAt({ x: x - 0.5, y: y - 1 }),
        this.getCellAt({ x: x - 0.5, y })
      ]
    }

    if (y % 1 === 0.5) {
      return [
        this.getCellAt({ x: x - 1, y: y - 0.5 }),
        this.getCellAt({ x, y: y - 0.5 })
      ]
    }

    return [
      this.getCellAt({ x: x - 1, y: y - 1 }),
      this.getCellAt({ x: x, y: y - 1 }),
      this.getCellAt({ x: x - 1, y }),
      this.getCellAt({ x: x, y })
    ]
  }

  setSymmetricallyAt (pos, id, override = false) {
    const cell = this.getCellAt(pos)
    const opposite = this.getOppositeCellFromId(pos, id)

    if (!cell || !opposite) {
      return false
    }

    // Make sure we don't override galaxy centers
    for (const galaxy of this.galaxies) {
      if (galaxy.id === id) {
        continue
      }
      if (galaxy.centerCells.has(cell) || galaxy.centerCells.has(opposite)) {
        return false
      }
    }

    if ((cell.id !== -1 && cell.id !== id) || (opposite.id !== -1 && opposite.id !== id)) {
      if (!override) {
        return false
      } else {
        // Unset cells that are already part of a galaxy
        this.unsetSymmetricallyAt(cell)
        this.unsetSymmetricallyAt(opposite)
      }
    }

    this.setAt(cell, id)
    this.setAt(opposite, id)

    return true
  }

  unsetSymmetricallyAt (pos) {
    const cell = this.getCellAt(pos)
    const id = cell.id
    if (!cell || cell.id === -1) {
      return false
    }
    const center = this.galaxies[id].center
    const opposite = this.getOppositeCellFrom(pos, center)

    cell.id = -1
    opposite.id = -1
    this.galaxies[id].cells.delete(cell)
    this.galaxies[id].cells.delete(opposite)

    return true
  }

  setAt (pos, id) {
    const cell = this.getCellAt(pos)
    cell.id = id
    this.galaxies[id].cells.add(cell)
  }

  // <dev-only>
  debug () {
    let s = ''
    const mapping = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    for (let y = this.height - 1; y >= 0; y--) {
      for (let x = 0; x < this.width; x++) {
        const id = this.getCellAt({ x, y }).id
        s += mapping[id === -1 ? ' ' : id % mapping.length]
      }
      s += '\n'
    }
    console.log(s)
  }
  // </dev-only>
}
