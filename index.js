const maxApi = require('max-api')
const monomeGrid = require('monome-grid')
const noteValues = require('./configurations/noteValues')
const create2DArray = require('./utils/create2DArray')
//const handleInput = require('./utils/handleInput')
const Track = require('./models/track')

const tracks = [
  new Track(0, 3),
  new Track(1, 5)
]

tracks[0].sequence = [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0]
tracks[1].sequence = [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0]

let currentTrack = tracks[0]

const buildRow = (rowIdx, currentTrack) => {
  if (rowIdx === 0) {
    return buildTopRow(currentTrack)
  }
}

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

const main = async() => {
  let grid = await monomeGrid(); // optionally pass in grid identifier
  
  let led = [];

  const initialize = async() => {
    led = []// initialize 2-dimensional led array
    for (let y=0;y<16;y++) {
      led[y] = [];
      for (let x=0;x<16;x++)
        led[y][x] = 0;
    };

    // update grid
    grid.refresh(led);
  }
  
  async function run() {
    // initialize 2-dimensional led array
    for (let y=0;y<16;y++) {
      led[y] = [];
      for (let x=0;x<16;x++)
        led[y][x] = 0;
    }

    // refresh leds with a pattern
    // let refresh = function() {
    //   led[0][0] = 15;
    //   led[2][0] = 5;
    //   led[0][2] = 5;
    //   grid.refresh(led);
    // }

    // call refresh() function 60 times per second
    //setInterval(refresh, 1000 / 60);

    // set up key handler
    grid.key((x, y, s) => console.log(`key received: ${x}, ${y}, ${s}`));
    grid.key((x, y, s) => {
      if (s === 1) {
        if (y === 0) {
          if (x < 6 && x !== currentTrack.track) {
            currentTrack = tracks[x]
            topRow = buildRow(0, currentTrack)
            led[0] = topRow
            grid.refresh(led)
            maxApi.outlet('changeTrack', x)
          } else if (x > 5 && x < 12) {
            currentTrack.noteValue = x - 5
            topRow = buildRow(0, currentTrack)
            led[0] = topRow
            grid.refresh(led)
            maxApi.post(noteValues[currentTrack.noteValue])
            maxApi.outlet('changeNoteValue', noteValues[currentTrack.noteValue].coeff, currentTrack.track)
          }
        }
      }
    });
  }

  maxApi.addHandler('tick', (track) => {
    let t = tracks[track]
    let step = t.step
    if (t.sequence[step] === 1) {
      maxApi.outlet('note', track)
    }
    t.incrementStep()
  })

  maxApi.addHandler('playhead', (track) => {
    let step = currentTrack.step
    let topRow = buildRow(0, currentTrack)
    for (let x = 0; x < 16; x++) {
      if (x === step) {
        for (let y = 8; y < 16; y++) {
          led[y][x] = 1
        }
      } else {
        for (let y = 8; y < 16; y++) {
          led[y][x] = 0
        } 
      }
    }
    led[0] = topRow
    grid.refresh(led)

    maxApi.outlet(step)
  })

  maxApi.addHandler('changeTrack', (track) => {
    currentTrack = tracks[track]
    topRow = buildRow(0, currentTrack)
    led[0] = topRow
    grid.refresh(led)
  })

  maxApi.addHandler('stop', () => {
    for (var y = 8; y < 16; y++) {
      led[y][currentTrack.step - 1] = 0
    }

    grid.refresh(led)

    //default is to return tracks to 0
    //implement a mode to make this optional
    for (let i = 0; i < tracks.length; i++) {
      tracks[i].step = 0;
    }
  })

  initialize()
  run()

}

main()