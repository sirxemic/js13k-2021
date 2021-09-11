import { shuffle } from '../utils.js'
import { GenerationAlgorithmBase } from './GenerationAlgorithmBase.js'

const CELL_TYPE = 0
const EDGE_H_TYPE = 1
const EDGE_V_TYPE = 2
const CORNER_TYPE = 3

export class GenerationAlgorithm1 extends GenerationAlgorithmBase {
  constructor (width, height, wrapping) {
    super(width, height, wrapping)
  }

  generate () {
    const startX = this.wrapping ? 0 : 0.5
    const startY = this.wrapping ? 0 : 0.5
    const endX = this.board.width - 0.5
    const endY = this.board.height - 0.5

    const todo = []
    for (let y = startY; y <= endY; y += 0.5) {
      for (let x = startX; x <= endX; x += 0.5) {
        let type
        if (x % 1 === 0.5 && y % 1 === 0.5) {
          type = CELL_TYPE
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
    const cells = this.board.getTouchingCells(thing)
    if (cells.some(cell => cell.id !== -1)) {
      return false
    }

    const neighboringCells = this.board.getNeighboursForMultiple(cells)
    shuffle(neighboringCells)

    for (const neighbour of neighboringCells) {
      const galaxyId = neighbour.id
      if (galaxyId === -1) continue
      const galaxySize = this.board.galaxies[galaxyId].cells.size
      if (galaxySize < this.maxGalaxySize && this.tryExpandOrMoveGalaxy(galaxyId, cells)) {
        return true
      }
    }

    return false
  }

  tryExpandOrMoveGalaxy (id, cells) {
    const center = this.board.galaxies[id].center
    const currentGalaxySize = this.board.galaxies[id].cells.size
    const opposites = cells.map(cell => {
      return this.board.getOppositeCellFrom(cell, center)
    })

    const oppositesAreValid = opposites.every(opposite => {
      return opposite && (opposite.id === -1 || opposite.id === id)
    })

    if (oppositesAreValid) {
      for (const cell of cells) {
        this.board.setSymmetricallyAt(cell, id)
      }
      return true
    }

    // Expanding failed, try moving center
    let centerX = center.x * currentGalaxySize
    let centerY = center.y * currentGalaxySize

    cells.forEach(cell => {
      centerX += cell.x
      centerY += cell.y
    })

    centerX /= currentGalaxySize + cells.length
    centerY /= currentGalaxySize + cells.length

    if (centerX % 0.5 !== 0 || centerY % 0.5 !== 0) {
      // new center to encompass new cells does not lie on a valid position
      return false
    }

    // Check if the existing cells of the galaxy still have valid opposites with the new center
    // and the new ones as well
    for (const cell of [...this.board.galaxies[id].cells, ...cells]) {
      const opposite = this.board.getOppositeCellFrom(cell, { x: centerX, y: centerY })
      if (!opposite || (opposite.id !== -1 && opposite.id !== id)) {
        return false
      }
    }

    for (const cell of cells) {
      this.board.setSymmetricallyAt(cell, id)
    }

    return true
  }
}
