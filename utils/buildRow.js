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

const buildPitchRows = (currentTrack) => {
  let rows = new Array(8)
  if (currentTrack.mapping) {
    for (let y = 0; y < 8; y++) {
      let row = []
      for (let x = 0; x < currentTrack.sequence.length; x++) {
        if (currentTrack.sequence[x].pitches[y] === currentTrack.mapping[y]) {
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

const buildRow = (rowIdx, currentTrack) => {
  if (rowIdx === 0) {
    return buildTopRow(currentTrack)
  } else if (rowIdx === 7) {
    return build7thRow(currentTrack)
  } 
}

module.exports = { 
  buildRow,
  buildPitchRows
}