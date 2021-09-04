import { classNames } from './classNames.js'
import { currentPuzzle } from './globals.js'

// <dev-only>
for (let key in classNames) {
  classNames[key] = key
}
// </dev-only>

function getElement (name) {
  return document.querySelector('.' + name)
}

export function updateUI () {
  // TODO
}

let onIntroDismiss
let onDifficultySelect
let onNewGame

export function bindIntroDismiss (callback) {
  onIntroDismiss = callback
}

export function bindDifficultySelect (callback) {
  onDifficultySelect = callback
}

export function bindNewGame (callback) {
  onNewGame = callback
}

const introModal = getElement(classNames.intro)
const difficultyModal = getElement(classNames.menu)
const difficultyButton = getElement(classNames.openMenu)
const newGameButton = getElement(classNames.new)

introModal.onclick = () => {
  introModal.style.display = 'none'
  onIntroDismiss()
}

difficultyButton.onclick = () => {
  difficultyModal.style.display = 'flex'
}

newGameButton.onclick = () => {
  onNewGame()
}

export function updateDifficultyButton (settings) {
  difficultyButton.textContent = `${settings.width}x${settings.height}${settings.wrapping ? ' with wrapping' : ''} - ${settings.difficulty ? 'Hard' : 'Easy'}`
}

difficultyModal.onclick = (e) => {
  if (e.target === difficultyModal) {
    difficultyModal.style.display = 'none'
  } else if (e.target.dataset['diff']) {
    difficultyModal.style.display = 'none'
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
