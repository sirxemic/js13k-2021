export let delta
export function setDelta (value) {
  delta = value
}

export let currentPuzzle
export function setCurrentPuzzle (puzzle) {
  currentPuzzle = puzzle
}

export let currentTime
export function updateTime () {
  currentTime = performance.now() / 1000
}

export let puzzleSettings = {
  size: 7,
  difficulty: 0,
  wrapping: false
}

export function updatePuzzleSettings (settings) {
  puzzleSettings = settings
}