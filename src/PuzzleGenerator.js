import { Puzzle } from './Puzzle.js'
import { DebugAlgorithm } from './PuzzleGeneration/DebugAlgorithm.js'
import { GenerationAlgorithm1 } from './PuzzleGeneration/GenerationAlgorithm1.js'
import { PuzzleSolver } from './PuzzleGeneration/PuzzleSolver.js'

const USE_PRESET = false

export class PuzzleGenerator {
  constructor ({ size, wrapping, difficulty }) {
    this.size = size
    this.wrapping = wrapping
    this.difficulty = difficulty
  }

  generate () {
    let pass
    let bestPass
    let i

    const maxPasses = USE_PRESET ? 1 : 200

    for (i = 0; i < maxPasses; i++) {
      const Algo = USE_PRESET ? DebugAlgorithm : GenerationAlgorithm1
      pass = new Algo(this.size, this.wrapping)
      pass.generate()
      const diffDiff = this.matchesDifficulty(pass)

      // <dev-only>
      console.log({ 0: 'correct difficulty', '-1': 'too easy', 1: 'too hard' }[diffDiff])
      // </dev-only>
      if (diffDiff === 0) {
        bestPass = pass
        break
      } else if (!bestPass || diffDiff === -1) {
        bestPass = pass
      }
    }
    // <dev-only>
    console.log(i === maxPasses ? 'Could not find a puzzle with the right difficulty' : `Took ${i} passes`)
    bestPass.debug()
    // </dev-only>
    return new Puzzle(this.size, bestPass.galaxies, this.wrapping)
  }

  matchesDifficulty (pass) {
    const { galaxies } = pass
    const solver = new PuzzleSolver(new Puzzle(this.size, galaxies, this.wrapping))
    const result = solver.solve()

    // <dev-only>
    let expandableGalaxyCount = 0
    for (const galaxy of galaxies) {
      if (galaxy.centerSpaces.size < galaxy.spaces.size) {
        expandableGalaxyCount++
      }
    }
    console.log('Expandable galaxy count:', expandableGalaxyCount)
    // </dev-only>
    // Check that there aren't too few or too many galaxies to expand
    // const minimum = this.difficulty === 0 ? 3 : 5
    // const maximum = this.size - 1
    // if (expandableGalaxyCount < minimum) {
    //   // <dev-only>
    //   console.log('Too new expandle galaxies (too easy)')
    //   // </dev-only>
    //   return -1 // Too easy
    // }
    // if (expandableGalaxyCount > maximum) {
    //   // <dev-only>
    //   console.log('Too many expandle galaxies (too hard)')
    //   // </dev-only>
    //   return 1 // Too hard
    // }

    if (result) {
      // <dev-only>
      console.log('solvable without backtracking')
      // </dev-only>
      // Solvable without backtracking
      return this.difficulty === 1 ? -1 : 0
    } else {
      // <dev-only>
      console.log('not solvable without backtracking')
      // </dev-only>
      // Not solvable without backtracking (or multiple solutions exist)
      return this.difficulty === 1 ? 0 : 1
    }
  }
}
