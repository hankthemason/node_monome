const fs = require('fs')

const writeSequence = (path, tracks, masterConfig) => {
  const data = {
    tracks: tracks,
    masterConfig: masterConfig
  }
  fs.writeFile(path.slice(13), JSON.stringify(data), function (err) {
    if (err) {
      console.log(err)
      throw err
    };
    console.log('Saved!');
  });
}

const readSequence = path => {
  path = path.slice(13)
  let seq = fs.readFileSync(path, 'utf8', (err, data) => {
    if (err) {
      console.error(err)
      return
    }
    return data
  })
  return JSON.parse(seq)
}

module.exports = {
  writeSequence,
  readSequence
}