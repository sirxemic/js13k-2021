import { pickRandomFromArray, popFromSet } from '../utils.js'
import { Vector2 } from '../Math/Vector2.js'
import { GenerationAlgorithmBase } from './GenerationAlgorithmBase.js'

export class GenerationAlgorithm2 extends GenerationAlgorithmBase {
  constructor (width, height, wrapping) {
    super(width, height, wrapping)
  }

  generate () {
    this.setup()
    while (this.availableCenterPositions.size > 0) {
      this.addGalaxy()
    }
    this.mergeSingletons()
    this.generateConnectivityMap()
  }

  setup () {
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
    const maxSize = 3 + Math.round(Math.random() * (this.maxGalaxySize - 3))

    const centerString = pickRandomFromArray([...this.availableCenterPositions])

    // Shortcut to save bytes: use Vector2 here so we don't have to create it later
    const center = new Vector2(
      +centerString.split('_')[0],
      +centerString.split('_')[1]
    )

    const { id, cells } = this.board.addGalaxyAt(center)

    cells.forEach(cell => this.updateAvailableCenterPositions(cell))

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
      const potential = this.board.getNeighbouringCells(cell)
        .filter(neighbor => (
          // Filter out the neighbors that are already taken
          neighbor.id === -1 &&

          // And those which don't meet the symmetry condition
          this.board.getOppositeCellFrom(neighbor, center)?.id === -1
        ))

      // If all potential neighbors are taken, this cell is done
      if (potential.length === 0) {
        toProcess.splice(toProcess.indexOf(cell), 1)
        continue
      }

      const newCell = pickRandomFromArray(potential)
      const oppositeCell = this.board.getOppositeCellFrom(newCell, center)

      this.board.setSymmetricallyAt(newCell, id)

      this.updateAvailableCenterPositions(newCell)
      this.updateAvailableCenterPositions(oppositeCell)

      toProcess.push(newCell)
    }
  }

  mergeSingletons () {
    this.board.galaxies.forEach(galaxy => {
      if (galaxy.cells.size === 1) {
        const cell = [...galaxy.cells][0]
        cell.isSingleton = true
      }
    })

    const galaxiesToRemove = []

    const processCells = (center, cells) => {
      if (cells.length <= 1) return

      cells = new Set(cells)

      this.board.galaxies.push({ center, cells, centerCells: cells })
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
          this.board.getCellAt({ x, y }),
          this.board.getCellAt({ x: x + 1, y }),
          this.board.getCellAt({ x, y: y + 1 }),
          this.board.getCellAt({ x: x + 1, y: y + 1 })
        ]
        if (cells.every(cell => cell.isSingleton)) {
          processCells(center, cells)
        }
      }
    }

    // Then for horizontal clusters
    for (let x = 0; x < maxX; x++) {
      for (let y = 0; y < this.height; y++) {
        let cells = [this.board.getCellAt({ x, y })]
        if (!cells[0].isSingleton) {
          continue
        }

        const maxX2 = this.wrapping ? x + this.width : this.width
        for (let x2 = x + 1; x2 < maxX2; x2++) {
          const cell = this.board.getCellAt({ x: x2, y })
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
        let cells = [this.board.getCellAt({ x, y })]
        if (!cells[0].isSingleton) {
          continue
        }

        const maxY2 = this.wrapping ? y + this.height : this.height
        for (let y2 = y + 1; y2 < maxY2; y2++) {
          const cell = this.board.getCellAt({ x, y: y2 })
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

    // Galaxy ID = its index in this.board.galaxies, so just remove from highest to lowest
    galaxiesToRemove.sort((id1, id2) => id2 - id1)
    for (const id of galaxiesToRemove) {
      this.board.galaxies.splice(id, 1)
    }
  }

  updateAvailableCenterPositions (pos) {
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

  /**
   * Generate a utility for fetching for a cell which galaxies it can be part of
   */
  generateConnectivityMap () {
    this.connectivity = new Map()
    for (const cell of this.board.grid) {
      this.connectivity.set(cell, new Set())
    }

    for (const galaxy of this.board.galaxies) {
      const toProcess = new Set(galaxy.cells)
      const done = new Set()

      while (toProcess.size > 0) {
        const cell = popFromSet(toProcess)
        const opposite = this.board.getOppositeCellFrom(cell, galaxy.center)
        toProcess.delete(opposite)

        this.connectivity.get(cell).add(galaxy.id)
        this.connectivity.get(opposite).add(galaxy.id)

        done.add(cell)
        done.add(opposite)

        const neighbours = this.board.getNeighbouringCells(cell)
        for (const neighbour of neighbours) {
          if (done.has(neighbour)) {
            continue
          }
          const opposite = this.board.getOppositeCellFrom(neighbour, galaxy.center)
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
}