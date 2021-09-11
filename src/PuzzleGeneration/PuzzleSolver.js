import { popFromSet } from '../utils.js'

export class PuzzleSolver {
  constructor (puzzle) {
    this.puzzle = puzzle

    this.spacesToSolve = new Set(this.puzzle.grid)
    this.spacesPerGalaxy = this.puzzle.centers.map(_ => [])
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

    for (const space of possibleGalaxyIds.keys()) {
      const ids = possibleGalaxyIds.get(space)
      if (ids.get(space).length === 1) {
        this.updateSpace(space, popFromSet(ids))
        marked = true
      }
    }
    return marked
  }

  updateSpace (space, id) {
    this.puzzle.setSymmetricallyAt(space, id)
    this.spacesToSolve.delete(space)
    this.spacesPerGalaxy[id].push(space)
  }

  getVisibleUnprocessedSpaces (id) {
    const result = new Set()
    const toProcess = new Set(this.spacesPerGalaxy[id])
    const processed = new Set()
    while (toProcess.length > 0) {
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
      for (const neighbor in neighbours) {
        if (!processed.has(space)) {
          toProcess.add(neighbor)
        }
        result.add(neighbor)
      }
    }
    return result
  }
}