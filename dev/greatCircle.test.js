import { distance, destination } from './greatCircle.js'

test('Great circle distance', () => {
  // 1/3 arc second (30.89 m)
  const arcsec = 1 / (60 * 60)
  let str = ''

  let d = distance(47, -114, 47.0001, -114, true)
  str += `n-s distance at 0.0001 deg = ${d} m\n`
  expect(d).toEqual(11.119492664825003)

  d = distance(47, -114, 47, -114 - 0.0001, true)
  str += `e-w distance at 0.0001 deg = ${d} m\n`
  expect(d).toEqual(7.583475762137116)

  d = distance(47, -114, 47 + arcsec / 3, -114, true)
  str += `n-s distance at 1/3 arcsec = ${d} m\n`
  expect(d).toEqual(10.295826541329058)

  d = distance(47, -114, 47, -114 - arcsec / 3, true)
  str += `e-w distance at 1/3 arcsec = ${d} m\n`
  expect(d).toEqual(7.021736816673953)

  console.log(str)
})

test('Great circle destination', () => {
  const [lat, lon] = destination(47, -114, 45, 30.89)
  expect(lat).toEqual(47.000145934158866)
  expect(lon).toEqual(-113.99965339796037)
  const str = `destination at 30.89 m to the nw = [${lat}, ${lon}]\n`

  const dist = distance(47, -114, lat, lon, true)
  expect(dist).toBeCloseTo(30.89, 9)
  console.log(str)
})
