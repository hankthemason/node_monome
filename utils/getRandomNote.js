//in this model of getting random notes, 
//the degree of randomness will correspond to two things:
//1. scalar distance from original note
//2. octave distance from original note

const CH_SCALE_LENGTH = 12
const MAX_PROB = 8

const getRandomNote = track => {
  const step = track.step
  const seq = track.sequence
  const prob = seq[step].pitchProb
  const scale = track.scale
  const root = track.rootNote
  let finalNote

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
  return finalNote
}

const getRandomNotes = track => {
  const step = track.step
  const prob = track.sequence[step].pitchProb
  let pitches = track.sequence[step].pitches.slice()
  const probPercentage = prob / MAX_PROB

  //1. determine how many notes will change
  const numNotes = track.sequence[step].pitches.length
  const numRandomNotes = Math.floor(probPercentage * numNotes)

  //2. get random indexes for which notes will change
  //   this will be an array of index numbers
  let randomIndexes = []
  while (randomIndexes.length < numRandomNotes) {
    let idx = Math.floor(Math.random() * numNotes)
    if (randomIndexes.indexOf(idx) === -1) {
      randomIndexes.push(idx)
    }
  }

  for (let i = 0; i < randomIndexes.length; i++) {
    let randomNote = getRandomNote(track)
    pitches.splice(randomIndexes[i], 1, randomNote)
  }
  return pitches
}



module.exports = { getRandomNote, getRandomNotes }