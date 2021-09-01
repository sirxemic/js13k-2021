import packageJson from '../package.json'

export const setGameID = {
  transformBundle (code) {
    return code.replace('GAME_ID', JSON.stringify(`${packageJson.author}_${packageJson.name}`))
  }
}
