import { Vector2 } from '../Math/Vector2.js'
import { closestModulo, shuffle } from '../utils.js'
import { GenerationAlgorithmBase } from './GenerationAlgorithmBase.js'

const SPACE_TYPE = 0
const EDGE_H_TYPE = 1
const EDGE_V_TYPE = 2
const CORNER_TYPE = 3

export class GenerationAlgorithm1 extends GenerationAlgorithmBase {
  constructor (size, wrapping) {
    super(size, wrapping)
  }

  generate () {
    const startX = this.wrapping ? 0 : 0.5
    const startY = this.wrapping ? 0 : 0.5
    const endX = this.board.size - 0.5
    const endY = this.board.size - 0.5

    const todo = []
    for (let y = startY; y <= endY; y += 0.5) {
      for (let x = startX; x <= endX; x += 0.5) {
        let type
        if (x % 1 === 0.5 && y % 1 === 0.5) {
          type = SPACE_TYPE
        } else if (x % 1 === 0.5) {
          type = EDGE_H_TYPE
        } else if (y % 1 === 0.5) {
          type = EDGE_V_TYPE
        } else {
          type = CORNER_TYPE
        }
        todo.push({ x, y, type })
      }
    }

    shuffle(todo)

    for (let i = 0; i < todo.length; i++) {
      const thing = todo[i]
      if (thing.type !== CORNER_TYPE) {
        const expanded = this.tryExpand(thing)
        if (expanded) {
          continue
        }
      }

      if ((thing.type === EDGE_H_TYPE || thing.type === EDGE_V_TYPE) && i % 2) {
        continue
      }

      this.board.addGalaxyAt(thing)
    }

    this.mergeSingletons()
  }

  tryExpand (thing) {
    const spaces = this.board.getTouchingSpaces(thing)
    if (spaces.some(space => space.id !== -1)) {
      return false
    }

    const neighboringSpaces = this.board.getNeighboursForMultiple(spaces)
    shuffle(neighboringSpaces)

    for (const neighbour of neighboringSpaces) {
      const galaxyId = neighbour.id
      if (galaxyId === -1) continue
      const galaxySize = this.board.galaxies[galaxyId].spaces.size
      if (galaxySize < this.maxGalaxySize && this.tryExpandOrMoveGalaxy(galaxyId, spaces)) {
        return true
      }
    }

    return false
  }

  tryExpandOrMoveGalaxy (id, spaces) {
    const center = this.board.galaxies[id].center
    const currentGalaxySize = this.board.galaxies[id].spaces.size
    const opposites = spaces.map(space => {
      return this.board.getOppositeSpaceFrom(space, center)
    })

    const oppositesAreValid = opposites.every(opposite => {
      return opposite && (opposite.id === -1 || opposite.id === id)
    })

    if (oppositesAreValid) {
      for (const space of spaces) {
        this.board.setSymmetricallyAt(space, id)
      }
      return true
    }

    // Expanding failed, try moving center
    const newCenter = new Vector2(
      center.x * currentGalaxySize,
      center.y * currentGalaxySize
    )

    spaces.forEach(space => {
      newCenter.x += this.board.wrapping ? closestModulo(center.x, space.x + 0.5, this.board.size) : space.x + 0.5
      newCenter.y += this.board.wrapping ? closestModulo(center.y, space.y + 0.5, this.board.size) : space.y + 0.5
    })

    newCenter.x /= currentGalaxySize + spaces.length
    newCenter.y /= currentGalaxySize + spaces.length

    newCenter.x = (newCenter.x + this.board.size) % this.board.size
    newCenter.y = (newCenter.y + this.board.size) % this.board.size

    if (newCenter.x % 0.5 !== 0 || newCenter.y % 0.5 !== 0) {
      // new center to encompass new spaces does not lie on a valid position
      return false
    }

    // Check if the existing spaces of the galaxy still have valid opposites with the new center
    // and the new ones as well
    const newSpaces = [...this.board.galaxies[id].spaces, ...spaces]
    for (const space of newSpaces) {
      const opposite = this.board.getOppositeSpaceFrom(space, newCenter)
      if (!opposite || (opposite.id !== -1 && opposite.id !== id)) {
        return false
      }
    }

    this.board.galaxies[id].center = newCenter

    for (const space of newSpaces) {
      this.board.setSymmetricallyAt(space, id)
    }

    return true
  }
}
