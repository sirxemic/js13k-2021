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
const startButton = getElement(classNames.start)
const tutorialButton = getElement(classNames.tutorial)
const tutorialDoneButton = getElement(classNames.tutorialDone)
const nextButton = getElement(classNames.next)
const tutorialModal = getElement(classNames.tutorialModal)
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
let onStart
let onTutorial
let onTutorialEnd
let onDifficultySelect
let onUndo
let onNewGame
let onSolve
let onRestart

export function bindStart (callback) {
  onStart = callback
}

export function bindTutorial (callback) {
  onTutorial = callback
}

export function bindTutorialEnd (callback) {
  onTutorialEnd = callback
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

export function showTutorial () {
  toggleVisibility(tutorialModal, true)
}

export function showButtons () {
  toggleVisibility(topButtons, true)
  toggleVisibility(difficultyButton, true)
}

export function hideButtons () {
  toggleUndo(false)
  toggleVisibility(topButtons, false)
  toggleVisibility(difficultyButton, false)
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
  difficultyButton.textContent = `${settings.size}x${settings.size}${settings.wrapping ? ' no edge' : ''} - ${settings.difficulty ? 'Hard' : 'Easy'}`
}

export function start () {
  toggleVisibility(loadingScreen, false)

  startButton.onclick = () => {
    toggleVisibility(introModal, false)
    toggleVisibility(tutorialModal, false)
    onStart()
  }

  tutorialButton.onclick = () => {
    toggleVisibility(introModal, false)
    onTutorial()
  }

  nextButton.onclick = () => {
    const steps = [...document.querySelectorAll('.' + classNames.step)]
    let foundVisible = false

    for (let i = 0; i < steps.length; i++) {
      const el = steps[i]
      if (!el.classList.contains(classNames._hidden)) {
        foundVisible = true
        el.classList.add(classNames._hidden)

      } else if (foundVisible) {
        el.classList.remove(classNames._hidden)
        if (i === steps.length - 1) {
          toggleVisibility(nextButton, false)
          toggleVisibility(tutorialDoneButton, true)
        }
        break
      }
    }
  }

  tutorialDoneButton.onclick = () => {
    toggleVisibility(introModal, false)
    toggleVisibility(tutorialModal, false)
    onTutorialEnd()
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
        size: data[0],
        difficulty: data[1],
        wrapping: data[2]
      })
    }
  }
}
