import * as Astro from './Astro.js'
import { clockTime, formatDate, ymdToJd } from './Calendar.js'

const lat = 46.857
const lon = -114.007
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
  expect(e.rise.time).toBeCloseTo(6.011613, 5)
  expect(e.set.occurs).toEqual(true)
  expect(e.set.time).toBeCloseTo(21.150124, 5)
  expect(e.visible.always).toEqual(false)
  expect(e.visible.diurnal).toEqual(true)
  expect(e.visible.never).toEqual(false)
})

test('4: nautical()', () => {
  const e = Astro.nautical(lat, lon, gmt, year, month, day)
  expect(e.rise.occurs).toEqual(true)
  expect(e.rise.time).toBeCloseTo(5.341886, 5)
  expect(e.set.occurs).toEqual(true)
  expect(e.set.time).toBeCloseTo(21.829089)
  expect(e.visible.always).toEqual(false)
  expect(e.visible.diurnal).toEqual(true)
  expect(e.visible.never).toEqual(false)
})

test('5: astronomical()', () => {
  const e = Astro.astronomical(lat, lon, gmt, year, month, day)
  expect(e.rise.occurs).toEqual(true)
  expect(e.rise.time).toBeCloseTo(4.588409, 5)
  expect(e.set.occurs).toEqual(true)
  expect(e.set.time).toBeCloseTo(22.575165)
  expect(e.visible.always).toEqual(false)
  expect(e.visible.diurnal).toEqual(true)
  expect(e.visible.never).toEqual(false)
})

test('6: moonPhase()', () => {
  const e = Astro.moonPhase(year, month, day, gmt)
  let str = `Moon Phases for JD ${ymdToJd(year, month, day)}\n`
  str += `Prev New  ${e.q0} ${formatDate(e.q0)} ${clockTime(e.q0)}\n`
  str += `First Qtr ${e.q1} ${formatDate(e.q1)} ${clockTime(e.q1)}\n`
  str += `Full      ${e.q2} ${formatDate(e.q2)} ${clockTime(e.q2)}\n`
  str += `Third Qtr ${e.q3} ${formatDate(e.q3)} ${clockTime(e.q3)}\n`
  str += `Next New  ${e.q4} ${formatDate(e.q4)} ${clockTime(e.q4)}\n`
  console.log(str)
  expect(e.age).toEqual(1)
})

function fmt (n, e) {
  let str = `${n.padEnd(9, ' ')}`
  str += `  ${e.rise.time.toFixed(6).padStart(9, ' ')}`
  str += `  ${clockTime(e.rise.time)}`
  str += `  ${e.set.time.toFixed(6).padStart(10, ' ')}`
  str += `  ${clockTime(e.set.time)}\n`
  return str
}

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
