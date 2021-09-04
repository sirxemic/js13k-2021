import { Song } from './Song.js'
import { applyEnvelope, createAudioBuffer } from './SoundGeneration.js'
import {
  addNotes,
  createTempBuffer} from './SongGeneration.js'
import { createPadsSound } from './MusicSamples/Pads.js'
import { waitForNextFrame } from '../utils.js'

const measureCount = 2
const bpm = 55
const trackBeatCount = measureCount * 4

async function createMelodyTrack () {
  const output = [
    createTempBuffer(trackBeatCount, bpm),
    createTempBuffer(trackBeatCount, bpm)
  ]

  addNotes([
    [0, -19, 4],
    [0.1, -12, 4],
    [0.2, -7, 4],
    [0.3, -3, 4],

    [0.4, 5, 4],
  ], output, createPadsSound, bpm)

  const fadeOut = [
    [0, 1],
    [0.2, 1, 0.9],
    [1, 0]
  ]

  await waitForNextFrame()

  applyEnvelope(output[0], fadeOut)
  applyEnvelope(output[1], fadeOut)

  return createAudioBuffer(output)
}

export default async function createSong () {
  const [
    bufferMelody
  ] = await Promise.all([
    createMelodyTrack()
  ])

  return new Song(
    [
      { buffer: bufferMelody, volume: 0.32, sendToReverb: 2 }
    ],
    false
  )
}
