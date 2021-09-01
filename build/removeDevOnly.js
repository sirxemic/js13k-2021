export const removeDevOnly = {
  transformBundle (code) {
    const result = code.replace(/<dev-only>[\s\S]*?<\/dev-only>/g, '')
    if (result.includes('dev-only')) {
      const index = result.indexOf('dev-only')
      context = result.substr(index - 25, 100)
      throw new Error('Found broken dev-only tags: ' + context)
    }
    return result
  }
}
