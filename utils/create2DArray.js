function create2DArray(sizeY, sizeX) {
  let arr = [];
  for (let y=0;y<sizeY;y++) {
    arr[y] = [];
    for (let x=0;x<sizeX;x++)
      arr[y][x] = 0;
  }
  return arr;
}

module.exports = create2DArray