//selected track, noteValue, currentPage
const buildTopRow = currentTrack => {
  let row = []
  for (let x = 0; x < 16; x++) {
    if (x === currentTrack.track) {
      row[x] = 1
    } else if (x === currentTrack.noteValue + 5) {
      row[x] = 1
    } else if (x === currentTrack.page + 11) {
      row[x] = 1
    } else {
      row[x] = 0
    }
  }
  return row
}

//views, numPages
const buildSecondRow = currentTrack => {
  let row = []
  for (let x = 0; x < 16; x++) {
    if (currentTrack.view === x) {
      row[x] = 1
    } else if ((currentTrack.numPages + 11) === x) {
      row[x] = 1
    } else {
      row[x] = 0
    }
  }
  console.log(row)
  return row
}

const build7thRow = (currentTrack) => {
  let row = []
  for (let x = 0; x < currentTrack.sequence.length; x++) {
    if (currentTrack.sequence[x].on === true) {
      row[x] = 1
    } else {
      row[x] = 0
    }
  }
  return row
}

const buildRow = (rowIdx, currentTrack) => {
  if (rowIdx === 0) {
    return buildTopRow(currentTrack)
  } else if (rowIdx === 1) {
    return buildSecondRow(currentTrack)
  } else if (rowIdx === 7) {
    return build7thRow(currentTrack)
  } 
}

const buildViewRows = currentTrack => {
  //if view is 'pitch'
  if (currentTrack.view === 0) {
    return buildPitchRows(currentTrack)
  } 
  //if view is 'octave'
  else if (currentTrack.view === 1) {
    return buildOctaveRows(currentTrack)
  }
}

const buildPitchRows = (currentTrack) => {
  let rows = new Array(8)
  if (currentTrack.instrumentConfig.mapping) {
    for (let y = 0; y < 8; y++) {
      let row = []
      for (let x = 0; x < currentTrack.sequence.length; x++) {
        if (currentTrack.sequence[x].pitches[y] === currentTrack.instrumentConfig.mapping[y]) {
          row[x] = 1
        } else {
          row[x] = 0
        }
      }
      rows[rows.length - (y + 1)] = row
    }
  } else if (!currentTrack.poly) {
    for (let y = 0; y < 8; y++) {
      let row = []
      for (let x = 0; x < currentTrack.sequence.length; x++) {
        row[x] = 0
      }
      rows[y] = row
    }
  }
  return rows
}

const buildOctaveRows = currentTrack => {
  let rows = new Array(8)
  //octave view for MappedTrack
  if (currentTrack.instrumentConfig.mapping) {
    for (let y = 0; y < rows.length; y++) {
      let row = []
      for (let x = 0; x < 16; x++) {
        if (currentTrack.sequence[x].octave === y) {
          row[x] = 1
        } else {
          row[x] = 0
        }
      }
      rows[rows.length - (y + 1)] = row
    }
  }
  return rows
}

module.exports = { 
  buildRow,
  buildViewRows
}