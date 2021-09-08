import { generateSound, bandPassFilter, applyEnvelope, sampleNoise } from '../SoundGeneration.js'

export function createLockSound () {
  const volumeEnvelope = [
    [0.0, 0.3, 0.2],
    [0.5, 0],
    [0.501, 0.5, 0.2],
    [1, 0]
  ]

  return bandPassFilter(
    applyEnvelope(generateSound(0.1, sampleNoise), volumeEnvelope),
    1800,
    3
  )
}