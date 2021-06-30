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

test('2: FireIgnitionGrid fire behavior simulator', () => {
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
})
