const buildColumn = (x, currentTrack) => {
  //view is pitch
  if (currentTrack.view === 0) {
    return buildPitchColumn(x, currentTrack)
  } 
  //view is octave
  else if (currentTrack.view === 1) {
    return buildOctaveColumn(x, currentTrack)
  } 
}

const buildPitchColumn = (x, currentTrack) => {
  let column = new Array(8).fill(0)

  const start = currentTrack.sequence[x].octave * 8
  console.log(start)
  if (currentTrack.instrumentConfig.mapping) {
    for (let y = start; y < start + 8; y++) {
      if (currentTrack.sequence[x].pitches[y]) {
        column[column.length - ((y % 8) + 1)] = 1
      }
    }
  }
  return column
}

const buildOctaveColumn = (x, currentTrack) => {
  let column = new Array(8).fill(0)
  for (let y = 0; y <= currentTrack.sequence[x].octave; y++) {
    column[column.length - (y + 1)] = 1
  }
  return column
}

module.exports = buildColumn