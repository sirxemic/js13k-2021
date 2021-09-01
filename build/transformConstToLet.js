export const transformConstToLet = {
  transformBundle (code) {
    return code.replace(/\bconst\b/g, 'let')
  }
}