/* eslint-disable jest/prefer-to-have-length */
import { FireIgnitionGrid } from './FireIgnitionGrid.js'
import { FireEllipse } from './FireEllipse.js'

test('1: FireIgnitionGrid constructor', () => {
  const grid = new FireIgnitionGrid(10, 8, 10)
  expect(grid instanceof FireIgnitionGrid).toEqual(true)
  expect(grid.cols()).toEqual(10)
  expect(grid.rows()).toEqual(8)
  expect(grid.spacing()).toEqual(10)
})

test('2: FireIgnitionGrid point indices', () => {
  const grid = new FireIgnitionGrid(10, 8, 10)
  expect(grid.colOf(45)).toEqual(5)
  expect(grid.colOf(49)).toEqual(9)
  expect(grid.colOf(50)).toEqual(0)
  expect(grid.rowOf(5)).toEqual(0)
  expect(grid.rowOf(15)).toEqual(1)
  expect(grid.rowOf(45)).toEqual(4)
  expect(grid.rowOf(49)).toEqual(4)
  expect(grid.rowOf(50)).toEqual(5)
})

test('3: FireIgnitionGrid ignition times', () => {
  const grid = new FireIgnitionGrid(10, 8, 10)
  expect(grid.hasIgnition(45)).toEqual(false)
  expect(grid.hasNoIgnition(45)).toEqual(true)
  grid.ignite(45, 123)
  expect(grid.ignitionTime(45)).toEqual(123)
  expect(grid.hasIgnition(45)).toEqual(true)
  expect(grid.hasNoIgnition(45)).toEqual(false)
})

test('4: FireIgnitionGrid.fireBehaviorAt()', () => {
  const timeStep = 1
  const grid = new FireIgnitionGrid(10, 8, 1, timeStep)
  const fire = grid.fireBehaviorAt(0, 0)
  const fe = new FireEllipse(fire.length, fire.width, fire.heading, timeStep)
  console.log(fire)
  expect(fe.length()).toEqual(fire.length)
  expect(fe.width()).toEqual(fire.width)
  expect(fe.headRate()).toBeCloseTo(fire.headRos, 12)
  expect(fe.backRate()).toBeCloseTo(fire.backRos, 12)
  expect(fe.flankRate()).toBeCloseTo(fire.flankRos, 12)
  expect(fe.headDegrees()).toBeCloseTo(135, 12)
  console.log(fire.headRos)
})

test('5: FireIgnitionGrid.ignitionTemplateAt()', () => {
  const grid = new FireIgnitionGrid(100, 100, 1, 1)
  // Values returned by grid.fireBehaviorAt()
  // const fire = {
  //   key: '124|0.778|0.05|0.07|0.09|0.50|1.50|0.25|135|315|880',
  //   lwr: 3.423598931799779,
  //   backRos: 1.0358737174389132,
  //   flankRos: 6.938175750154048,
  //   headRos: 46.47118845629415,
  //   heading: 135,
  //   length: 47.50706217373306,
  //   width: 13.876351500308097
  // }
  const t = grid.ignitionTemplateAt(0, 0)
  expect(t.cols()).toEqual(37)
  expect(t.rows()).toEqual(37)
  expect(t.top()).toEqual(2)
  expect(t.bottom()).toEqual(-34)
  expect(t.left()).toEqual(-2)
  expect(t.right()).toEqual(34)
  expect(t.itCol(0)).toEqual(2)
  expect(t.itRow(0)).toEqual(2)
  const origin = t.itIdx(0, 0)
  expect(origin).toEqual(2 + 2 * 37)
  expect(t.timeAt(0, 0)).toEqual(0)
  // Fire heading is 135, head ros is 46.47
  const heading = 135 * Math.PI / 180
  const headRos = 46.47118845629415
  // So the expected head x,y are:
  const hx = Math.sin(heading) * headRos
  const hy = Math.cos(heading) * headRos
  expect(hx).toBeCloseTo(32.8600924872436, 12)
  expect(hy).toBeCloseTo(-32.8600924872436, 12)
  expect(t.timeAt(32, -32)).toBeCloseTo(32 / hx) // 0.9783
  expect(t.timeAt(33, -33)).toBeCloseTo(33 / hx) // 1.004257
  expect(t.timeAt(34, -34)).toBeCloseTo(34 / hx) // 1.0346
})
