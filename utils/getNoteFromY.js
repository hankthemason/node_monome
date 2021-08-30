const getNoteFromY = (currentTrack, x, y) => {
  const root = currentTrack.rootNote
  const octave = currentTrack.sequence[x].octave
  const scale = currentTrack.scale
  const note = root + (octave * 12) + scale[15 - y]
  return note
}

module.exports = getNoteFromY