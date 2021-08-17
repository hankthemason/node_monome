//in this model of getting random notes, 
//the degree of randomness will correspond to two things:
//1. scalar distance from original note
//2. octave distance from original note

const CH_SCALE_LENGTH = 12
const MAX_PROB = 8

const getRandomNote = (track) => {
  const step = track.step
  const seq = track.sequence
  const prob = seq[step].pitchProb
  const scale = track.scale
  const root = track.rootNote
  let finalNote
  //mono track
  if (!track.poly) {
    let possiblePitches = []
    let lowestRootNote = root
    while (lowestRootNote > track.instrumentConfig.minNote) {
      lowestRootNote -= CH_SCALE_LENGTH
    }
    let max = lowestRootNote
    let i = 0
    let octave = 0
    while (max < track.instrumentConfig.maxNote) {
      let note = lowestRootNote + scale[i] + (octave * 12)
      max = note
      possiblePitches.push(note)
      i++
      if (i > scale.length - 1) {
        i = 0
        octave++
      }
    }

    const idx = possiblePitches.indexOf(seq[step].pitch)
    const notesBeforeRatio = idx / (possiblePitches.length - 1)
    const comparator = Math.random()
    const subtract = comparator < notesBeforeRatio


    let degreesOfDistance
    if (subtract) {
      const notesBefore = idx
      const lowerLimit = (notesBefore / MAX_PROB) * prob
      degreesOfDistance = Math.ceil(Math.random() * lowerLimit)
      finalNote = possiblePitches[idx - degreesOfDistance]
    } else {
      const notesAfter = possiblePitches.length - idx
      const upperLimit = (notesAfter / MAX_PROB) * prob
      const degreesOfDistance = Math.ceil(Math.random() * upperLimit)
      finalNote = possiblePitches[idx + degreesOfDistance]
    }
  }
  return finalNote
}

module.exports = getRandomNote