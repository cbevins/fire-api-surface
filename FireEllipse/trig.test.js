import * as T from './trig.js'
import { FireEllipse } from './FireEllipse.js'

const length = 100
const width = 50
const degrees = 135
const time = 1
const fe1 = new FireEllipse(length, width, degrees, time)

test('1: trig.js angle()', () => {
  // Clockwise sweep starting at north
  expect(T.rad2deg(T.angle(0, 10, 0, 10))).toBeCloseTo(0, 12)
  expect(T.rad2deg(T.angle(0, 10, 10, 10))).toBeCloseTo(45, 12)
  expect(T.rad2deg(T.angle(0, 10, 10, 0))).toBeCloseTo(90, 12)
  expect(T.rad2deg(T.angle(0, 10, 10, -10))).toBeCloseTo(135, 12)
  expect(T.rad2deg(T.angle(0, 10, 0, -10))).toBeCloseTo(180, 12)
  expect(T.rad2deg(T.angle(0, 10, -10, -10))).toBeCloseTo(225, 12)
  expect(T.rad2deg(T.angle(0, 10, -10, 0))).toBeCloseTo(270, 12)
  expect(T.rad2deg(T.angle(0, 10, -10, 10))).toBeCloseTo(315, 12)
  // Reverse [x1,y1] and [x2,y2]
  expect(T.rad2deg(T.angle(10, 10, 0, 10))).toBeCloseTo(315, 12)
  expect(T.rad2deg(T.angle(10, 0, 0, 10))).toBeCloseTo(270, 12)
  expect(T.rad2deg(T.angle(10, -10, 0, 10))).toBeCloseTo(225, 12)
  expect(T.rad2deg(T.angle(0, -10, 0, 10))).toBeCloseTo(180, 12)
  expect(T.rad2deg(T.angle(-10, -10, 0, 10))).toBeCloseTo(135, 12)
  expect(T.rad2deg(T.angle(-10, 0, 0, 10))).toBeCloseTo(90, 12)
  expect(T.rad2deg(T.angle(-10, 10, 0, 10))).toBeCloseTo(45, 12)
  // Between north and center point should be 136 degrees
  expect(T.rad2deg(T.angle(0, 10, fe1.cx(), fe1.cy()))).toBeCloseTo(135, 12)
  // Between north and fire head at 135
  expect(T.rad2deg(T.angle(0, 10, fe1.hx(), fe1.hy()))).toBeCloseTo(135, 12)
  // Between fire head at 135 and north
  expect(T.rad2deg(T.angle(fe1.hx(), fe1.hy(), 0, 10))).toBeCloseTo(225, 12)
})

test('2: trig.js caz2rot()', () => {
  expect(T.caz2rot(0)).toEqual(90)
  expect(T.caz2rot(45)).toEqual(45)
  expect(T.caz2rot(90)).toEqual(0)
  expect(T.caz2rot(135)).toEqual(315)
  expect(T.caz2rot(180)).toEqual(270)
  expect(T.caz2rot(225)).toEqual(225)
  expect(T.caz2rot(270)).toEqual(180)
  expect(T.caz2rot(315)).toEqual(135)
  expect(T.caz2rot(360)).toEqual(90)

  expect(T.rot2caz(90)).toEqual(0)
  expect(T.rot2caz(45)).toEqual(45)
  expect(T.rot2caz(0)).toEqual(90)
  expect(T.rot2caz(315)).toEqual(135)
  expect(T.rot2caz(270)).toEqual(180)
  expect(T.rot2caz(225)).toEqual(225)
  expect(T.rot2caz(180)).toEqual(270)
  expect(T.rot2caz(135)).toEqual(315)
  expect(T.rot2caz(90)).toEqual(0)
})

test('3: trig.js azimuthOf()', () => {
  // Quadrant 1 (NE): x-positive, y-positive
  expect(T.azimuthOf(0, 10)).toEqual(0) // north
  expect(T.azimuthOf(10, 10)).toEqual(45)// north-east
  expect(T.azimuthOf(10, 0)).toEqual(90) // east
  // Quadrant 2 (SE): x-positive, y-negative
  expect(T.azimuthOf(10, -0)).toEqual(90) // east
  expect(T.azimuthOf(10, -10)).toEqual(135) // south-east
  expect(T.azimuthOf(0, -10)).toEqual(180) // south
  // Quadrant 3 (SW): x-negative, y-negative
  expect(T.azimuthOf(-0, -10)).toEqual(180) // south
  expect(T.azimuthOf(-10, -10)).toEqual(225) // south-west
  expect(T.azimuthOf(-10, -0)).toEqual(270) // west
  // Quadrant 4 (NW): x-negative, y-positive
  expect(T.azimuthOf(-10, 0)).toEqual(270) // west counter-clockwise from east
  expect(T.azimuthOf(-10, 10)).toEqual(315) // north-west counter-clockwise from east
  expect(T.azimuthOf(-0, 10)).toEqual(0) // north-west counter-clockwise from east
})
