const calculateLimits = require('./calculateLimits')
const insertCol = require('./insertCol')

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

  if (currentTrack.sequence[x].on && x < currentTrack.upperLimit) {
    //mappedTrack
    if (currentTrack.instrumentConfig.mapping) {
      for (let y = start; y < start + 8; y++) {
        if (currentTrack.sequence[x].pitches[y]) {
          column[column.length - ((y % 8) + 1)] = 1
        }
      }
    } 
    //monoTrack
    else if (!currentTrack.poly) {
      let noteTranslated 
      if (currentTrack.sequence[x].pitch) {
        //if the selected note is the highest pitch, e.g. the octave
        //this note's logic is an exception to the logic of all other notes because it exists 'outside' of the scale
        //(i.e. it is the '8th note' of a seven note scale)
        const octaveNote = currentTrack.sequence[x].pitch === (((currentTrack.sequence[x].octave + 1) * 12) + currentTrack.rootNote)
        
        noteTranslated = octaveNote ? 7 : currentTrack.scale.indexOf((currentTrack.sequence[x].pitch - currentTrack.rootNote) % 12)  
        
        for (let y = 0; y <= noteTranslated; y++) {
          column[column.length - (y + 1)] = 1
        }
      }
    }
  }
  return column
}

const buildOctaveColumn = (x, currentTrack) => {
  let column = new Array(8).fill(0)

  if (currentTrack.sequence[x].on && x < currentTrack.upperLimit) {
    for (let y = 0; y <= currentTrack.sequence[x].octave; y++) {
      column[column.length - (y + 1)] = 1
    }
  }
  
  return column
}

const refreshColumnArea = (led, xStart, currentTrack) => {
  
  const [pageStart, pageEnd] = calculateLimits(currentTrack)
  
  for (let x = xStart; x < (currentTrack.page + 1) * 16; x++) {
    let col = buildColumn(x, currentTrack)
    led = insertCol(led, col, x % 16)
  }

  return led
}

module.exports = {
  buildColumn,
  refreshColumnArea
}