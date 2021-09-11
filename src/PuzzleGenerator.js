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

    for (i = 0; i < 300; i++) {
      pass = new GenerationAlgorithm1(this.width, this.height, this.wrapping)
      pass.generate()
      const diffDiff = this.matchesDifficulty(pass)
      console.log({ 0: 'correct diff', '-1': 'too easy', 1: 'too hard' }[diffDiff])
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
    const solver = new PuzzleSolver(new Puzzle(this.width, this.height, pass.board.galaxies, this.wrapping))
    const result = solver.solve()

    if (result) {
      // Solvable without backtracking
      return this.difficulty === 1 ? -1 : 0
    } else {
      // Not solvable without backtracking (or multiple solutions exist)
      return this.difficulty === 1 ? 0 : 1
    }
  }
}
