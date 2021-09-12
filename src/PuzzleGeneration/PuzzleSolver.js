import { popFromSet } from '../utils.js'

export class PuzzleSolver {
  constructor (puzzle) {
    this.puzzle = puzzle

    this.spacesToSolve = new Set(this.puzzle.grid)
    this.spacesPerGalaxy = this.puzzle.centers.map(center => this.puzzle.getTouchingSpaces(center))
  }

  solve () {
    while (this.spacesToSolve.size > 0) {
      if (this.markTrivialSpaces()) {
        continue
      }
      if (this.markTrivialSpacesByVisibility()) {
        continue
      }
      return false
    }
    return true
  }

  markTrivialSpaces () {
    let marked = false
    for (let space of this.spacesToSolve) {
      if (space.id !== -1) {
        this.spacesToSolve.delete(space)
        continue
      }
      let possibleGalaxyIds = []
      for (let id = 0; id < this.puzzle.centers.length; id++) {
        const oppositeSpace = this.puzzle.getOppositeSpaceFromId(space, id)
        if (oppositeSpace && oppositeSpace.id === -1) {
          possibleGalaxyIds.push(id)
        }
      }
      if (possibleGalaxyIds.length === 1) {
        this.updateSpace(space, possibleGalaxyIds[0])
        marked = true
      }
    }
    return marked
  }

  markTrivialSpacesByVisibility () {
    let marked = false
    const possibleGalaxyIds = new Map()
    for (let id = 0; id < this.puzzle.centers.length; id++) {
      const visibleSpaces = this.getVisibleUnprocessedSpaces(id)
      for (const space of visibleSpaces) {
        if (!possibleGalaxyIds.has(space)) {
          possibleGalaxyIds.set(space, [])
        }
        possibleGalaxyIds.get(space).push(id)
      }
    }

    for (const [space, ids] of possibleGalaxyIds.entries()) {
      if (ids.length === 1) {
        this.updateSpace(space, ids[0])
        marked = true
      }
    }
    return marked
  }

  updateSpace (space, id) {
    this.puzzle.setSymmetricallyAt(space, id)
    const opposite = this.puzzle.getOppositeSpaceFromId(space, id)
    this.spacesToSolve.delete(opposite)
    this.spacesToSolve.delete(space)
    this.spacesPerGalaxy[id].push(space)
  }

  getVisibleUnprocessedSpaces (id) {
    const result = new Set()
    const toProcess = new Set(this.spacesPerGalaxy[id])
    const processed = new Set()
    while (toProcess.size > 0) {
      const space = popFromSet(toProcess)
      processed.add(space)
      const neighbours = this.puzzle
        .getNeighbouringSpaces(space)
        .filter(x => {
          if (!x) return false
          if (x.id !== -1) return false
          const oppositeSpace = this.puzzle.getOppositeSpaceFromId(x, id)
          if (!oppositeSpace) return false
          if (oppositeSpace.id !== -1) return false
          return true
        })
      for (const neighbor of neighbours) {
        if (!processed.has(neighbor)) {
          toProcess.add(neighbor)
        }
        result.add(neighbor)
        result.add(this.puzzle.getOppositeSpaceFromId(neighbor, id))
      }
    }
    return result
  }
}