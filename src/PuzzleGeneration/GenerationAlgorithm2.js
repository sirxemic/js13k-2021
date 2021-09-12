import { pickRandomFromArray, popFromSet } from '../utils.js'
import { Vector2 } from '../Math/Vector2.js'
import { GenerationAlgorithmBase } from './GenerationAlgorithmBase.js'

export class GenerationAlgorithm2 extends GenerationAlgorithmBase {
  constructor (size, wrapping) {
    super(size, wrapping)
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
    const maxX = this.size - 0.5
    const maxY = this.size - 0.5

    for (let x = minX; x <= maxX; x += 0.5) {
      for (let y = minY; y <= maxY; y += 0.5) {
        this.availableCenterPositions.add(`${x}_${y}`)
      }
    }

    this.centerGalaxySpaces = new Map()
  }

  addGalaxy () {
    const maxSize = 3 + Math.round(Math.random() * (this.maxGalaxySize - 3))

    const centerString = pickRandomFromArray([...this.availableCenterPositions])

    // Shortcut to save bytes: use Vector2 here so we don't have to create it later
    const center = new Vector2(
      +centerString.split('_')[0],
      +centerString.split('_')[1]
    )

    const { id, spaces } = this.board.addGalaxyAt(center)

    spaces.forEach(space => this.updateAvailableCenterPositions(space))

    // Due to symmetry we don't have to process all spaces:
    // - If the center is centered in a space, just pick that only space
    // - If the center is on an edge, just pick the first one
    // - If the center is on a corner, pick the first two
    const toProcess = [...spaces]
    if (spaces.size >= 2) {
      toProcess.pop()
    }
    if (spaces.size === 4) {
      toProcess.pop()
    }

    while (toProcess.length > 0 && spaces.size < maxSize) {
      const space = pickRandomFromArray(toProcess)
      const potential = this.board.getNeighbouringSpaces(space)
        .filter(neighbor => (
          // Filter out the neighbors that are already taken
          neighbor.id === -1 &&

          // And those which don't meet the symmetry condition
          this.board.getOppositeSpaceFrom(neighbor, center)?.id === -1
        ))

      // If all potential neighbors are taken, this space is done
      if (potential.length === 0) {
        toProcess.splice(toProcess.indexOf(space), 1)
        continue
      }

      const newSpace = pickRandomFromArray(potential)
      const oppositeSpace = this.board.getOppositeSpaceFrom(newSpace, center)

      this.board.setSymmetricallyAt(newSpace, id)

      this.updateAvailableCenterPositions(newSpace)
      this.updateAvailableCenterPositions(oppositeSpace)

      toProcess.push(newSpace)
    }
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

  updateAvailableCenterPositions (pos) {
    // Also remove the space, its edges and corners from galaxy center potentials
    const { x, y } = pos

    const xm = x + 0.5
    const xr = (x + 1) % this.size
    const ym = y + 0.5
    const yb = (y + 1) % this.size
    this.availableCenterPositions.delete(`${x}_${y}`) // top-left corner
    this.availableCenterPositions.delete(`${xm}_${y}`) // top edge
    this.availableCenterPositions.delete(`${xr}_${y}`) // top-right corner
    this.availableCenterPositions.delete(`${x}_${ym}`) // left edge
    this.availableCenterPositions.delete(`${xm}_${ym}`) // space center
    this.availableCenterPositions.delete(`${xr}_${ym}`) // right edge
    this.availableCenterPositions.delete(`${x}_${yb}`) // bottom-left corner
    this.availableCenterPositions.delete(`${xm}_${yb}`) // bottom-edge
    this.availableCenterPositions.delete(`${xr}_${yb}`) // bottom-right corner
  }

  /**
   * Generate a utility for fetching for a space which galaxies it can be part of
   */
  generateConnectivityMap () {
    this.connectivity = new Map()
    for (const space of this.board.grid) {
      this.connectivity.set(space, new Set())
    }

    for (const galaxy of this.board.galaxies) {
      const toProcess = new Set(galaxy.spaces)
      const done = new Set()

      while (toProcess.size > 0) {
        const space = popFromSet(toProcess)
        const opposite = this.board.getOppositeSpaceFrom(space, galaxy.center)
        toProcess.delete(opposite)

        this.connectivity.get(space).add(galaxy.id)
        this.connectivity.get(opposite).add(galaxy.id)

        done.add(space)
        done.add(opposite)

        const neighbours = this.board.getNeighbouringSpaces(space)
        for (const neighbour of neighbours) {
          if (done.has(neighbour)) {
            continue
          }
          const opposite = this.board.getOppositeSpaceFrom(neighbour, galaxy.center)
          if (opposite && !this.centerGalaxySpaces.has(opposite)) {
            toProcess.add(neighbour)
          }
        }
      }
    }
  }

  isSpaceAccessibleFromGalaxy (space, id) {
    return this.connectivity.get(space).has(id)
  }
}