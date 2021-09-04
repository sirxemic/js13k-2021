import {
  generateSound,
  applyEnvelope,
  getFrequencyDelta,
  sampleTriangle
} from '../SoundGeneration.js'

const volumeEnvelope = [
  [0, 0],
  [0.0001, 0.1],
  [0.01, 0.5, 0.3],
  [0.1, 0.25, 0.5],
  [1, 0]
]

export function createPluckSound (frequency) {

  let p = 0

  function getSample () {
    p += getFrequencyDelta(frequency)
    return sampleTriangle(p)
  }

  return applyEnvelope(generateSound(2, getSample), volumeEnvelope)
}
