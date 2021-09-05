import { Vector2 } from './Math/Vector2.js'
import { Puzzle } from './Puzzle.js'
import { pickRandomFromArray, popFromSet } from './utils.js'

// <dev-only>
// let s = 123456
// Math.random = () => {
//   s = s * 16807 % 2147483647
//   return (s - 1) / 2147483646
// }
// </dev-only>

/**
 * The grid consists of cells with simple coordinates:
 *
 * +--------+--------+--------+
 * | ( 0, 0)| ( 1, 0)| ( 2, 0)|
 * +--------+--------+--------+
 * | ( 0, 1)| ( 1, 1)| ( 2, 1)|
 * +--------+--------+--------+
 * | ( 0, 2)| ( 1, 2)| ( 2, 2)|
 * +--------+--------+--------+
 *
 * The coordinates of "centers" don't match this, however, and instead (0,0) for a galaxy center
 * means the top-left corner. That also means that when a galaxy center is positioned in the center
 * of the first cell, its coordinates are (0.5, 0.5)
 */
class PuzzleGeneratorPass {
  constructor (width, height, wrapping) {
    this.width = width
    this.height = height
    this.wrapping = wrapping
  }

  generate () {
    this.setup()
    while (this.availableCenterPositions.size > 0) {
      this.addGalaxy()
    }
    this.mergeSingletons()
    this.generateConnectivityMap()

    // <dev-only>
    this.debug()
    // </dev-only>
  }

  setup () {
    this.galaxies = []
    this.grid = []
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const cell = { x, y, id: -1 }
        this.grid.push(cell)
      }
    }

    this.availableCenterPositions = new Set()
    const minX = this.wrapping ? 0 : 0.5
    const minY = this.wrapping ? 0 : 0.5
    const maxX = this.width - 0.5
    const maxY = this.height - 0.5

    for (let x = minX; x <= maxX; x += 0.5) {
      for (let y = minY; y <= maxY; y += 0.5) {
        this.availableCenterPositions.add(`${x}_${y}`)
      }
    }

    this.centerGalaxyCells = new Map()
  }

  addGalaxy () {
    const id = this.galaxies.length

    const limit = Math.floor(2 * Math.sqrt(this.width * this.height))
    const maxSize = 3 + Math.round(Math.random() * (limit - 3))

    const centerString = pickRandomFromArray([...this.availableCenterPositions])

    // Shortcut to save bytes: use Vector2 here so we don't have to create it later
    const center = new Vector2(
      +centerString.split('_')[0],
      +centerString.split('_')[1]
    )
    const cells = this.setGalaxyCenterAt(center, id)

    this.galaxies.push({
      id,
      center,
      cells,
      centerCells: new Set(cells)
    })

    // Due to symmetry we don't have to process all cells:
    // - If the center is centered in a cell, just pick that only cell
    // - If the center is on an edge, just pick the first one
    // - If the center is on a corner, pick the first two
    const toProcess = [...cells]
    if (cells.size >= 2) {
      toProcess.pop()
    }
    if (cells.size === 4) {
      toProcess.pop()
    }

    while (toProcess.length > 0 && cells.size < maxSize) {
      const cell = pickRandomFromArray(toProcess)
      const potential = this.getNeighbours(cell)
        .filter(neighbor => (
          // Filter out the neighbors that are already taken
          neighbor.id === -1 &&

          // And those which don't meet the symmetry condition
          this.getOppositeCell(neighbor, center)?.id === -1
        ))

      // If all potential neighbors are taken, this cell is done
      if (potential.length === 0) {
        toProcess.splice(toProcess.indexOf(cell), 1)
        continue
      }

      const newCell = pickRandomFromArray(potential)
      const oppositeCell = this.getOppositeCell(newCell, center)

      this.updateCell(newCell, id)
      this.updateCell(oppositeCell, id)

      toProcess.push(newCell)
      cells.add(newCell)
      cells.add(oppositeCell)
    }
  }

  mergeSingletons () {
    this.galaxies.forEach(galaxy => {
      if (galaxy.cells.size === 1) {
        const cell = [...galaxy.cells][0]
        cell.isSingleton = true
      }
    })

    const galaxiesToRemove = []

    const processCells = (center, cells) => {
      if (cells.length <= 1) return

      cells = new Set(cells)

      this.galaxies.push({ center, cells, centerCells: cells })
      cells.forEach(cell => {
        galaxiesToRemove.push(cell.id)
        cell.isSingleton = false
      })
    }

    // First see if there are clusters of 4 singletons
    const maxX = this.wrapping ? this.width : this.width - 1
    const maxY = this.wrapping ? this.height : this.height - 1
    for (let x = 0; x < maxX; x++) {
      for (let y = 0; y < maxY; y++) {
        const center = new Vector2(x + 1, y + 1)
        const cells = [
          this.getCellAt({ x, y }),
          this.getCellAt({ x: x + 1, y }),
          this.getCellAt({ x, y: y + 1 }),
          this.getCellAt({ x: x + 1, y: y + 1 })
        ]
        if (cells.every(cell => cell.isSingleton)) {
          processCells(center, cells)
        }
      }
    }

    // Then for horizontal clusters
    for (let x = 0; x < maxX; x++) {
      for (let y = 0; y < this.height; y++) {
        let cells = [this.getCellAt({ x, y })]
        if (!cells[0].isSingleton) {
          continue
        }

        const maxX2 = this.wrapping ? x + this.width : this.width
        for (let x2 = x + 1; x2 < maxX2; x2++) {
          const cell = this.getCellAt({ x: x2, y })
          if (cell.isSingleton) {
            cells.push(cell)
          } else {
            break
          }
        }

        const center = new Vector2(x + cells.length / 2, y + 0.5)
        processCells(center, cells)
      }
    }

    // And finally vertical clusters
    for (let y = 0; y < maxY; y++) {
      for (let x = 0; x < this.width; x++) {
        let cells = [this.getCellAt({ x, y })]
        if (!cells[0].isSingleton) {
          continue
        }

        const maxY2 = this.wrapping ? y + this.height : this.height
        for (let y2 = y + 1; y2 < maxY2; y2++) {
          const cell = this.getCellAt({ x, y: y2 })
          if (cell.isSingleton) {
            cells.push(cell)
          } else {
            break
          }
        }

        const center = new Vector2(x + 0.5, y + cells.length / 2)
        processCells(center, cells)
      }
    }

    // Galaxy ID = its index in this.galaxies, so just remove from highest to lowest
    galaxiesToRemove.sort((id1, id2) => id2 - id1)
    for (const id of galaxiesToRemove) {
      this.galaxies.splice(id, 1)
    }
  }

  getNeighbours ({ x, y }) {
    return [
      this.getCellAt({ x, y: y - 1 }),
      this.getCellAt({ x: x - 1, y }),
      this.getCellAt({ x: x + 1, y }),
      this.getCellAt({ x, y: y + 1})
    ].filter(x => x)
  }

  setGalaxyCenterAt ({ x, y }, id) {
    let xs = x % 1 === 0.5 ? [x - 0.5] : [x - 1, x]
    let ys = y % 1 === 0.5 ? [y - 0.5] : [y - 1, y]

    const result = new Set()
    for (const x of xs) {
      for (const y of ys) {
        const cell = this.getCellAt({ x, y })
        this.updateCell(cell, id)
        result.add(cell)

        this.centerGalaxyCells.set(cell, id)
      }
    }

    return result
  }

  updateCell (pos, id) {
    this.getCellAt(pos).id = id

    // Also remove the cell, its edges and corners from galaxy center potentials
    const { x, y } = pos

    const xm = x + 0.5
    const xr = (x + 1) % this.width
    const ym = y + 0.5
    const yb = (y + 1) % this.height
    this.availableCenterPositions.delete(`${x}_${y}`) // top-left corner
    this.availableCenterPositions.delete(`${xm}_${y}`) // top edge
    this.availableCenterPositions.delete(`${xr}_${y}`) // top-right corner
    this.availableCenterPositions.delete(`${x}_${ym}`) // left edge
    this.availableCenterPositions.delete(`${xm}_${ym}`) // cell center
    this.availableCenterPositions.delete(`${xr}_${ym}`) // right edge
    this.availableCenterPositions.delete(`${x}_${yb}`) // bottom-left corner
    this.availableCenterPositions.delete(`${xm}_${yb}`) // bottom-edge
    this.availableCenterPositions.delete(`${xr}_${yb}`) // bottom-right corner
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

  getOppositeCell({ x, y }, { x: centerX, y: centerY }) {
    return this.getCellAt({
      x: 2 * centerX - x - 1,
      y: 2 * centerY - y - 1
    })
  }

  /**
   * Generate a utility for fetching for a cell which galaxies it can be part of
   */
  generateConnectivityMap () {
    this.connectivity = new Map()
    for (const cell of this.grid) {
      this.connectivity.set(cell, new Set())
    }

    for (const galaxy of this.galaxies) {
      const toProcess = new Set(galaxy.cells)
      const done = new Set()

      while (toProcess.size > 0) {
        const cell = popFromSet(toProcess)
        const opposite = this.getOppositeCell(cell, galaxy.center)
        toProcess.delete(opposite)

        this.connectivity.get(cell).add(galaxy.id)
        this.connectivity.get(opposite).add(galaxy.id)

        done.add(cell)
        done.add(opposite)

        const neighbours = this.getNeighbours(cell)
        for (const neighbour of neighbours) {
          if (done.has(neighbour)) {
            continue
          }
          const opposite = this.getOppositeCell(neighbour, galaxy.center)
          if (opposite && !this.centerGalaxyCells.has(opposite)) {
            toProcess.add(neighbour)
          }
        }
      }
    }
  }

  isCellAccessibleFromGalaxy (cell, id) {
    return this.connectivity.get(cell).has(id)
  }

  // <dev-only>
  debug () {
    let s = ''
    const mapping = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    for (let y = this.height - 1; y >= 0; y--) {
      for (let x = 0; x < this.width; x++) {
        s += mapping[this.getCellAt({ x, y }).id % mapping.length]
      }
      s += '\n'
    }
    console.log(s)
  }
  // </dev-only>
}

export class PuzzleGenerator {
  constructor ({ width, height, wrapping, difficulty }) {
    this.width = width
    this.height = height
    this.wrapping = wrapping
    this.difficulty = difficulty
  }

  generate () {
    let pass

    do {
      pass = new PuzzleGeneratorPass(this.width, this.height, this.wrapping)
      pass.generate()
    } while (!this.matchesDifficulty(pass))
    return new Puzzle(this.width, this.height, pass.galaxies, this.wrapping)
  }

  matchesDifficulty (pass) {
    const { galaxies, grid } = pass

    // Check that there aren't too many galaxies to expand
    let expandableGalaxyCount = 0
    for (const galaxy of galaxies) {
      if (galaxy.centerCells.size < galaxy.cells.size) {
        expandableGalaxyCount++
      }
    }
    const minimum = this.difficulty === 0 ? 3 : 5
    const maximum = Math.sqrt(this.width * this.height) - 1
    if (expandableGalaxyCount < minimum || expandableGalaxyCount > maximum) {
      return false
    }

    // Check if a cell can only be part of one galaxy
    const isTrivialCell = (cell) => {
      let possibleGalaxyCount = 0
      for (const galaxy of galaxies) {
        if (pass.isCellAccessibleFromGalaxy(cell, galaxy.id)) {
          possibleGalaxyCount++

          if (possibleGalaxyCount > 1) {
            return false
          }
        }
      }
      return possibleGalaxyCount === 1
    }

    // Check if a galaxy can only have one shape
    const isTrivialGalaxy = (galaxy) => {
      let possibleCellCount = 0
      for (const cell of pass.grid) {
        if (pass.isCellAccessibleFromGalaxy(cell, galaxy.id)) {
          possibleCellCount++
        }
      }
      return possibleCellCount === galaxy.cells.size
    }

    let trivialCells = new Set()
    for (const cell of grid) {
      if (isTrivialCell(cell)) {
        trivialCells.add(cell)
      }
    }

    let trivialGalaxyCount = 0
    for (const galaxy of galaxies) {
      if (isTrivialGalaxy(galaxy)) {
        trivialGalaxyCount++

        // We only care about trivial cells that are not part of a trivial galaxy
        for (const cell of galaxy.cells) {
          trivialCells.delete(cell)
        }
      }
    }

    if (this.difficulty === 0) {
      return trivialGalaxyCount >= galaxies.length * 0.5
    } else {
      return (trivialGalaxyCount > galaxies.length * 0.1 || trivialCells.size > Math.sqrt(this.width * this.height)) &&
        (trivialGalaxyCount <= galaxies.length * 0.5)
    }
  }
}
