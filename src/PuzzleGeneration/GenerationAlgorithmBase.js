import { Board } from '../Board.js'
import { Vector2 } from '../Math/Vector2.js'

export class GenerationAlgorithmBase {
  constructor (size, wrapping) {
    this.board = new Board(size, wrapping)
    this.size = size
    this.wrapping = wrapping

    this.maxGalaxySize = 2 * this.size - (this.wrapping ? 1 : 0)
  }

  mergeSingletons () {
    this.board.galaxies.forEach(galaxy => {
      if (galaxy.spaces.size === 1) {
        const space = [...galaxy.spaces][0]
        space.isSingleton = true
      }
    })

    const galaxiesToRemove = []

    const processSpaces = (center, spaces) => {
      if (spaces.length <= 1) return

      spaces = new Set(spaces)

      this.board.galaxies.push({ center, spaces, centerSpaces: spaces })
      spaces.forEach(space => {
        galaxiesToRemove.push(space.id)
        space.isSingleton = false
      })
    }

    // First see if there are clusters of 4 singletons
    const maxX = this.wrapping ? this.size : this.size - 1
    const maxY = this.wrapping ? this.size : this.size - 1
    for (let x = 0; x < maxX; x++) {
      for (let y = 0; y < maxY; y++) {
        const center = new Vector2(x + 1, y + 1)
        const spaces = [
          this.board.getSpaceAt({ x, y }),
          this.board.getSpaceAt({ x: x + 1, y }),
          this.board.getSpaceAt({ x, y: y + 1 }),
          this.board.getSpaceAt({ x: x + 1, y: y + 1 })
        ]
        if (spaces.every(space => space.isSingleton)) {
          processSpaces(center, spaces)
        }
      }
    }

    // Then for horizontal clusters
    for (let x = 0; x < maxX; x++) {
      for (let y = 0; y < this.size; y++) {
        let spaces = [this.board.getSpaceAt({ x, y })]
        if (!spaces[0].isSingleton) {
          continue
        }

        const maxX2 = this.wrapping ? x + this.size : this.size
        for (let x2 = x + 1; x2 < maxX2; x2++) {
          const space = this.board.getSpaceAt({ x: x2, y })
          if (space.isSingleton) {
            spaces.push(space)
          } else {
            break
          }
        }

        const center = new Vector2(x + spaces.length / 2, y + 0.5)
        processSpaces(center, spaces)
      }
    }

    // And finally vertical clusters
    for (let y = 0; y < maxY; y++) {
      for (let x = 0; x < this.size; x++) {
        let spaces = [this.board.getSpaceAt({ x, y })]
        if (!spaces[0].isSingleton) {
          continue
        }

        const maxY2 = this.wrapping ? y + this.size : this.size
        for (let y2 = y + 1; y2 < maxY2; y2++) {
          const space = this.board.getSpaceAt({ x, y: y2 })
          if (space.isSingleton) {
            spaces.push(space)
          } else {
            break
          }
        }

        const center = new Vector2(x + 0.5, y + spaces.length / 2)
        processSpaces(center, spaces)
      }
    }

    // Galaxy ID = its index in this.board.galaxies, so just remove from highest to lowest
    galaxiesToRemove.sort((id1, id2) => id2 - id1)
    for (const id of galaxiesToRemove) {
      this.board.galaxies.splice(id, 1)
    }
  }
}