const er1 = {
  name: 'er-1',
  minNote: 36,
  maxNote: 49,
  noteSpan: 13,
  octaveSpan: 2,
  polyphony: 'poly',
  pitchOrganization: 'mapping',
  mapping: [36, 38, 40, 41, 42, 46, 49, 39, 43, 45],
  midiChannel: 10,
  port: 'a'
}

const sh101 = {
  name: 'sh-101',
  minNote: 48,
  maxNote: 108,
  noteSpan: 60,
  octaveSpan: 5,
  polyphony: 'mono',
  pitchOrganization: 'scalar',
  mapping: null,
  midiChannel: 0,
  port: 'd'
}

const prophet12 = {
  model: 'prophet-12',
  minNote: 24,
  maxNote: 120,
  noteSpan: 108,
  octaveSpan: 8,
  polyphony: 'poly',
  pitchOrganization: 'scalar',
  mapping: null,
  midiChannel: 12,
  port: 'a'
}

module.exports = {
  er1,
  sh101,
  prophet12
}