import { popFromSet } from '../utils.js'

export class PuzzleSolver {
  constructor (puzzle) {
    this.puzzle = puzzle

    this.tilesToSolve = new Set(this.puzzle.grid)
    this.tilesPerGalaxy = this.puzzle.centers.map(_ => [])
  }

  solve () {
    while (this.tilesToSolve.size > 0) {
      if (this.markTrivialCells()) {
        continue
      }
      if (this.markTrivialCellsByVisibility()) {
        continue
      }
      return false
    }
    return true
  }

  markTrivialCells () {
    let marked = false
    for (let tile of this.tilesToSolve) {
      if (tile.id !== -1) {
        this.tilesToSolve.delete(tile)
        continue
      }
      let possibleGalaxyIds = []
      for (let id = 0; id < this.puzzle.centers.length; id++) {
        const opposite = this.puzzle.getOpposite(tile, id)
        const oppositeTile = this.puzzle.getTileAt(opposite)
        if (oppositeTile && oppositeTile.id === -1) {
          possibleGalaxyIds.push(id)
        }
      }
      if (possibleGalaxyIds.length === 1) {
        this.updateCell(tile, possibleGalaxyIds[0])
        marked = true
      }
    }
    return marked
  }

  markTrivialCellsByVisibility () {
    let marked = false
    const possibleGalaxyIds = new Map()
    for (let id = 0; id < this.puzzle.centers.length; id++) {
      const visibleCells = this.getVisibleUnprocessedCells(id)
      for (const cell of visibleCells) {
        if (!possibleGalaxyIds.has(cell)) {
          possibleGalaxyIds.set(cell, [])
        }
        possibleGalaxyIds.get(cell).push(id)
      }
    }

    for (const cell of possibleGalaxyIds.keys()) {
      const ids = possibleGalaxyIds.get(cell)
      if (ids.get(cell).length === 1) {
        this.updateCell(cell, popFromSet(ids))
        marked = true
      }
    }
    return marked
  }

  updateCell (cell, id) {
    const result = this.puzzle.setSymmetricallyAt(cell, id)
    this.tilesToSolve.delete(cell)
    this.tilesPerGalaxy[id].push(cell)
  }

  getVisibleUnprocessedCells (id) {
    const result = new Set()
    const toProcess = new Set(this.tilesPerGalaxy[id])
    const processed = new Set()
    while (toProcess.length > 0) {
      const cell = popFromSet(toProcess)
      processed.add(cell)
      const neighbours = this.puzzle
        .getNeighbours(cell)
        .filter(x => {
          if (!x) return false
          if (x.id !== -1) return false
          const opposite = this.puzzle.getOpposite(x, id)
          const oppositeTile = this.puzzle.getTileAt(opposite)
          if (!oppositeTile) return false
          if (oppositeTile.id !== -1) return false
          return true
        })
      for (const neighbor in neighbours) {
        if (!processed.has(cell)) {
          toProcess.add(neighbor)
        }
        result.add(neighbor)
      }
    }
    return result
  }

  getNeighbours ({ x, y }) {
    return [
      this.puzzle.getTileAt({ x, y: y - 1 }),
      this.puzzle.getTileAt({ x: x - 1, y }),
      this.puzzle.getTileAt({ x: x + 1, y }),
      this.puzzle.getTileAt({ x, y: y + 1})
    ].filter(x => x)
  }
}