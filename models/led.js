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
    let row = new Array(16).fill(0)
    row[currentTrack.view] = 1
    row[6] = currentTrack.followMode ? 1 : 0
    row[currentTrack.numPages + 11] = 1
    row[11] = currentTrack.syncedToUniversalNoteValue ? 1 : 0

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
    //if view is 'velocity'
    else if (currentTrack.view === 2) {
      viewRows = this.buildVelocityRows(currentTrack)
    }
    //if view is 'prob'
    else if (currentTrack.view === 3) {
      viewRows = this.buildProbRows(currentTrack)
    }
    //if view is 'pitchProb'
    else if (currentTrack.view === 4) {
      viewRows = this.buildPitchProbRows(currentTrack)
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

  //this and prob could be consolidated
  buildVelocityRows = currentTrack => {
    let rows = new Array(8)
    const [pageStart, pageEnd] = calculateLimits(currentTrack)
    const seq = currentTrack.sequence

    for (let y = 0; y < rows.length; y++) {
      let row = []
      for (let x = pageStart; x < pageStart + 16; x++) {
        if (x < pageEnd && seq[x].on && y < seq[x].velocity) {
          row.push(1)
        }
        else {
          row.push(0)
        }
      }
      rows[rows.length - (y + 1)] = row
    }
    return rows
  }

  buildProbRows = currentTrack => {
    let rows = new Array(8)
    const [pageStart, pageEnd] = calculateLimits(currentTrack)
    const seq = currentTrack.sequence

    for (let y = 0; y < rows.length; y++) {
      let row = []
      for (let x = pageStart; x < pageStart + 16; x++) {
        if (x < pageEnd && seq[x].on && y < seq[x].prob) {
          row.push(1)
        }
        else {
          row.push(0)
        }
      }
      rows[rows.length - (y + 1)] = row
    }
    return rows
  }

  buildPitchProbRows = currentTrack => {
    let rows = new Array(8)
    const [pageStart, pageEnd] = calculateLimits(currentTrack)
    const seq = currentTrack.sequence

    for (let y = 0; y < rows.length; y++) {
      let row = []
      for (let x = pageStart; x < pageStart + 16; x++) {
        if (x < pageEnd && seq[x].on && y < seq[x].pitchProb) {
          row.push(1)
        }
        else {
          row.push(0)
        }
      }
      rows[rows.length - (y + 1)] = row
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

  buildColumn = (x, currentTrack) => {
    //view is pitch
    if (currentTrack.view === 0) {
      this.buildPitchColumn(x, currentTrack)
    }
    //view is octave
    else if (currentTrack.view === 1) {
      this.buildOctaveColumn(x, currentTrack)
    }
    //view is velocity
    else if (currentTrack.view === 2) {
      this.buildVelocityColumn(x, currentTrack)
    }
    //view is prob
    else if (currentTrack.view === 3) {
      this.buildProbColumn(x, currentTrack)
    }
    //view is pitchProb
    else if (currentTrack.view === 4) {
      this.buildPitchProbColumn(x, currentTrack)
    }
  }

  buildPitchColumn = (x, currentTrack) => {
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

    this.insertColumn(column, x % 16)
  }

  buildOctaveColumn = (x, currentTrack) => {
    let column = new Array(8).fill(0)

    if (currentTrack.sequence[x].on && x < currentTrack.upperLimit) {
      for (let y = 0; y <= currentTrack.sequence[x].octave; y++) {
        column[column.length - (y + 1)] = 1
      }
    }

    this.insertColumn(column, x % 16)
  }

  buildVelocityColumn = (x, currentTrack) => {
    let column = new Array(8).fill(0)
    const seq = currentTrack.sequence

    if (seq[x].on && x < currentTrack.upperLimit && seq[x].velocity > 0) {
      for (let y = 0; y < seq[x].velocity; y++) {
        column[column.length - (y + 1)] = 1
      }
    }

    this.insertColumn(column, x % 16)
  }

  buildProbColumn = (x, currentTrack) => {
    let column = new Array(8).fill(0)
    const seq = currentTrack.sequence

    if (seq[x].on && x < currentTrack.upperLimit && seq[x].prob > 0) {
      for (let y = 0; y < seq[x].prob; y++) {
        column[column.length - (y + 1)] = 1
      }
    }
    this.insertColumn(column, x % 16)
  }

  buildPitchProbColumn = (x, currentTrack) => {
    let column = new Array(8).fill(0)
    const seq = currentTrack.sequence

    if (seq[x].on && x < currentTrack.upperLimit && seq[x].pitchProb > 0) {
      for (let y = 0; y < seq[x].pitchProb; y++) {
        column[column.length - (y + 1)] = 1
      }
    }
    this.insertColumn(column, x % 16)
  }

  insertColumn = (col, x) => {
    for (let y = 8; y < 16; y++) {
      this.grid[y][x] = col[y - 8]
    }
  }
}

module.exports = Led