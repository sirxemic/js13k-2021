import { Puzzle } from './Puzzle.js'
import { GenerationAlgorithm1 } from './PuzzleGeneration/GenerationAlgorithm1.js'
import { PuzzleSolver } from './PuzzleGeneration/PuzzleSolver.js'

export class PuzzleGenerator {
  constructor ({ width, height, wrapping, difficulty }) {
    this.width = width
    this.height = height
    this.wrapping = wrapping
    this.difficulty = difficulty
  }

  generate () {
    let pass
    let bestPass
    let i

    for (i = 0; i < 100; i++) {
      pass = new GenerationAlgorithm1(this.width, this.height, this.wrapping)
      pass.generate()
      const diffDiff = this.matchesDifficulty(pass)

      // <dev-only>
      console.log({ 0: 'correct diff', '-1': 'too easy', 1: 'too hard' }[diffDiff])
      // </dev-only>
      if (diffDiff === 0) {
        bestPass = pass
        break
      } else if (!bestPass || diffDiff === -1) {
        bestPass = pass
      }
    }
    // <dev-only>
    console.log(i, 'passes')
    bestPass.board.debug()
    // </dev-only>
    return new Puzzle(this.width, this.height, bestPass.board.galaxies, this.wrapping)
  }

  matchesDifficulty (pass) {
    const { galaxies } = pass.board
    const solver = new PuzzleSolver(new Puzzle(this.width, this.height, galaxies, this.wrapping))
    const result = solver.solve()

    // Check that there aren't too few or too many galaxies to expand
    let expandableGalaxyCount = 0
    for (const galaxy of galaxies) {
      if (galaxy.centerSpaces.size < galaxy.spaces.size) {
        expandableGalaxyCount++
      }
    }
    const minimum = this.difficulty === 0 ? 3 : 5
    const maximum = Math.sqrt(this.width * this.height) - 1
    if (expandableGalaxyCount < minimum) {
      return -1 // Too easy
    }
    if (expandableGalaxyCount > maximum) {
      return 1 // Too hard
    }

    if (result) {
      // Solvable without backtracking
      return this.difficulty === 1 ? -1 : 0
    } else {
      // Not solvable without backtracking (or multiple solutions exist)
      return this.difficulty === 1 ? 0 : 1
    }
  }
}
