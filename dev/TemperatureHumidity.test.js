import {
  dewPoint,
  heatIndex,
  relativeHumidity,
  reaDewPoint,
  reaRh,
  summerSimmerIndex,
  windChill
} from './TemperatureHumidity.js'

test('1 dewPoint(), relativeHumidity(), reaRh(), and reaDewPoint()', () => {
  let dp = dewPoint(80, 60, 0)
  let rh = relativeHumidity(80, dp)
  expect(dp).toEqual(44.82398987900015)
  expect(rh).toEqual(0.2890303643500842)
  expect(reaRh(80, dp)).toBeCloseTo(rh, 5)
  expect(reaDewPoint(80, rh)).toBeCloseTo(dp, 1)

  dp = dewPoint(90, 60, 0)
  rh = relativeHumidity(90, dp)
  expect(dp).toEqual(32.840736794428075)
  expect(rh).toEqual(0.13126403584785518)
  expect(reaRh(90, dp)).toBeCloseTo(rh, 4)
  expect(reaDewPoint(90, rh)).toBeCloseTo(dp, 1)

  dp = dewPoint(90, 55, 0)
  rh = relativeHumidity(90, dp)
  expect(dp).toEqual(0.6631788009199404)
  expect(rh).toEqual(0.03239387639520112)
  expect(reaRh(90, dp)).toBeCloseTo(rh, 3)
  expect(reaDewPoint(90, rh)).toBeCloseTo(dp, 1)

  dp = dewPoint(90, 55, 10000)
  rh = relativeHumidity(90, dp)
  expect(dp).toEqual(30.230182815267927)
  expect(rh).toEqual(0.11809965668845734)
  expect(reaRh(90, dp)).toBeCloseTo(rh, 4)
  expect(reaDewPoint(90, rh)).toBeCloseTo(dp, 1)

  dp = dewPoint(50, 60)
  rh = relativeHumidity(50, dp)
  expect(dp).toEqual(50)
  expect(rh).toEqual(1)
  expect(reaRh(50, dp)).toBeCloseTo(rh, 4)
  expect(reaDewPoint(50, rh)).toBeCloseTo(dp, 1)

  dp = dewPoint(-50, -60)
  rh = relativeHumidity(-50, dp)
  expect(dp).toEqual(-40)
  expect(rh).toEqual(1)
  expect(reaRh(-50, dp)).toBeCloseTo(rh, 5)
  expect(reaDewPoint(-50, rh)).toBeCloseTo(dp, 1)
})

test('2 windChill()', () => {
  expect(windChill(40, 10)).toEqual(33.64254827558847)
  expect(windChill(0, 35)).toEqual(-27.403250268727305)
  expect(windChill(0, 0)).toEqual(35.74) // 35.74 + 0.6215 * at
  expect(windChill(-40, 50)).toEqual(-87.9480422758242)
})

test('3 heatIndex()', () => {
  expect(heatIndex(80, 40)).toBeCloseTo(80, 0)
  expect(heatIndex(90, 70)).toBeCloseTo(105, -1)
  expect(heatIndex(80, 100)).toBeCloseTo(87, -1)
  expect(heatIndex(110, 40)).toBeCloseTo(136, 0)
  expect(heatIndex(100, 80)).toBeCloseTo(158, 0)
  expect(heatIndex(90, 10)).toBeCloseTo(85, 0)
})

test('4 summerSimmerIndex()', () => {
  expect(summerSimmerIndex(100, 80)).toEqual(132.0224)
})
