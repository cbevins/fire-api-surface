/* eslint-disable jest/prefer-to-have-length */
import { FireWavelet } from './FireWavelet.js'

const headRos = 93.3012701892219
const length = 100
const width = 50
const degrees = 135
const time = 1
const spacing = 5
const verbose = false
const fe = new FireWavelet(length, width, degrees, time, spacing, verbose)

function fmt (x, y) { return `[${x.toFixed(2)}, ${y.toFixed(2)}]` }

test('1: FireWavelet() as expected', () => {
  expect(fe.a()).toEqual(50)
  expect(fe.b()).toEqual(25)
  expect(fe.headRate()).toBeCloseTo(headRos, 12)
})

test('2: FireWavelet() horizontal scans', () => {
  const scans = fe.hScans()
  expect(scans.length).toEqual(16)
  let str = 'Horizontal Grid Line Intersections for Y Steps\n'
  scans.forEach(([y, x1, x2]) => { str += `${fmt(x1, y)}, ${fmt(x2, y)}\n` })
  console.log(str)
})

test('3: FireWavelet() vertical scans', () => {
  const scans = fe.vScans()
  expect(scans.length).toEqual(16)
  let str = 'Vertical Grid Line Intersections for Y Steps\n'
  scans.forEach(([x, y1, y2]) => { str += `${fmt(x, y1)}, ${fmt(x, y2)}\n` })
  console.log(str)
})
