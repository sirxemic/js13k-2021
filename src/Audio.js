import { TheAudioContext, TheAudioDestination } from './Audio/Context.js'
import { sampleNoise } from './Audio/SoundGeneration.js'

export function playSample (sample) {
  let source = TheAudioContext.createBufferSource()
  source.buffer = sample
  source.playbackRate.value = Math.pow(2, sampleNoise() * 0.1)
  source.connect(TheAudioDestination)
  source.start()
}
