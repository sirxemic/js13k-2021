import {
  generateSound,
  applyEnvelope,
  getFrequencyDelta,
  sampleSine
} from '../SoundGeneration.js'

const volumeEnvelope = [
  [0, 0],
  [0.01, 1, 0.9],
  [0.999, 0.43],
  [1, 0]
]

export function createBassSound (frequency, length) {
  let p = 0

  function getSample (t) {
    p += getFrequencyDelta(frequency)
    return sampleSine(p) + sampleSine(p * 2) * 0.21
  }

  return applyEnvelope(generateSound(length, getSample), volumeEnvelope)
}
