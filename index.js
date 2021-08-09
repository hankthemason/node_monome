const maxApi = require('max-api')
const monomeGrid = require('monome-grid')
const noteValues = require('./configurations/noteValues')
const views = require('./configurations/views')
const create2DArray = require('./utils/create2DArray')
const insertCol = require('./utils/insertCol')
const { MonoTrack, MappedTrack } = require('./models/track')
const { buildRow, buildViewRows } = require('./utils/buildRow')
const buildColumn = require('./utils/buildColumn')
const { er1, sh101, prophet12 } = require('./configurations/instrumentConfigs')

const tracks = [
  new MappedTrack(0, 4, er1 ),
  new MonoTrack(1, 4)
]

const main = async() => {
  let grid = await monomeGrid(); // optionally pass in grid identifier
  
  let led = [];
  let masterTrack
  let syncing = false
  let syncTrack
  let currentTrack

  const initialize = async() => {
    led = create2DArray(16, 16)
    masterTrack = tracks[0]
    masterTrack.isMaster = 1
    currentTrack = tracks[0]

    led[0] = buildRow(0, currentTrack)
    led[1] = buildRow(1, currentTrack)
    grid.refresh(led)
  }
  
  async function run() {
    grid.key((x, y, s) => {
      if (s === 1) {
        if (y === 0) {
          //switch track
          if (x < 6 && x !== currentTrack.track) {
            currentTrack = tracks[x]
            led[y] = buildRow(y, currentTrack)
            led[1] = buildRow(1, currentTrack)
            const viewRows = buildViewRows(currentTrack)
            led.splice(8, 8, ...viewRows)
            grid.refresh(led)
            maxApi.outlet('changeTrack', x)
          } 
          //switch note value
          else if (x > 5 && x < 12) {
            currentTrack.noteValue = x - 5
            led[y] = buildRow(y, currentTrack)
            grid.refresh(led)
            maxApi.outlet('changeNoteValue', noteValues[currentTrack.noteValue].coeff, currentTrack.track)
          }
        } else if (y === 1) {
          //view selector
          if (x < 5) {
            currentTrack.view = x
            led[y] = buildRow(y, currentTrack)
            const viewRows = buildViewRows(currentTrack)
            led.splice(8, 8, ...viewRows)
            grid.refresh(led)   
          } else if (x === 7 && currentTrack.isMaster !== 1) {
            syncing = true
            syncTrack = currentTrack
            let flicker = 0
            const timer = setInterval(() => {
              if (syncing) {
                led[1][7] = flicker ? 0 : 1
                flicker = !flicker
                grid.refresh(led)
              } else {
                clearInterval(timer)
              }
            }, 1000 / 10)
          }
        } else if (y === 7) {
          currentTrack.sequence[x].on = !currentTrack.sequence[x].on
          led[y] = buildRow(y, currentTrack)
          grid.refresh(led)
        } 
        //view input (pitch, vel, prob, pitchProb, or unknown)
        else if (y > 7) {
          //pitch input
          if (currentTrack.view === 0) {
            if (!currentTrack.sequence[x].pitch || !currentTrack.sequence[x].pitches) {
              currentTrack.sequence[x].on = true
              led[7] = buildRow(7, currentTrack)
            }
            if (currentTrack.poly === true) {
              if (currentTrack.instrumentConfig.mapping) {
                const noteIdx = (15 - y) + (currentTrack.sequence[x].octave * 8)
                maxApi.post(noteIdx)
                //turn note off if it's already selected
                if (currentTrack.sequence[x].pitches.includes(currentTrack.instrumentConfig.mapping[noteIdx])) {
                  currentTrack.sequence[x].pitches[15 - y] = null
                  const col = buildColumn(x, currentTrack)
                  led = insertCol(led, col, x)
                } 
                //turn note on
                else {
                  currentTrack.sequence[x].pitches[noteIdx] = currentTrack.instrumentConfig.mapping[noteIdx]
                  const col = buildColumn(x, currentTrack)
                  led = insertCol(led, col, x)
                }
              }
            }
            grid.refresh(led)
          }
          //octave input
          else if (currentTrack.view === 1) {
            //check if selection is within instrument's octaveSpan
            if ((15 - y) < currentTrack.instrumentConfig.octaveSpan) {
              currentTrack.sequence[x].octave = 15 - y
              const col = buildColumn(x, currentTrack)
              led = insertCol(led, col, x)
            }

            grid.refresh(led)
          }
        }
      }
    });
  }

  maxApi.addHandler('tick', (track) => {
    let t = tracks[track]
    let step = t.step
    //connect the sync function to incoming ticks
    if (syncing === true && t.isMaster === 1 && step === 0) {
      syncTrack.step = 0
      syncing = false
      syncTrack = null
      led[1][7] = 0
    }
    if (t.sequence[step].on) {
      //poly track
      if (t.poly) {
        const pitches = t.sequence[step].pitches
        let notes = [] 
        for (let i = 0; i < pitches.length; i++) {
          if (pitches[i]) {
            notes.push(pitches[i])
          }
        }
        maxApi.outlet('notes', track, notes)
      } 
      //mono track
      else {
        maxApi.outlet('note', track, t.sequence[step].pitch)
      }
    }
    t.incrementStep()
  })

  maxApi.addHandler('playhead', (track) => {
    let step = currentTrack.step
    let topRow = buildRow(0, currentTrack)
    
    for (let x = 0; x < 16; x++) {
      if (step === x) {
        for (let y = 8; y < 16; y++) {
          led[y][x] = 1
        }
      } else {
        const col = buildColumn(x, currentTrack)
        led = insertCol(led, col, x)
      }
    }

    led[0] = topRow
    grid.refresh(led)
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