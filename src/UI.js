import { classNames } from './classNames.js'
import { puzzleSettings } from './globals.js'

// <dev-only>
for (let key in classNames) {
  classNames[key] = key
}
// </dev-only>

function getElement (name) {
  return document.querySelector('.' + name)
}

function getElements (name) {
  return document.querySelectorAll('.' + name)
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
const difficultyDoneButton = getElement(classNames.closeMenu)
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
export function updateLoader () {
  loadingScreen.textContent += '.'
}
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

export function updateDifficultyButton () {
  const edgeless = puzzleSettings.wrapping ? ' Endless' : ''
  const difficulty = puzzleSettings.difficulty ? 'Ridiculous' : 'Normal'
  difficultyButton.textContent =
    `${puzzleSettings.size}x${puzzleSettings.size}${edgeless} - ${difficulty}`
}

let dirtySettings

function updateSettingButtons () {
  getElements(classNames.button).forEach(button => {
    button.classList.remove(classNames._active)
  })
  difficultyModal.querySelector(`[data-s="${dirtySettings.size}"]`).classList.add(classNames._active)
  difficultyModal.querySelector(`[data-w="${+dirtySettings.wrapping}"]`).classList.add(classNames._active)
  difficultyModal.querySelector(`[data-d="${dirtySettings.difficulty}"]`).classList.add(classNames._active)
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
    const steps = [...getElements(classNames.step)]
    let foundVisible = false

    for (let i = 0; i < steps.length; i++) {
      const el = steps[i]
      if (!el.classList.contains(classNames._hidden)) {
        foundVisible = true
        toggleVisibility(el, false)

      } else if (foundVisible) {
        toggleVisibility(el, true)
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
    dirtySettings = { ...puzzleSettings }
    updateSettingButtons()
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
    } else if (e.target.dataset['s']) {
      dirtySettings.size = Number(e.target.dataset['s'])
    } else if (e.target.dataset['w']) {
      dirtySettings.wrapping = Number(e.target.dataset['w'])
    } else if (e.target.dataset['d']) {
      dirtySettings.difficulty = Number(e.target.dataset['d'])
    } else if (e.target === difficultyDoneButton) {
      onDifficultySelect(dirtySettings)
      toggleVisibility(difficultyModal, false)
    }

    updateSettingButtons()
  }
}
