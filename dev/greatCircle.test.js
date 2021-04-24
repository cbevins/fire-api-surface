import { distance, destination } from './greatCircle.js'

test('1: Great circle distance', () => {
  // 1/3 arc second (30.89 m)
  const arcsec = 1 / (60 * 60)
  let str = ''

  // DIfferences bteween haversine and simple spherical
  // at short distances (30.89 m) is < 0.0006 m
  let d = distance(47, -114, 47.0001, -114)
  str += `n-s haversine distance at 0.0001 deg = ${d} m\n`
  expect(d).toEqual(11.119492664825003)
  d = distance(47, -114, 47.0001, -114, false)
  str += `n-s spherical distance at 0.0001 deg = ${d} m\n`
  expect(d).toEqual(11.119189122997021)

  d = distance(47, -114, 47, -114 - 0.0001, true)
  str += `e-w haversine distance at 0.0001 deg = ${d} m\n`
  expect(d).toEqual(7.583475762137116)
  d = distance(47, -114, 47, -114 - 0.0001, false)
  str += `e-w spherical distance at 0.0001 deg = ${d} m\n`
  expect(d).toEqual(7.584136096150264)

  d = distance(47, -114, 47 + arcsec / 3, -114, true)
  str += `n-s haversine distance at 1/3 arcsec = ${d} m\n`
  expect(d).toEqual(10.295826541329058)
  d = distance(47, -114, 47 + arcsec / 3, -114, false)
  str += `n-s spherical distance at 1/3 arcsec = ${d} m\n`
  expect(d).toEqual(10.295994581796096)

  d = distance(47, -114, 47, -114 - arcsec / 3, true)
  str += `e-w haversine distance at 1/3 arcsec = ${d} m\n`
  expect(d).toEqual(7.021736816673953)
  d = distance(47, -114, 47, -114 - arcsec / 3, false)
  str += `e-w spherical distance at 1/3 arcsec = ${d} m\n`
  expect(d).toEqual(7.02264576189232)

  // No difference between haversine and simple spherical for long distances
  d = distance(47, -114, -33.8868, 88.47, 151.2093)
  str += `Sydney haversine distance = ${d} m\n`
  expect(d).toEqual(17633513.83680136)
  d = distance(47, -114, -33.8868, 88.47, 151.2093, false)
  str += `Sydney spherical distance = ${d} m\n`
  expect(d).toEqual(17633513.83680136)

  console.log(str)
})

test('2: Great circle destination', () => {
  const [lat, lon] = destination(47, -114, 45, 30.89)
  expect(lat).toEqual(47.000145934158866)
  expect(lon).toEqual(-113.99965339796037)
  const str = `destination at 30.89 m to the nw = [${lat}, ${lon}]\n`

  const dist = distance(47, -114, lat, lon, true)
  expect(dist).toBeCloseTo(30.89, 9)
  console.log(str)
})
