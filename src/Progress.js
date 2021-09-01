export function saveProgress (progress) {
  window.localStorage.setItem(GAME_ID, progress)
}

export function loadProgress () {
  return +window.localStorage.getItem(GAME_ID)
}
