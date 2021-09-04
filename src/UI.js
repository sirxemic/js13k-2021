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

export function bindIntroDismiss (callback) {
  onIntroDismiss = callback
}

export function bindDifficultySelect (callback) {
  onDifficultySelect = callback
}

const introModal = getElement(classNames.intro)
const difficultyModal = getElement(classNames.menu)

introModal.onclick = () => {
  introModal.style.display = 'none'
  onIntroDismiss()
}

getElement(classNames.openMenu).onclick = () => {
  difficultyModal.style.display = 'flex'
}

difficultyModal.onclick = (e) => {
  if (e.target === difficultyModal) {
    difficultyModal.style.display = 'none'
  } else if (e.target.dataset.diff) {
    difficultyModal.style.display = 'none'
    const data = JSON.parse(e.target.dataset.diff)
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
