const maxApi = require('max-api')
const monomeGrid = require('monome-grid')
const create2DArray = require('./utils/create2DArray')
const insertCol = require('./utils/insertCol')
const calculateLimits = require('./utils/calculateLimits')
const { buildRow, 
        buildAllRows, 
        buildViewRows, 
        buildLengthSelectorRow,
        refreshRows } = require('./utils/buildRow')
const { buildColumn, refreshColumnArea } = require('./utils/buildColumn')
const { er1, sh101, prophet12 } = require('./configurations/instrumentConfigs')
const noteValues = require('./configurations/noteValues')
const scales = require('./configurations/scales')
const { MonoTrack, MappedTrack } = require('./models/track')
const MasterConfig = require('./models/masterConfig')
const Led = require('./models/led')
const { currentTrackHandler,
        ledHandler,
        syncOnHandler,
        syncOffHandler} = require('./inputHandlers')

const tracks = [
  new MappedTrack(0, 4, er1),
  new MonoTrack(1, 4, sh101)
]

const main = async() => {
  let grid = await monomeGrid(); // optionally pass in grid identifier
  let l = new Led
  
  let led = [];
  let syncing = false
  let syncTrack
  let masterHz = 0.5

  let masterConfig = new MasterConfig(tracks, masterHz, syncing, syncTrack, noteValues, tracks[0])
  let currentTrack = masterConfig.currentTrack

  l.buildGrid(currentTrack)

  const initialize = async() => {
    led = create2DArray(16, 16)
    tracks[0].isMaster = true

    led = buildAllRows(led, currentTrack)
    grid.refresh(led)

    //right now, we will set root notes to default middle C
    //later, make this configurable
    for (let i = 0; i < tracks.length; i++) {
      //only for non-mapping tracks
      if (!tracks[i].mapping) {
        tracks[i].rootNote = 60
      }
    }

    //right now, set scale to minor
    //later, make this configurable
    for (let i = 0; i < tracks.length; i++) {
      //only for non-mapping tracks
      if (!tracks[i].mapping) {
        tracks[i].scale = scales[1].scale
      }
    }
  }
  
  async function run() {
    grid.key((x, y, s) => {
      const step = x + (currentTrack.page * 16)
      if (s === 1) {
        //change current track
        if (y === 0 && x < 6 && x !== currentTrack.track) {
          masterConfig.updateCurrentTrack(tracks[x])
          currentTrack = masterConfig.currentTrack
          l.buildGrid(currentTrack)
          grid.refresh(l.grid)
          maxApi.outlet('changeTrack', x)
        } 
        //sync to masterTrack
        else if (y === 1 && x === 7 && !currentTrack.isMaster) {
          masterConfig = syncOnHandler(masterConfig, currentTrack)
          flicker(led, grid, masterConfig)
        } 
        //this part of the grid is page-agnostic and can use x values
        else if (y < 6) {
          currentTrack = currentTrackHandler(x, y, currentTrack)
          l.buildGrid(currentTrack)
          led = l.grid
          grid.refresh(led)
        } else if (y >= 6) {
          currentTrack = currentTrackHandler(step, y, currentTrack)
          l.buildGrid(currentTrack)
          led = l.grid
          grid.refresh(led)
        }
        //here we start to use step value because these rows can point to 
        //steps in the sequence that are greater than 16
        //slide on/off
        // else if (y === 6 && step < currentTrack.upperLimit) {
        //   currentTrack = currentTrackHandler(step, y, currentTrack) 
        //   led = ledHandler(x, y, led, currentTrack)
        //   grid.refresh(led)
        // } 
        // //note on/off
        // else if (y === 7 && step < currentTrack.upperLimit) {
        //   currentTrack = currentTrackHandler(step, y, currentTrack)
        //   led = ledHandler(step, y, led, currentTrack)
        //   grid.refresh(led)
        // } 
        // //view input (pitch, vel, prob, pitchProb, or unknown)
        // else if (y > 7 && step < currentTrack.upperLimit) {
        //   currentTrack = currentTrackHandler(step, y, currentTrack)
        //   led = ledHandler(step, y, led, currentTrack)
        //   grid.refresh(led)
        // }
        // l.buildGrid(currentTrack)
        // maxApi.post(l.grid)
      }
    });
  }

  maxApi.addHandler('tick', (track) => {
    let t = tracks[track]
    let step = t.step

    //connect the sync function to incoming ticks
    if (masterConfig.syncing === true && t.isMaster && step === 0) {
      currentTrack.step = 0
      masterConfig.syncing = false
      masterConfig.syncTrack = null
      led[1][7] = 0
    }

    const [notes, msPerNote] = t.getNotes(step)
    if (notes && notes.length > 1) {
      for (const note of notes) {
        maxApi.outlet('notes', track, note, msPerNote)
      } 
    } else if (notes) {
      maxApi.outlet('note', track, notes, msPerNote)
    }

    t.incrementStep()
  })

  maxApi.addHandler('playhead', (track) => {
    const t = currentTrack
    let topRow = buildRow(0, t)
    let step = t.step//((t.step - 1) + t.upperLimit) % t.upperLimit
    //followMode off
    if (!t.followMode) {
      const [pageStart, pageEnd] = calculateLimits(t)
      
      for (let x = pageStart; x < pageEnd; x++) {
        if (step === x) { 
          for (let y = 8; y < 16; y++) {
            led[y][x % 16] = 1
          }
        } else {
          const col = buildColumn(x, currentTrack)
          led = insertCol(led, col, x % 16)
        }
      }
    }

    led[0] = topRow
    grid.refresh(led)
  })

  maxApi.addHandler('masterHertz', (hz) => {
    masterConfig.masterHz = hz
    for (const track of tracks) {
      track.updateMsPerNote(masterConfig)
    }
  })

  maxApi.addHandler('stop', () => {
    for (var y = 8; y < 16; y++) {
      led[y][currentTrack.step - 1] = 0
    }

    led = buildAllRows(led, currentTrack)

    grid.refresh(led)

    //default is to return tracks to 0
    //implement a mode to make this optional
    for (let i = 0; i < tracks.length; i++) {
      tracks[i].step = 0;
    }
  })

  const flicker = (led, grid, masterConfig) => {
    let flicker = 0
    const timer = setInterval(() => {
      if (masterConfig.syncing) {
        led[1][7] = flicker ? 0 : 1
        flicker = !flicker
        grid.refresh(led)
      } else {
        clearInterval(timer)
      }
    }, 1000 / 10)
  }

  initialize()
  run()

}

main()