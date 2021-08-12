const calculateLimits = require('./calculateLimits')

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

const buildLengthSelectorRow = (currentTrack) => {
  row = []
  const [pageStart, pageEnd] = calculateLimits(currentTrack)
  for (let x = pageStart; x < pageEnd; x++) {
    row.push(1)
  }
  return row
}

const buildSlideRow = (currentTrack) => {
  let row = []
  const [pageStart, pageEnd] = calculateLimits(currentTrack)

  const seq = currentTrack.sequence
  for (let x = pageStart; x < pageEnd; x++) {
    seq[x].slide ? row.push(1) : row.push(0)
  }
  return row
}

const buildNoteOnRow = (currentTrack) => {
  let row = []
  const [pageStart, pageEnd] = calculateLimits(currentTrack)

  for (let x = pageStart; x < pageEnd; x++) {
    if (currentTrack.sequence[x].on === true) {
      row.push(1)
    } else {
      row.push(0)
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
    return buildNoteOnRow(currentTrack)
  } 
}


const buildAllRows = (led, currentTrack) => {
  let topRow = buildTopRow(currentTrack)
  let secondRow = buildSecondRow(currentTrack)
  let lengthSelectorRow = buildLengthSelectorRow(currentTrack)
  let slideRow = buildSlideRow(currentTrack)
  let noteOnRow = buildNoteOnRow(currentTrack)
  let viewRows = buildViewRows(currentTrack)

  led[0] = topRow
  led[1] = secondRow
  led[2] = lengthSelectorRow
  led[6] = slideRow
  led[7] = noteOnRow
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
  //mapping
  const [pageStart, pageEnd] = calculateLimits(currentTrack)

  if (currentTrack.instrumentConfig.mapping) {
    for (let y = 0; y < 8; y++) {
      let row = []
      for (let x = pageStart; x < pageEnd; x++) {
        let yOffset = currentTrack.sequence[x].octave * 8
        if (currentTrack.instrumentConfig.mapping[y + yOffset] && currentTrack.sequence[x].pitches[y + yOffset] === currentTrack.instrumentConfig.mapping[y + yOffset]) {
          row.push(1)
        } else {
          row.push(0)
        }
      }
      rows[rows.length - (y + 1)] = row
    }
  } else if (!currentTrack.poly) {
    //build rows from bottom up
    for (let y = 0; y < 8; y++) {
      let row = []
      for (let x = pageStart; x < pageEnd; x++) {
        let noteTranslated
        
        if (currentTrack.sequence[x].pitch) {
          //if the selected note is the highest pitch, e.g. the octave
          const octaveNote = currentTrack.sequence[x].pitch === (((currentTrack.sequence[x].octave + 1) * 12) + currentTrack.rootNote)
          noteTranslated = octaveNote ? 7 : currentTrack.scale.indexOf((currentTrack.sequence[x].pitch - currentTrack.rootNote) % 12) 
        }

        if (noteTranslated >= 0 && y <= noteTranslated) {
          row.push(1)
        } else {
          row.push(0)
        }
      }
      rows[rows.length - (y + 1)] = row
    }
  }
  return rows
}

const buildOctaveRows = currentTrack => {
  let rows = new Array(8)

  const [pageStart, pageEnd] = calculateLimits(currentTrack)

  //octave view for MappedTrack
  if (currentTrack.instrumentConfig.mapping || !currentTrack.poly) {
    for (let y = 0; y < rows.length; y++) {
      let row = []
      for (let x = pageStart; x < pageEnd; x++) {
        if (currentTrack.sequence[x].on && y <= currentTrack.sequence[x].octave) {
          row.push(1)
        } else {
          row.push(0)
        }
      }
      rows[rows.length - (y + 1)] = row
    }
  }
  return rows
}

//refresh various rows in upper half when upperLimit changes
const refreshRows = (led, currentTrack) => {
  //build rows 3 - 5
  led[6] = buildSlideRow(currentTrack)
  led[7] = buildNoteOnRow(currentTrack)
  return led
}

module.exports = { 
  buildRow,
  buildViewRows, 
  buildAllRows,
  buildLengthSelectorRow,
  refreshRows
}