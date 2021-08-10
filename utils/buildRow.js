//selected track, noteValue, currentPage
const buildTopRow = currentTrack => {
  let row = []
  for (let x = 0; x < 16; x++) {
    if (x === currentTrack.track) {
      row[x] = 1
    } else if (x === currentTrack.noteValue + 6) {
      row[x] = 1
    } else if (x === currentTrack.page + 12) {
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
  return row
}

const buildSlideRow = (currentTrack) => {
  let row = []
  const seq = currentTrack.sequence
  for (let x = 0; x < seq.length; x++) {
    row[x] = seq[x].slide ? 1 : 0
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

const buildRow = (rowIdx, currentTrack) => {
  if (rowIdx === 0) {
    return buildTopRow(currentTrack)
  } else if (rowIdx === 1) {
    return buildSecondRow(currentTrack)
  } else if (rowIdx === 6) {
    return buildSlideRow(currentTrack)
  } else if (rowIdx === 7) {
    return build7thRow(currentTrack)
  } 
}


const buildAllRows = (led, currentTrack) => {
  let topRow = buildTopRow(currentTrack)
  let secondRow = buildSecondRow(currentTrack)
  let slideRow = buildSlideRow(currentTrack)
  let seventhRow = build7thRow(currentTrack)
  let viewRows = buildViewRows(currentTrack)

  led[0] = topRow
  led[1] = secondRow
  led[6] = slideRow
  led[7] = seventhRow
  led.splice(8, 8, ...viewRows)
  return led
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
        let yOffset = currentTrack.sequence[x].octave * 8
        console.log(yOffset)
        if (currentTrack.instrumentConfig.mapping[y + yOffset] && currentTrack.sequence[x].pitches[y + yOffset] === currentTrack.instrumentConfig.mapping[y + yOffset]) {
          row[x] = 1
        } else {
          row[x] = 0
        }
      }
      rows[rows.length - (y + 1)] = row
    }
  } else if (!currentTrack.poly) {
    //build rows from bottom up
    for (let y = 0; y < 8; y++) {
      let row = []
      for (let x = 0; x < currentTrack.sequence.length; x++) {
        let noteTranslated
        
        if (currentTrack.sequence[x].pitch) {
          //if the selected note is the highest pitch, e.g. the octave
          const octaveNote = currentTrack.sequence[x].pitch === (((currentTrack.sequence[x].octave + 1) * 12) + currentTrack.rootNote)
          
          noteTranslated = octaveNote ? 7 : currentTrack.scale.indexOf((currentTrack.sequence[x].pitch - currentTrack.rootNote) % 12) 
        }

        if (noteTranslated && y <= noteTranslated) {
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

const buildOctaveRows = currentTrack => {
  let rows = new Array(8)
  //octave view for MappedTrack
  if (currentTrack.instrumentConfig.mapping || !currentTrack.poly) {
    for (let y = 0; y < rows.length; y++) {
      let row = []
      for (let x = 0; x < 16; x++) {
        if (currentTrack.sequence[x].on && y <= currentTrack.sequence[x].octave) {
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
  buildViewRows, 
  buildAllRows
}