const maxApi = require('max-api')
const monomeGrid = require('monome-grid')
const calculateLimits = require('./utils/calculateLimits')
const { er1, sh101, prophet12 } = require('./configurations/instrumentConfigs')
const noteValues = require('./configurations/noteValues')
const scales = require('./configurations/scales')
const { MonoTrack, MappedTrack, ScalarPolyTrack } = require('./models/track')
const MasterConfig = require('./models/masterConfig')
const Led = require('./models/led')
const { currentTrackHandler, syncOnHandler } = require('./inputHandlers')

const tracks = [
  new MappedTrack(0, 4, er1),
  new MonoTrack(1, 4, sh101),
  new ScalarPolyTrack(2, 4, prophet12)
]

const main = async () => {
  let grid = await monomeGrid(); // optionally pass in grid identifier
  let led = new Led()

  let syncing = false
  let syncTrack
  let masterHz = 0.5

  let copying = false

  let masterConfig = new MasterConfig(tracks, null, masterHz, syncing, syncTrack, noteValues, tracks[0], copying, false)
  let currentTrack = masterConfig.currentTrack

  led.buildGrid(currentTrack)

  const initialize = async () => {
    tracks[0].isMaster = true

    grid.refresh(led.grid)


    tracks.forEach(track => {
      //right now, we will set root notes to default middle C
      //later, make this configurable
      //only for non-mapping tracks
      if (!track.mapping) {
        track.rootNote = 60
      }
      //right now, set scale to minor
      //later, make this configurable
      //only for non-mapping tracks
      if (!track.mapping) {
        track.scale = scales[1].scale
      }
      //make sure that track ms values are intialized to masterHz
      track.updateMsPerNote(masterConfig)
    })

    masterConfig.masterTrack = 0
  }

  async function run() {
    grid.key((x, y, s) => {
      const step = x + (currentTrack.page * 16)
      if (s === 1) {
        //change current track
        if (y === 0 && x < 6 && x !== currentTrack.track) {
          masterConfig.updateCurrentTrack(tracks[x])
          currentTrack = masterConfig.currentTrack
          led.buildGrid(currentTrack)
          grid.refresh(led.grid)
          maxApi.outlet('changeTrack', x)
        }
        //change note value when universal sync is on 
        else if (y === 0 && x > 5 && x < 12) {
          if (masterConfig.universalNoteValueOn) {
            if (currentTrack.isMaster) {
              currentTrack = currentTrackHandler(x, y, currentTrack)
              currentTrack.updateMsPerNote(masterConfig)
              tracks.filter(t => !t.isMaster).forEach(t => {
                t.updateNoteValue(currentTrack.noteValue)
                t.updateMsPerNote(masterConfig)
              })
            }
          } else {
            currentTrack = currentTrackHandler(x, y, currentTrack)
            currentTrack.updateMsPerNote(masterConfig)
          }
          led.buildGrid(currentTrack)
          grid.refresh(led.grid)
        }
        //sync to masterTrack
        else if (y === 1 && x === 7 && !currentTrack.isMaster) {
          masterConfig = syncOnHandler(masterConfig, currentTrack)
          flicker(grid, masterConfig, x)
        }
        //copy/paste
        else if (y === 1 && (x > 7 && x < 10)) {
          currentTrack = currentTrackHandler(x, y, currentTrack)
          //copy
          if (x === 8) {
            masterConfig.copying = true
            flicker(grid, masterConfig, x)
          }
          //paste
          else {
            masterConfig.copying = false
            led.buildGrid(currentTrack)
            grid.refresh(led.grid)
          }
        }
        //toggle universal note value
        else if (y === 1 && x === 11) {
          masterConfig.universalNoteValueOn = !masterConfig.universalNoteValueOn

          tracks.forEach(t => {
            t.syncedToUniversalNoteValue = masterConfig.universalNoteValueOn
            if (t.syncedToUniversalNoteValue && !t.isMaster) {
              t.updateNoteValue(tracks[masterConfig.masterTrack].noteValue)
              t.step = tracks[masterConfig.masterTrack].step
            }
          })

          led.buildGrid(currentTrack)
          grid.refresh(led.grid)

          // tracks.forEach(t => t.syncedToUniversalNoteValue = !t.syncedToUniversalNoteValue)
          // masterConfig.universalNoteValueOn = !masterConfig.universalNoteValueOn
          // if (masterConfig.universalNoteValueOn) {
          //   tracks.forEach(t => t.noteValue = masterConfig.universalNoteValue)
          // }
          // led.buildGrid(currentTrack)
          // grid.refresh(led.grid)
        }
        //this part of the grid is page-agnostic and can use x values
        else if (y < 6) {
          currentTrack = currentTrackHandler(x, y, currentTrack)
          led.buildGrid(currentTrack)
          grid.refresh(led.grid)
        } else if (y >= 6) {
          currentTrack = currentTrackHandler(step, y, currentTrack)
          led.buildGrid(currentTrack)
          grid.refresh(led.grid)
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
    const t = tracks[track]
    let step = t.step

    //connect the sync function to incoming ticks
    if (masterConfig.syncing === true && t.isMaster && step === 0) {
      currentTrack.step = 0
      masterConfig.syncing = false
      masterConfig.syncTrack = null
      led.grid[1][7] = 0
    }

    const [notes, velocity, msPerNote] = t.getNotes(step)
    //poly
    if (notes && t.poly) {
      for (const note of notes) {
        maxApi.outlet('notes', track, note, velocity, msPerNote)
      }
    }
    //mono
    else {
      maxApi.outlet('note', track, notes, velocity, msPerNote)
    }

    t.incrementStep()
  })

  maxApi.addHandler('playhead', (track) => {

    const t = currentTrack
    let step = t.step//((t.step - 1) + t.upperLimit) % t.upperLimit
    //followMode off
    if (!t.followMode || t.numPages === 1) {
      const [pageStart, pageEnd] = calculateLimits(t)

      for (let x = pageStart; x < pageEnd; x++) {
        if (step === x) {
          //these two views have a default full column appearance
          //use a flicker on the playhead to make them easier to read
          if (t.view === 2 || t.view === 3) {
            if (t.sequence[step].velocity === 8 || t.sequence[step].prob === 8) {
              for (let y = 8; y < 16; y++) {
                led.grid[y][x % 16] = 0
              }
              grid.refresh(led.grid)
            }
            for (let y = 8; y < 16; y++) {
              led.grid[y][x % 16] = 1
            }
          } else {
            for (let y = 8; y < 16; y++) {
              led.grid[y][x % 16] = 1
            }
          }
        } else {
          led.buildColumn(x, currentTrack)
        }
      }
    } else {
      let [pageStart, pageEnd] = calculateLimits(t)
      if (step === pageEnd) {
        t.page += 1;
        [pageStart, pageEnd] = calculateLimits(t)
        led.buildGrid(t)
        grid.refresh(led.grid)
      }
      //modify this for different lengths
      for (let x = pageStart; x < pageEnd; x++) {
        if (step === x) {
          //these two views have a default full column appearance
          //use a flicker on the playhead to make them easier to read
          if (t.view === 2 || t.view === 3) {
            if (t.sequence[step].velocity === 8 || t.sequence[step].prob === 8) {
              for (let y = 8; y < 16; y++) {
                led.grid[y][x % 16] = 0
              }
              grid.refresh(led.grid)
            }
            for (let y = 8; y < 16; y++) {
              led.grid[y][x % 16] = 1
            }
          } else {
            for (let y = 8; y < 16; y++) {
              led.grid[y][x % 16] = 1
            }
          }
        } else {
          led.buildColumn(x, currentTrack)
        }
      }

      if (step === t.upperLimit - 1) {
        t.page = 0
        led.buildGrid(t)
      }

    }

    grid.refresh(led.grid)
  })

  maxApi.addHandler('masterHertz', (hz) => {
    masterConfig.masterHz = hz
    for (const track of tracks) {
      track.updateMsPerNote(masterConfig)
    }
  })

  maxApi.addHandler('stop', () => {
    for (var y = 8; y < 16; y++) {
      led.grid[y][currentTrack.step - 1] = 0
    }

    led.buildGrid(currentTrack)
    grid.refresh(led.grid)

    //default is to return tracks to 0
    //implement a mode to make this optional
    for (let i = 0; i < tracks.length; i++) {
      tracks[i].step = 0;
    }
  })

  const flicker = (grid, masterConfig, x) => {
    let flicker = 0
    const timer = setInterval(() => {
      if (masterConfig.syncing || masterConfig.copying) {
        led.grid[1][x] = flicker ? 0 : 1
        flicker = !flicker
        grid.refresh(led.grid)
      } else {
        clearInterval(timer)
      }
    }, 1000 / 10)
  }

  initialize()
  run()

}

main()