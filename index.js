const maxApi = require('max-api')
const monomeGrid = require('monome-grid')
const noteValues = require('./configurations/noteValues')
const views = require('./configurations/views')
const create2DArray = require('./utils/create2DArray')
const insertCol = require('./utils/insertCol')
const getMsPerNote = require('./utils/getMsPerNote')
const calculateLimits = require('./utils/calculateLimits')
const { MonoTrack, MappedTrack } = require('./models/track')
const { buildRow, buildAllRows, buildViewRows } = require('./utils/buildRow')
const buildColumn = require('./utils/buildColumn')
const { er1, sh101, prophet12 } = require('./configurations/instrumentConfigs')
const scales = require('./configurations/scales')
const { Step, PolyStep, MonoStep } = require('./models/step')

const tracks = [
  new MappedTrack(0, 4, er1),
  new MonoTrack(1, 4, sh101)
]

const main = async() => {
  let grid = await monomeGrid(); // optionally pass in grid identifier
  
  let led = [];
  let masterTrack
  let syncing = false
  let syncTrack
  let currentTrack
  let masterHertz

  const initialize = async() => {
    led = create2DArray(16, 16)
    masterTrack = tracks[0]
    masterTrack.isMaster = true
    currentTrack = tracks[0]

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
      const xTranslated = x + (currentTrack.page * 16)
      if (s === 1) {
        if (y === 0) {
          //switch track
          if (x < 6 && x !== currentTrack.track) {
            currentTrack = tracks[x]
            led = buildAllRows(led, currentTrack)
            grid.refresh(led)
            maxApi.outlet('changeTrack', x)
          } 
          //switch note value
          else if (x > 5 && x < 12) {
            currentTrack.noteValue = x - 6
            currentTrack.msPerNote = getMsPerNote(masterHertz, currentTrack)
            led[y] = buildRow(y, currentTrack)
            grid.refresh(led)
            maxApi.outlet('changeNoteValue', noteValues[currentTrack.noteValue].coeff, currentTrack.track)
          }
          //switch current page on view
          else if (x > 11) {
            if ((x - 12) < currentTrack.numPages) {
              currentTrack.page = x - 12
              led = buildAllRows(led, currentTrack)
              grid.refresh(led)
            }
          }
        }
        //view selector / sync to master / numPages
        else if (y === 1) {
          //view selector
          if (x < 5) {
            currentTrack.view = x
            led[y] = buildRow(y, currentTrack)
            const viewRows = buildViewRows(currentTrack)
            led.splice(8, 8, ...viewRows)
            grid.refresh(led)   
          } 
          //sync to master
          else if (x === 7 && !currentTrack.isMaster) {
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
          //numPages selector
          else if (x > 11) {
            let t = currentTrack
            const prevNumPages = t.numPages
            t.numPages = x - 11
            t.upperLimit = 16 * t.numPages

            const diff = Math.abs(t.numPages - prevNumPages)
            //numPages increased
            if (prevNumPages < t.numPages) {
              for (let x = 0; x < 16 * diff; x++) {
                //mapping instrument
                if (t.instrumentConfig.mapping) {
                  t.sequence.push(new PolyStep(false, new Array(t.instrumentConfig.mapping.length), 0, 0, 0, 0, false))
                }
                //mono
                if (!t.poly) {
                  t.sequence.push(new MonoStep(false, null, 0, 0, 0, 0, false))
                }
              }
            } 
            //if numPages decreased, don't do anything: keep the extra sequence parts in memory
            else if (prevNumPages > t.numPages && t.page >= t.numPages) {
              if (t.page >= t.numPages) {
                t.page = t.numPages - 1
              }
              t.step = (t.step % 16) + (t.page * 16)
              led[0] = buildRow(0, currentTrack)
            }

            led[y] = buildRow(y, currentTrack)
            grid.refresh(led)
          }
        }
        //slide on/off
        else if (y === 6) {
          //handleSlide()
          currentTrack.sequence[xTranslated].slide = !currentTrack.sequence[xTranslated].slide
          led[y] = buildRow(y, currentTrack)
          grid.refresh(led)
        } 
        //note on/off
        else if (y === 7) {
          currentTrack.sequence[xTranslated].on = !currentTrack.sequence[xTranslated].on
          const col = buildColumn(xTranslated, currentTrack)
          led = insertCol(led, col, x)
          led[y] = buildRow(y, currentTrack)
          grid.refresh(led)
        } 
        //view input (pitch, vel, prob, pitchProb, or unknown)
        else if (y > 7) {
          
          //pitch input
          if (currentTrack.view === 0) {
            //turn note on
            if (!currentTrack.sequence[x].pitch || !currentTrack.sequence[x].pitches) {
              currentTrack.sequence[xTranslated].on = true
              maxApi.post(buildRow(7, currentTrack))
              led[7] = buildRow(7, currentTrack)
            }
            //poly
            if (currentTrack.poly === true) {
              //mapping
              if (currentTrack.instrumentConfig.mapping) {
                const yOffset = currentTrack.sequence[xTranslated].octave * 8 
                const noteIdx = (15 - y)
                //turn note off if it's already selected
                if (currentTrack.sequence[xTranslated].pitches.includes(currentTrack.instrumentConfig.mapping[noteIdx])) {
                  currentTrack.sequence[xTranslated].pitches[15 - y + yOffset] = null
                  const col = buildColumn(xTranslated, currentTrack)
                  led = insertCol(led, col, x)
                } 
                //turn note on
                else {
                  currentTrack.sequence[xTranslated].pitches[noteIdx] = currentTrack.instrumentConfig.mapping[noteIdx]
                  const col = buildColumn(xTranslated, currentTrack)
                  led = insertCol(led, col, x)
                }
              }
            } 
            //mono
            else {
              let note = currentTrack.rootNote + currentTrack.scale[(15 - y) % 7] + (currentTrack.sequence[x].octave * 12)
              //allow for octaves to be input
              if (y < 9) {
                note += 12
              }
              //first, check the input against the instrument's bounds
              if (note >= currentTrack.instrumentConfig.minNote && note <= currentTrack.instrumentConfig.maxNote) {
                currentTrack.sequence[xTranslated].pitch = note
                const col = buildColumn(xTranslated, currentTrack)
                led = insertCol(led, col, x)
              }
            }
            grid.refresh(led)
          }
          //octave input
          else if (currentTrack.view === 1) {
            if (!currentTrack.instrumentConfig.mapping) {
              let thisStep = currentTrack.sequence[xTranslated]
              //this is the real # of possible octaves based on root note
              const calculatedOctaveSpan = Math.ceil((currentTrack.instrumentConfig.maxNote - currentTrack.rootNote) / 12)
              if ((15 - y) < calculatedOctaveSpan) {
                const prevOctave = thisStep.octave 
                thisStep.octave = 15 - y
                const diff = Math.abs(prevOctave - thisStep.octave)
                //octave increases
                thisStep.octave > prevOctave ? thisStep.pitch += diff * 12 : thisStep.pitch -= diff * 12
                const col = buildColumn(xTranslated, currentTrack)
                led = insertCol(led, col, x)
              }
            } 
            //mapped
            else {
              //check if selection is within instrument's octaveSpan
              if ((15 - y) < currentTrack.instrumentConfig.octaveSpan) {
                currentTrack.sequence[xTranslated].octave = 15 - y
                const col = buildColumn(xTranslated, currentTrack)
                led = insertCol(led, col, x)
              }
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
    if (syncing === true && t.isMaster && step === 0) {
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
        maxApi.outlet('notes', track, notes, t.msPerNote)
      } 
      //mono track
      else {
        maxApi.post(t.msPerNote)
        maxApi.post(t.msPerNote * .2)
        if (t.sequence[step].slide) {
          maxApi.outlet('note', track, t.sequence[step].pitch, (t.msPerNote + (t.msPerNote * .25)))
        } else {
          maxApi.outlet('note', track, t.sequence[step].pitch, (t.msPerNote - (t.msPerNote * .25)))
        }
      }
    }
    t.incrementStep()
  })

  maxApi.addHandler('playhead', (track) => {
    const t = currentTrack
    let topRow = buildRow(0, t)
    let step = t.step
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

  maxApi.addHandler('changeTrack', (track) => {
    currentTrack = tracks[track]
    topRow = buildRow(0, currentTrack)
    led[0] = topRow
    grid.refresh(led)
  })

  maxApi.addHandler('masterHertz', (hz) => {
    for (const track of tracks) {
      track.msPerNote = getMsPerNote(hz, track)
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

  initialize()
  run()

}

main()