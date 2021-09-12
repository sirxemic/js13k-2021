import { Song } from './Song.js'
import { createAudioBuffer } from './SoundGeneration.js'
import {
  addNotes,
  getOffsetForBar,
  createTempBuffer
} from './SongGeneration.js'
import { createBassSound } from './MusicSamples/Bass.js'
import { createPadsSound } from './MusicSamples/Pads.js'
import { waitForNextFrame } from '../utils.js'
import { createPluckSound } from './MusicSamples/Pluck.js'

const measureCount = 32
const bpm = 55
const trackBeatCount = measureCount * 4

async function createBassTrack () {
  const loop = createTempBuffer(8 * 4, bpm)
  addNotes([
    [0, -31, 4],
    [4, -35, 4],
    [8, -31, 4],
    [12, -40, 4],
    [16, -38, 4],
    [20, -36, 4],
    [24, -35, 4],
    [28, -33, 4]
  ], loop, createBassSound, bpm, true)

  const loop2 = new Float32Array(loop)
  // Change one note in the second loop
  addNotes([
    [12, -39, 4],
  ], loop2, createBassSound, bpm, true)

  await waitForNextFrame()

  const output = createTempBuffer(trackBeatCount, bpm)
  output.set(loop, 0)
  output.set(loop2, getOffsetForBar(8, bpm))
  output.set(loop, getOffsetForBar(16, bpm))
  output.set(loop2, getOffsetForBar(24, bpm))

  return createAudioBuffer(output)
}

async function createPadsTrack () {
  function createChord (notes) {
    const clip = [
      createTempBuffer(4, bpm),
      createTempBuffer(4, bpm)
    ]

    addNotes(notes.map(x => [0, x, 4]), clip, createPadsSound, bpm)
    return clip
  }

  const output = [
    createTempBuffer(trackBeatCount, bpm),
    createTempBuffer(trackBeatCount, bpm)
  ]

  const d_5_9 = createChord([-19, -12, -5])
  const bb_5_9 = createChord([-23, -16, -9])
  const f_8_12 = createChord([-28, -16, -9])

  await waitForNextFrame()

  const g_5_9_12 = createChord([-26, -19, -12, -7])
  const a_5_8_10 = createChord([-24, -17, -12, -9])

  await waitForNextFrame()

  const bb_5_9_12 = createChord([-23, -16, -9, -4])
  const c_5_8_13 = createChord([-21, -14, -9, 0])

  await waitForNextFrame()

  const d_5_10maj = createChord([-19, -12, -3])
  const bb_5_10 = createChord([-23, -16, -7])
  const gb_8_13a = createChord([-27, -15, -7])

  await waitForNextFrame()

  const bb_5_10_12 = createChord([-23, -16, -7, -4])
  const c_5_8_10 = createChord([-21, -14, -9, -5])

  const chordProgression = [
    d_5_9,
    bb_5_9,
    d_5_9,
    f_8_12,
    g_5_9_12,
    a_5_8_10,
    bb_5_9_12,
    c_5_8_13,

    d_5_10maj,
    bb_5_10,
    d_5_10maj,
    gb_8_13a,
    g_5_9_12,
    a_5_8_10,
    bb_5_10_12,
    c_5_8_10
  ]

  for (let i = 0; i < chordProgression.length; i++) {
    const chord = chordProgression[i]
    const offset = getOffsetForBar(i, bpm)

    output[0].set(chord[0], offset)
    output[1].set(chord[1], offset)

    const offset2 = getOffsetForBar(i + 16, bpm)

    output[0].set(chord[0], offset2)
    output[1].set(chord[1], offset2)
  }

  return createAudioBuffer(output)
}

async function createMelodyTrack () {
  const main = createTempBuffer(16 * 4, bpm)

  // First the common part...
  addNotes([
    [16, 5],
    [17, 12],
    [18, 8],
    [19, 3],

    [20, 5],
    [22, 0],
    [23, 3],

    [24, 5],
    [25, 12],
    [26, 8],
    [27, 15],

    [28, 7],
  ], main, createPluckSound, bpm, true)

  // Then copy it over...
  const offset = getOffsetForBar(8, bpm)
  main.set(main.slice(0, offset), offset)

  await waitForNextFrame()

  // Then add the notes that are different
  addNotes([
    // part 1
    [0, 5],
    [1, 12],
    [2, 8],
    [3, 3],

    [4, 5],

    [8, 5],
    [9, 12],
    [10, 8],
    [11, 15],

    [12, 5],

    // part 2
    [32, 5],
    [33, 12],
    [34, 10],
    [35, 9],

    [36, 8],
    [38, 5],
    [39, 3],

    [40, 5],
    [41, 12],
    [42, 9],
    [43, 15],

    [44, 5],
  ], main, createPluckSound, bpm, true)

  await waitForNextFrame()

  const output = createTempBuffer(trackBeatCount, bpm)
  output.set(main, getOffsetForBar(16, bpm))

  return createAudioBuffer(output)
}

export default async function createSong () {
  const bufferBass = await createBassTrack()
  const bufferPads = await createPadsTrack()
  const bufferMelody = await createMelodyTrack()

  return new Song(
    [
      { buffer: bufferBass, volume: 0.2 },
      { buffer: bufferPads, volume: 0.32, sendToReverb: 2 },
      { buffer: bufferMelody, volume: 0.2, sendToReverb: 2 }
    ],
    true
  )
}
