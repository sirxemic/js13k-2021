import { Vector2 } from './Math/Vector2.js'

export class Board {
  constructor (size, wrapping) {
    this.size = size
    this.wrapping = wrapping

    this.init()
  }

  init () {
    this.grid = []
    this.galaxies = []
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        this.grid.push({ x, y, id: -1 })
      }
    }
  }

  addGalaxyAt ({ x, y }) {
    const center = new Vector2(x, y)
    const id = this.galaxies.length
    const centerSpaces = this.getTouchingSpaces(center)

    if (centerSpaces.some(space => space.id !== -1)) {
      return null
    }

    const galaxy = {
      center,
      id,
      centerSpaces: new Set(centerSpaces),
      spaces: new Set(centerSpaces)
    }
    this.galaxies.push(galaxy)

    centerSpaces.forEach(space => this.setAt(space, id))

    return galaxy
  }

  isGalaxyCenter (pos) {
    const space = this.getSpaceAt(pos)
    if (space.id === -1) return false
    return this.galaxies[space.id].centerSpaces.has(space)
  }

  getSpaceAt ({ x, y }) {
    if (this.wrapping) {
      x %= this.size
      y %= this.size
      if (x < 0) {
        x += this.size
      }
      if (y < 0) {
        y += this.size
      }
    } else {
      if (x < 0 || y < 0 || x >= this.size || y >= this.size) {
        return null
      }
    }
    return this.grid[x + y * this.size]
  }

  getOppositePositionFrom ({ x, y }, { x: centerX, y: centerY }) {
    return {
      x: 2 * centerX - x - 1,
      y: 2 * centerY - y - 1
    }
  }

  getOppositeSpaceFrom (pos, center) {
    return this.getSpaceAt(this.getOppositePositionFrom(pos, center))
  }

  getOppositeSpaceFromId (pos, id) {
    const center = this.galaxies[id].center
    return this.getSpaceAt(this.getOppositePositionFrom(pos, center))
  }

  getNeighbouringSpaces ({ x, y }) {
    return [
      this.getSpaceAt({ x, y: y - 1 }),
      this.getSpaceAt({ x: x - 1, y }),
      this.getSpaceAt({ x: x + 1, y }),
      this.getSpaceAt({ x, y: y + 1})
    ].filter(x => x)
  }

  getNeighboursForMultiple (spaces) {
    const result = new Set()
    for (const space of spaces) {
      for (const neighbour of this.getNeighbouringSpaces(space)) {
        result.add(neighbour)
      }
    }

    return [...result]
  }

  getTouchingSpaces ({ x, y }) {
    if (x % 1 === 0.5 && y % 1 === 0.5) {
      return [
        this.getSpaceAt({ x: x - 0.5, y: y - 0.5 })
      ]
    }

    if (x % 1 === 0.5) {
      return [
        this.getSpaceAt({ x: x - 0.5, y: y - 1 }),
        this.getSpaceAt({ x: x - 0.5, y })
      ]
    }

    if (y % 1 === 0.5) {
      return [
        this.getSpaceAt({ x: x - 1, y: y - 0.5 }),
        this.getSpaceAt({ x, y: y - 0.5 })
      ]
    }

    return [
      this.getSpaceAt({ x: x - 1, y: y - 1 }),
      this.getSpaceAt({ x: x, y: y - 1 }),
      this.getSpaceAt({ x: x - 1, y }),
      this.getSpaceAt({ x: x, y })
    ]
  }

  setSymmetricallyAt (pos, id, override = false) {
    const space = this.getSpaceAt(pos)
    const opposite = this.getOppositeSpaceFromId(pos, id)

    if (!space || !opposite) {
      return false
    }

    // Make sure we don't override galaxy centers
    for (const galaxy of this.galaxies) {
      if (galaxy.id === id) {
        continue
      }
      if (galaxy.centerSpaces.has(space) || galaxy.centerSpaces.has(opposite)) {
        return false
      }
    }

    if ((space.id !== -1 && space.id !== id) || (opposite.id !== -1 && opposite.id !== id)) {
      if (!override) {
        return false
      } else {
        // Unset spaces that are already part of a galaxy
        this.unsetSymmetricallyAt(space)
        this.unsetSymmetricallyAt(opposite)
      }
    }

    this.setAt(space, id)
    this.setAt(opposite, id)

    return true
  }

  unsetSymmetricallyAt (pos) {
    const space = this.getSpaceAt(pos)
    const id = space.id
    if (!space || space.id === -1) {
      return false
    }
    const center = this.galaxies[id].center
    const opposite = this.getOppositeSpaceFrom(pos, center)

    space.id = -1
    opposite.id = -1
    this.galaxies[id].spaces.delete(space)
    this.galaxies[id].spaces.delete(opposite)

    return true
  }

  setAt (pos, id) {
    const space = this.getSpaceAt(pos)
    space.id = id
    this.galaxies[id].spaces.add(space)
  }

  // <dev-only>
  debug () {
    let s = ''
    const mapping = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    for (let y = this.size - 1; y >= 0; y--) {
      for (let x = 0; x < this.size; x++) {
        const id = this.getSpaceAt({ x, y }).id
        s += id === -1 ? ' ' : mapping[id % mapping.length]
      }
      s += '\n'
    }
    console.log(s)
  }
  // </dev-only>
}
