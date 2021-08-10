const noteValues = require('../configurations/noteValues')

const getMsPerNote = (masterHertz, currentTrack) => {
  const hzToMs = (1 / masterHertz) * 1000
  const msPerNote = hzToMs / noteValues[currentTrack.noteValue].value
  return msPerNote
}

module.exports = getMsPerNote