const calculateLimits = require('../utils/calculateLimits')

class Led {
  constructor() {
    let rows = new Array(16)
    for (let y = 0; y < 16; y++) {
      let row = new Array(16)
      for (let x = 0; x < 16; x++) {
        row[x] = 0
      }
      rows[y] = row
    }
    this.grid = rows
  }
  
  //current track / note value / page
  buildRow0 = currentTrack => {
    const rowIdx = 0
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
    this.grid[rowIdx] = row
  }

  //views / numPages
  buildRow1 = currentTrack => {
    const rowIdx = 1
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
    this.grid[rowIdx] = row
  }

  buildLengthSelectorRow = currentTrack => {
    const rowIdx = 2
    let row = []
    const [pageStart, pageEnd] = calculateLimits(currentTrack)
    for (let x = pageStart; x < pageStart + 16; x++) {
      row[x % 16] = x < pageEnd ? 1 : 0
    }
    this.grid[rowIdx] = row
  }

  buildSlideRow = currentTrack => {
    const rowIdx = 6
    let row = []
    const [pageStart, pageEnd] = calculateLimits(currentTrack)
  
    const seq = currentTrack.sequence
    for (let x = pageStart; x < pageStart + 16; x++) {
      row[x % 16] = x < pageEnd && seq[x].on && seq[x].slide ? 1 : 0 
    }
    this.grid[rowIdx] = row
  }

  buildNoteOnRow = currentTrack => {
    const rowIdx = 7
    let row = []
    const [pageStart, pageEnd] = calculateLimits(currentTrack)
  
    const seq = currentTrack.sequence
    for (let x = pageStart; x < pageStart + 16; x++) {
      row[x % 16] = x < pageEnd && seq[x].on ? 1 : 0
    }
    this.grid[rowIdx] = row
  }

  buildViewRows = currentTrack => {
    let viewRows
    //if view is 'pitch'
    if (currentTrack.view === 0) {
      viewRows = this.buildPitchRows(currentTrack)
    } 
    //if view is 'octave'
    else if (currentTrack.view === 1) {
      viewRows = this.buildOctaveRows(currentTrack)
    }

    this.grid.splice(8, 8, ...viewRows)
  }

  buildPitchRows = currentTrack => {
    let rows = new Array(8)
    
    const [pageStart, pageEnd] = calculateLimits(currentTrack)
    const seq = currentTrack.sequence
    
    //mapped instrument
    if (currentTrack.instrumentConfig.mapping) {
      for (let y = 0; y < 8; y++) {
        let row = []
        for (let x = pageStart; x < pageStart + 16; x++) {
          let yOffset = currentTrack.sequence[x].octave * 8
          if (x < pageEnd && seq[x].on && currentTrack.instrumentConfig.mapping[y + yOffset] && seq[x].pitches[y + yOffset] === currentTrack.instrumentConfig.mapping[y + yOffset]) {
            row.push(1)
          } else {
            row.push(0)
          }
        }
        rows[rows.length - (y + 1)] = row
      }
    } 
    //mono instrument
    else if (!currentTrack.poly) {
      //build rows from bottom up
      for (let y = 0; y < 8; y++) {
        let row = []
        for (let x = pageStart; x < pageStart + 16; x++) {
          let noteTranslated
          if (x < pageEnd && seq[x].on && seq[x].pitch) {
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

  buildOctaveRows = currentTrack => {
    let rows = new Array(8)
  
    const [pageStart, pageEnd] = calculateLimits(currentTrack)
    const seq = currentTrack.sequence
  
    //octave view for MappedTrack / MonoTrack
    if (currentTrack.instrumentConfig.mapping || !currentTrack.poly) {
      for (let y = 0; y < rows.length; y++) {
        let row = []
        for (let x = pageStart; x < pageStart + 16; x++) {
          if (x < pageEnd && seq[x].on && y <= seq[x].octave) {
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

  buildGrid = currentTrack => {
    this.buildRow0(currentTrack)
    this.buildRow1(currentTrack)
    this.buildLengthSelectorRow(currentTrack)
    this.buildSlideRow(currentTrack)
    this.buildNoteOnRow(currentTrack)
    this.buildViewRows(currentTrack)
  }
}

module.exports = Led