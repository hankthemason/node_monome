const insertCol = (led, col, x) => {
  for (let y = 8; y < 16; y++) {
    led[y][x] = col[y - 8]
  }
  return led
}

module.exports = insertCol