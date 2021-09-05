import { classNames } from './classNames.js'

// <dev-only>
for (let key in classNames) {
  classNames[key] = key
}
// </dev-only>

function getElement (name) {
  return document.querySelector('.' + name)
}

function toggleVisibility (element, show) {
  element.classList.toggle(classNames._hidden, !show)
}

const introModal = getElement(classNames.intro)
const difficultyModal = getElement(classNames.menu)
const difficultyButton = getElement(classNames.openMenu)
const newGameButton = getElement(classNames.new)
const restartGameButton = getElement(classNames.restart)
const solveGameButton = getElement(classNames.solve)
const undoButton = getElement(classNames.undo)
const loadingScreen = getElement(classNames.loading)
const topButtons = getElement(classNames.topButtons)
const congratulations = getElement(classNames.congratulations)

/**
 * UI event handlers
 */
let onIntroDismiss
let onDifficultySelect
let onUndo
let onNewGame
let onSolve
let onRestart

export function bindIntroDismiss (callback) {
  onIntroDismiss = callback
}

export function bindDifficultySelect (callback) {
  onDifficultySelect = callback
}

export function bindUndo (callback) {
  onUndo = callback
}

export function bindNewGame (callback) {
  onNewGame = callback
}

export function bindSolve (callback) {
  onSolve = callback
}

export function bindRestart (callback) {
  onRestart = callback
}

/**
 * UI controlling functions
 */
export function toggleUndo (show) {
  toggleVisibility(undoButton, show)
}

export function showButtons () {
  toggleVisibility(topButtons, true)
}

export function hideButtons () {
  toggleUndo(false)
  toggleVisibility(topButtons, false)
}

export function showCongratulations () {
  toggleVisibility(congratulations, true)

  setTimeout(() => {
    hideCongratulations()
  }, 5000)
}

export function hideCongratulations () {
  toggleVisibility(congratulations, false)
}

export function updateDifficultyButton (settings) {
  difficultyButton.textContent = `${settings.width}x${settings.height}${settings.wrapping ? ' no border' : ''} - ${settings.difficulty ? 'Hard' : 'Easy'}`
}

export function start () {
  toggleVisibility(loadingScreen, false)

  introModal.onclick = () => {
    toggleVisibility(introModal, false)
    onIntroDismiss()
  }

  difficultyButton.onclick = () => {
    toggleVisibility(difficultyModal, true)
  }

  newGameButton.onclick = () => {
    onNewGame()
  }

  undoButton.onclick = () => {
    onUndo()
  }

  restartGameButton.onclick = () => {
    onRestart()
  }

  solveGameButton.onclick = () => {
    onSolve()
  }

  document.addEventListener('keypress', e => {
    if (e.key === 'z') {
      onUndo()
    }
  })

  difficultyModal.onclick = (e) => {
    if (e.target === difficultyModal) {
      toggleVisibility(difficultyModal, false)
    } else if (e.target.dataset['diff']) {
      toggleVisibility(difficultyModal, false)
      const data = JSON.parse(e.target.dataset['diff'])
      onDifficultySelect({
        width: data[0],
        height: data[1],
        difficulty: data[2],
        wrapping: data[3]
      })
    }
  }
}

function processMonetization () {
  // TODO
}

if (document['monetization']) {
  document['monetization'].addEventListener('monetizationstart', processMonetization)
}
