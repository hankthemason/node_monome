const buildColumn = (x, currentTrack) => {
  let column = new Array(8).fill(0)
  if (currentTrack.mapping) {
    for (let y = 0; y < 8; y++) {
      if (currentTrack.sequence[x].pitches[y]) {
        column[column.length - (y + 1)] = 1
      }
    }
  }
  return column
}

module.exports = buildColumn