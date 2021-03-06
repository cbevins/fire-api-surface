import * as Astro from './Astro.js'
import { clockTime, formatDate } from '../Calendar/Calendar.js'
// import { sunPosition } from './index.js'
// import { ymdToJd } from '../Calendar/Calendar.js'

const lat = 46.85714
const lon = -114.00730
const gmt = -6
const year = 2021
const month = 4
const day = 23

test('1: sun()', () => {
  const sun = Astro.sun(lat, lon, gmt, year, month, day)
  expect(sun.rise.occurs).toEqual(true)
  expect(sun.rise.time).toBeCloseTo(6 + (33 / 60) + (12 / 3600), 3)
  expect(sun.set.occurs).toEqual(true)
  expect(sun.set.time).toBeCloseTo(20 + (35 / 60) + (47 / 3600), 3)
  expect(sun.visible.always).toEqual(false)
  expect(sun.visible.diurnal).toEqual(true)
  expect(sun.visible.never).toEqual(false)
})

test('2: moon()', () => {
  const moon = Astro.moon(lat, lon, gmt, year, month, day)
  expect(moon.rise.occurs).toEqual(true)
  expect(moon.rise.time).toBeCloseTo(16 + (17 / 60) + (57 / 3600), 3)
  expect(moon.set.occurs).toEqual(true)
  expect(moon.set.time).toBeCloseTo(5 + (23 / 60) + (34 / 3600), 3)
  expect(moon.visible.always).toEqual(false)
  expect(moon.visible.diurnal).toEqual(true)
  expect(moon.visible.never).toEqual(false)
})

test('3: civil()', () => {
  const e = Astro.civil(lat, lon, gmt, year, month, day)
  expect(e.rise.occurs).toEqual(true)
  expect(e.rise.time).toBeCloseTo(6.011626, 5)
  expect(e.set.occurs).toEqual(true)
  expect(e.set.time).toBeCloseTo(21.150151, 5)
  expect(e.visible.always).toEqual(false)
  expect(e.visible.diurnal).toEqual(true)
  expect(e.visible.never).toEqual(false)
})

test('4: nautical()', () => {
  const e = Astro.nautical(lat, lon, gmt, year, month, day)
  expect(e.rise.occurs).toEqual(true)
  expect(e.rise.time).toBeCloseTo(5.341886, 4)
  expect(e.set.occurs).toEqual(true)
  expect(e.set.time).toBeCloseTo(21.829089, 4)
  expect(e.visible.always).toEqual(false)
  expect(e.visible.diurnal).toEqual(true)
  expect(e.visible.never).toEqual(false)
})

test('5: astronomical()', () => {
  const e = Astro.astronomical(lat, lon, gmt, year, month, day)
  expect(e.rise.occurs).toEqual(true)
  expect(e.rise.time).toBeCloseTo(4.588416, 5)
  expect(e.set.occurs).toEqual(true)
  expect(e.set.time).toBeCloseTo(22.575165)
  expect(e.visible.always).toEqual(false)
  expect(e.visible.diurnal).toEqual(true)
  expect(e.visible.never).toEqual(false)
})

// https://www.sunearthtools.com/dp/tools/pos_sun.php
test('6: sun() at home on 4/26/2021 tested against sunearthtools.com', () => {
  const sun = Astro.sun(lat, lon, -7, 2021, 4, 26)
  expect(sun.rise.occurs).toEqual(true)
  expect(sun.rise.time).toBeCloseTo(5 + (28 / 60) + (20 / 3600), 2)
  expect(sun.set.occurs).toEqual(true)
  expect(sun.set.time).toBeCloseTo(19 + (40 / 60) + (4 / 3600), 2)
  expect(sun.visible.always).toEqual(false)
  expect(sun.visible.diurnal).toEqual(true)
  expect(sun.visible.never).toEqual(false)

  // const jd = ymdToJd(2021, 4, 26) // noon
  // const [alt, ra] = sunPosition(jd, lat, lon, -7)
  // expect(alt).toBeCloseTo(51 + (53 / 60), 1)
  // expect(ra).toBeCloseTo(141 + (6 / 60), 1)
})

function fmt (n, e) {
  let str = `${n.padEnd(9, ' ')}`
  str += `  ${e.rise.time.toFixed(6).padStart(9, ' ')}`
  str += `  ${clockTime(e.rise.time)}`
  str += `  ${e.set.time.toFixed(6).padStart(10, ' ')}`
  str += `  ${clockTime(e.set.time)}\n`
  return str
}

// eslint-disable-next-line no-unused-vars
function daily (name, lat, lon, gmt, y, m, d) {
  let str = `Daily Rise-Set Time for ${name} on ${formatDate(y, m, d)}\n`
  str += '               Rises (or Dawn)        Sets (or Dusk)\n'
  str += '               Hours  hh:mm:ss       Hours  hh:mm:ss\n'
  str += fmt('Sun', Astro.sun(lat, lon, gmt, y, m, d))
  str += fmt('Civil', Astro.civil(lat, lon, gmt, y, m, d))
  str += fmt('Nautical', Astro.nautical(lat, lon, gmt, y, m, d))
  str += fmt('Atronom', Astro.astronomical(lat, lon, gmt, y, m, d))
  str += fmt('Moon', Astro.moon(lat, lon, gmt, y, m, d))
  console.log(str)
}

// daily('Missoula, MT', lat, lon, gmt, year, month, day)
