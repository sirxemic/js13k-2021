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
  element.classList.toggle(classNames.hidden, !show)
}

/**
 * UI event handlers
 */

let onIntroDismiss
let onDifficultySelect
let onUndo
let onNewGame

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

/**
 * UI controllers
 *
 */

export function toggleUndo (show) {
  toggleVisibility(undoButton, show)
}

export function updateDifficultyButton (settings) {
  difficultyButton.textContent = `${settings.width}x${settings.height}${settings.wrapping ? ' with wrapping' : ''} - ${settings.difficulty ? 'Hard' : 'Easy'}`
}

const introModal = getElement(classNames.intro)
const difficultyModal = getElement(classNames.menu)
const difficultyButton = getElement(classNames.openMenu)
const newGameButton = getElement(classNames.new)
const undoButton = getElement(classNames.undo)

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
    difficultyButton.textContent = `${data[0]}x${data[1]}${data[3] ? ' with wrapping' : ''} - ${data[2] ? 'Hard' : 'Easy'}`
    onDifficultySelect({
      width: data[0],
      height: data[1],
      difficulty: data[2],
      wrapping: data[3]
    })
  }
}

function processMonetization () {
  // TODO
}

if (document['monetization']) {
  document['monetization'].addEventListener('monetizationstart', processMonetization)
}
