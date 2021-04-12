import { fuelMoisture, reference, correction } from './FosbergFuelMoisture.js'

const Obs = {
  db: 60,
  rh: 0.54,
  mon: 7,
  shd: 0.1,
  asp: 180,
  slp: 0.2,
  hr: 13,
  pos: 'level'
}

test('Fosberg Table A, Reference Fuel Moisture', () => {
  const obs = { ...Obs }
  expect(reference(obs.db, obs.rh)).toEqual(0.07)
  obs.rh = 0.55
  expect(reference(obs.db, obs.rh)).toEqual(0.08)
  obs.db = 0
  obs.rh = -0.1
  expect(reference(obs.db, obs.rh)).toEqual(0.01)
  obs.db = 89.9999
  obs.rh = 0.749999
  expect(reference(obs.db, obs.rh)).toEqual(0.09)
})

test('Fosberg Table B, Correction for May, Jun, Jul', () => {
  const o = { ...Obs }
  expect(correction(o.mon, o.shd, o.asp, o.slp, o.hr, o.pos)).toEqual(0)
  expect(correction(5, o.shd, o.asp, o.slp, o.hr, o.pos)).toEqual(0)
  expect(correction(6, o.shd, o.asp, o.slp, o.hr, o.pos)).toEqual(0)
  expect(correction(7, o.shd, o.asp, o.slp, o.hr, o.pos)).toEqual(0)

  expect(correction(o.mon, o.shd, o.asp, o.slp, o.hr, o.pos)).toEqual(0)
  expect(correction(o.mon, 0, o.asp, o.slp, o.hr, o.pos)).toEqual(0)
  expect(correction(o.mon, 1, o.asp, o.slp, o.hr, o.pos)).toEqual(0.03)

  expect(correction(o.mon, o.shd, o.asp, o.slp, o.hr, o.pos)).toEqual(0)
  expect(correction(o.mon, o.shd, o.asp, o.slp, 13, o.pos)).toEqual(0)
  expect(correction(o.mon, o.shd, o.asp, o.slp, 12, o.pos)).toEqual(0)
  expect(correction(o.mon, o.shd, o.asp, o.slp, 14, o.pos)).toEqual(0)
  expect(correction(o.mon, o.shd, o.asp, o.slp, 16, o.pos)).toEqual(0.01)
  expect(correction(o.mon, o.shd, o.asp, o.slp, 18, o.pos)).toEqual(0.03)
  // Night-time
  expect(correction(o.mon, o.shd, o.asp, o.slp, 20, o.pos)).toEqual(0.05)
  expect(correction(o.mon, o.shd, o.asp, o.slp, 21, o.pos)).toEqual(0.05)
  expect(correction(o.mon, o.shd, o.asp, o.slp, 23, o.pos)).toEqual(0.05)
  expect(correction(o.mon, o.shd, o.asp, o.slp, 0, o.pos)).toEqual(0.04)
  expect(correction(o.mon, o.shd, o.asp, o.slp, 6, o.pos)).toEqual(0.04)
  expect(correction(o.mon, o.shd, o.asp, o.slp, 7, o.pos)).toEqual(0.04)
  expect(correction(o.mon, o.shd, o.asp, o.slp, 8, o.pos)).toEqual(0.03)

  expect(correction(o.mon, o.shd, o.asp, o.slp, o.hr, o.pos)).toEqual(0)
  expect(correction(o.mon, 0.8, 180, o.slp, 16, 'below')).toEqual(0.03)
  expect(correction(o.mon, 0.8, 180, o.slp, 16, 'level')).toEqual(0.04)
  expect(correction(o.mon, 0.8, 180, o.slp, 16, 'above')).toEqual(0.05)
  expect(correction(o.mon, 0.8, 180, o.slp, 16, 'junk')).toEqual(0.04)
})

test('Fosberg Table C, Correction for Feb, Mar, Apr and Aug, Sep, Oct', () => {
  const o = { ...Obs }
  expect(correction(o.mon, o.shd, o.asp, o.slp, o.hr, o.pos)).toEqual(0)
  expect(correction(2, 0.1, 180, 0.2, 13, 'level')).toEqual(0.01)
  // Exposed, north, steep, morning
  expect(correction(3, 0.1, 0, 0.4, 8, 'below')).toEqual(0.03)
  expect(correction(3, 0.1, 0, 0.4, 8, 'level')).toEqual(0.04)
  expect(correction(3, 0.1, 0, 0.4, 8, 'above')).toEqual(0.05)
  expect(correction(3, 0.1, 0, 0.4, 8, 'junk')).toEqual(0.04)
  // Shaded, north, steep, morning
  expect(correction(3, 0.9, 0, 0.4, 8, 'below')).toEqual(0.04)
  expect(correction(3, 0.9, 0, 0.4, 8, 'level')).toEqual(0.05)
  expect(correction(3, 0.9, 0, 0.4, 8, 'above')).toEqual(0.06)
  // Shaded, north, steep, night-time
  expect(correction(3, 0.9, 0, 0.4, 23, 'below')).toEqual(0.04)
  expect(correction(3, 0.9, 0, 0.4, 23, 'level')).toEqual(0.05)
  expect(correction(3, 0.9, 0, 0.4, 23, 'above')).toEqual(0.06)

  // Exposed, north, steep, night-time
  expect(correction(4, 0.1, 0, 0.4, 23, 'below')).toEqual(0.04)
  expect(correction(4, 0.1, 0, 0.4, 23, 'level')).toEqual(0.05)
  expect(correction(4, 0.1, 0, 0.4, 23, 'above')).toEqual(0.06)
  // Shaded north, steep, night-time
  expect(correction(4, 0.9, 0, 0.4, 23, 'below')).toEqual(0.04)
  expect(correction(4, 0.9, 0, 0.4, 23, 'level')).toEqual(0.05)
  expect(correction(4, 0.9, 0, 0.4, 23, 'above')).toEqual(0.06)

  // Exposed, north, steep, day-time
  expect(correction(4, 0.1, 0, 0.4, 13, 'below')).toEqual(0.02)
  expect(correction(4, 0.1, 0, 0.4, 13, 'level')).toEqual(0.03)
  expect(correction(4, 0.1, 0, 0.4, 13, 'above')).toEqual(0.04)
  // Shaded north, steep, day-time
  expect(correction(4, 0.9, 0, 0.4, 13, 'below')).toEqual(0.03)
  expect(correction(4, 0.9, 0, 0.4, 13, 'level')).toEqual(0.04)
  expect(correction(4, 0.9, 0, 0.4, 13, 'above')).toEqual(0.05)
})

test('Fosberg Table D, Correction for Nov, Dec, Jan', () => {
  const o = { ...Obs }
  expect(correction(o.mon, o.shd, o.asp, o.slp, o.hr, o.pos)).toEqual(0)
  expect(correction(12, 0.1, 180, 0.2, 13, 'level')).toEqual(0.03)
  // Exposed, west, steep, morning
  expect(correction(11, 0.1, 270, 0.4, 8, 'below')).toEqual(0.04)
  expect(correction(11, 0.1, 270, 0.4, 8, 'level')).toEqual(0.05)
  expect(correction(11, 0.1, 270, 0.4, 8, 'above')).toEqual(0.06)
  expect(correction(11, 0.1, 270, 0.4, 8, 'junk')).toEqual(0.05)
  // Shaded, west, steep, flat, morning
  expect(correction(11, 0.9, 0, 0.4, 8, 'below')).toEqual(0.04)
  expect(correction(11, 0.9, 0, 0.4, 8, 'level')).toEqual(0.05)
  expect(correction(11, 0.9, 0, 0.4, 8, 'above')).toEqual(0.06)
  // Shaded, west, steep, night-time
  expect(correction(11, 0.9, 0, 0.4, 23, 'below')).toEqual(0.04)
  expect(correction(11, 0.9, 0, 0.4, 23, 'level')).toEqual(0.05)
  expect(correction(11, 0.9, 0, 0.4, 23, 'above')).toEqual(0.06)

  // Exposed, west, steep, night-time
  expect(correction(1, 0.1, 270, 0.4, 23, 'below')).toEqual(0.04)
  expect(correction(1, 0.1, 270, 0.4, 23, 'level')).toEqual(0.05)
  expect(correction(1, 0.1, 270, 0.4, 23, 'above')).toEqual(0.06)
  // Shaded west, steep, night-time
  expect(correction(1, 0.9, 270, 0.4, 23, 'below')).toEqual(0.04)
  expect(correction(1, 0.9, 270, 0.4, 23, 'level')).toEqual(0.05)
  expect(correction(1, 0.9, 270, 0.4, 23, 'above')).toEqual(0.06)

  // Exposed, west, steep, day-time
  expect(correction(12, 0.1, 270, 0.4, 13, 'below')).toEqual(0.03)
  expect(correction(12, 0.1, 270, 0.4, 13, 'level')).toEqual(0.04)
  expect(correction(12, 0.1, 270, 0.4, 13, 'above')).toEqual(0.04)
  // Shaded, west, steep, day-time
  expect(correction(1, 0.9, 270, 0.4, 13, 'below')).toEqual(0.04)
  expect(correction(1, 0.9, 270, 0.4, 13, 'level')).toEqual(0.05)
  expect(correction(1, 0.9, 270, 0.4, 13, 'above')).toEqual(0.06)
})

test('Fosberg fuel moisture', () => {
  expect(reference(95, 0.05)).toEqual(0.01)
  expect(correction(1, 0.9, 270, 0.4, 23, 'level')).toEqual(0.05)
  expect(fuelMoisture(95, 0.05, 1, 0.9, 270, 0.4, 23, 'level'))
    .toBeCloseTo(0.06, 12)
})
