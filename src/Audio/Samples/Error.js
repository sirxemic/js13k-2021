import {
  generateSound,
  applyEnvelope,
  getFrequencyDelta,
  sampleSawtooth,
  lowPassFilter,
} from '../SoundGeneration.js'

const volumeEnvelope = [
  [0, 0],
  [0.001, 0.5, 0.5],
  [0.5, 0],
  [0.501, 0.5, 0.5],
  [1, 0]
]

export function createErrorSound () {
  let p = 0
  function getSample (t) {
    p += getFrequencyDelta(44)
    return sampleSawtooth(p)
  }

  return applyEnvelope(lowPassFilter(generateSound(0.25, getSample), 500, 1.5), volumeEnvelope)
}
