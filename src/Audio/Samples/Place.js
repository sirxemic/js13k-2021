import {
  generateSound,
  applyEnvelope,
  getFrequencyDelta,
  sampleTriangle,
  lowPassFilter,
} from '../SoundGeneration.js'

const volumeEnvelope = [
  [0, 0],
  [0.01, 0.5, 0.5],
  [1, 0]
]

export function createPlaceSound () {
  let p = 0
  function getSample (t) {
    p += getFrequencyDelta(44)
    return sampleTriangle(p)
  }

  return applyEnvelope(lowPassFilter(generateSound(0.1, getSample), 2000), volumeEnvelope)
}
