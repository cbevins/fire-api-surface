import * as Astro from './Astro.js'
import { ymdToJd } from './Calendar.js'

const lat = 46.857
const lon = -114.007
const gmt = -6
const jd = ymdToJd(2021, 4, 23)

test('1: riseSet(SunRise)', () => {
  const [time, note] = Astro.riseSet(Astro.SunRise, jd, lat, lon, gmt)
  expect(time).toBeCloseTo(6 + (33 / 60) + (12 / 3600), 3)
  expect(note).toEqual('Rises')
})

test('2: riseSet(SunSet)', () => {
  const [time, note] = Astro.riseSet(Astro.SunSet, jd, 46.857, -114.007, -6)
  expect(time).toBeCloseTo(20 + (35 / 60) + (47 / 3600), 3)
  expect(note).toEqual('Sets')
})
