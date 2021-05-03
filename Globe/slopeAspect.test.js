/* eslint-disable camelcase */
import { aspect, slope, slopeAspect } from './slopeAspect.js'

// arcGis slope example
// | 50 45 50| dz_dx = ((50 + 60 + 10) - (50 + 60 + 8)) / (8 * 5) = (120 - 118) / 40 = 0.05
// | 30 30 30| dz_dy = ((8 + 20 + 10) - (50 + 90 + 50)) / (8 * 5) = (38 - 190 ) / 40 = -3.8
// |  8 10 10| slope = √ ((0.05)2 + (-3.8)2) = √ (0.0025 + 14.44) = 3.80032 radians
//                   = ATAN (3.80032) * 57.29578 = 1.31349 * 57.29578 = 75.25762 degrees

// arcGis aspect example
// |101 92 85| dz_dx = ((85 + 170 + 84)) - (101 + 202 + 101)) / 8 => -8.125
// |101 92 85| dz_dy = ((101 + 182 + 84) - (101 + 184 + 85)) / 8 => -0.375
// |101 91 84| aspect = 57.29578 * atan2 (-0.375, 8.125) => -2.64
//                      (aspect < 0) => 90 - (-2.64) => 92.64

// UNLV example
const z1 = [42, 45, 47, 40, 44, 49, 44, 48, 52]

// arcGis aspect example
const z2 = [101, 92, 85, 101, 92, 85, 101, 91, 84]

// arcGis slope example
const z3 = [50, 45, 50, 30, 30, 30, 8, 10, 10]

const xdim = 10
const ydim = 10

function arcGis (z, xdim, ydim) {
  const [a, b, c, d, , f, g, h, i] = z
  const dz_dx = ((c + 2 * f + i) - (a + 2 * d + g)) / (8 * xdim)
  const dz_dy = ((g + 2 * h + i) - (a + 2 * b + c)) / (8 * ydim)

  const sx = ((c - a) + 2 * (f - d) + (i - h)) / (8 * xdim)
  const sy = ((a - g) + 2 * (b - h) + (c - i)) / (8 * ydim)

  const slopeRad = Math.atan(Math.sqrt(dz_dx ** 2 + dz_dy ** 2))
  const slopeDeg = slopeRad * 180 / Math.PI
  const aspect = 57.29578 * Math.atan2(dz_dy, -dz_dx)
  let cell
  if (aspect < 0) {
    cell = 90 - aspect
  } else if (aspect > 90) {
    cell = 360 - aspect + 90
  } else {
    cell = 90 - aspect
  }
  return [slopeDeg, cell, dz_dx, dz_dy, sx, sy]
}

test('1: arcGis aspect example', () => {
  const [slp, asp, sx, sy] = arcGis(z2, xdim, ydim)
  expect(asp).toBeCloseTo(92.6425, 2)
  expect(sx).toEqual(-0.8125)
  expect(sy).toEqual(-0.0375)
  expect(slp).toEqual(39.12369676205631)
})

test('2: UNLV example', () => {
  const [slp, asp, dz_dx, dz_dy, sx, sy] = arcGis(z1, xdim, ydim)
  expect(dz_dx).toEqual(0.3875)
  expect(sx).toEqual(0.3375)
  expect(dz_dy).toEqual(0.1625)
  expect(sy).toEqual(-0.1625)
  expect(slp).toEqual(22.79182488065121)
  expect(asp).toEqual(292.7509750064356)
})

// 3 3 3
// 2 2 2
// 1 1 1
// const south = [2, 3, 3, 3, 2, 2, 1, 1, 1]
const south = [3, 3, 3, 2, 2, 2, 1, 1, 1]
test('3: ArcGis South', () => {
  const [slp, asp] = slopeAspect(south, xdim, ydim)
  expect(slp).toEqual(5.710593137499643) // 10% slope = 5.71 deg
  expect(asp).toBeCloseTo(180, 5)
})

test('5: slopeAspect methods and examples', () => {
  // arcGis example
  let [slp, asp] = slopeAspect(z2, xdim, ydim)
  expect(slp).toEqual(39.12369676205631)
  expect(asp).toBeCloseTo(92.6425, 2)

  // UNLV example
  ;[slp, asp] = slopeAspect(z1, xdim, ydim)
  expect(slp).toEqual(22.79182488065121)
  expect(asp).toEqual(292.7509750064356)

  // south
  ;[slp, asp] = slopeAspect(south, xdim, ydim)
  expect(slp).toEqual(5.710593137499643) // 10% slope = 5.71 deg
  expect(asp).toBeCloseTo(180, 5)
})

test('6: ArcGis slope() example and test', () => {
  let slp, asp
  slp = slope(z3, 5, 5)
  expect(slp).toBeCloseTo(75.25762, 4)

  ;[slp, asp] = slopeAspect(z3, 5, 5)
  expect(slp).toBeCloseTo(75.25762, 4)
  expect(asp).toBeCloseTo(180.75384910432572)

  asp = aspect(z2, xdim, ydim)
  expect(asp).toBeCloseTo(92.6425, 2)
  ;[slp, asp] = slopeAspect(z2, xdim, ydim)
  expect(asp).toBeCloseTo(92.6425, 2)
  expect(slp).toEqual(39.12369676205631)
})
