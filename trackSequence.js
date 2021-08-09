const maxApi = require('max-api')

let sequence = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
let step = 0

maxApi.addHandler('tick', () => {

  if (sequence[step] === 1) {
    maxApi.outlet('bang')
  }

  step++
  if (step > 15) {
    step = 0
  }
  
})