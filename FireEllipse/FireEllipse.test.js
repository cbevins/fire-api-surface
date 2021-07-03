import { FireEllipse, createFireEllipse } from './FireEllipse.js'
import * as T from './trig.js'

const headRos = 93.3012701892219
const length = 100
const width = 50
const degrees = 135
const time = 1
const fe1 = new FireEllipse(length, width, degrees, time)
const fe2 = createFireEllipse(headRos, length / width, degrees, time)

function fmt (v, w, d) { return (v.toFixed(d)).padStart(w, ' ') }

test('1: FireEllipse ctors', () => {
  expect(fe1.headDist()).toBeCloseTo(fe2.headDist(), 12)
  expect(fe1.headRate()).toBeCloseTo(fe2.headRate(), 12)
  expect(fe1.backDist()).toBeCloseTo(fe2.backDist(), 12)
  expect(fe1.backRate()).toBeCloseTo(fe2.backRate(), 12)
  expect(fe1.flankDist()).toBeCloseTo(fe2.flankDist(), 12)
  expect(fe1.flankRate()).toBeCloseTo(fe2.flankRate(), 12)
  expect(fe1.headDegrees()).toBeCloseTo(fe2.headDegrees(), 12)
  expect(fe1.headRadians()).toBeCloseTo(fe2.headRadians(), 12)
  expect(fe1.length()).toBeCloseTo(fe2.length(), 12)
  expect(fe1.width()).toBeCloseTo(fe2.width(), 12)
  expect(fe1.lwr()).toBeCloseTo(fe2.lwr(), 12)
  expect(fe1.a()).toBeCloseTo(fe2.a(), 12)
  expect(fe1.b()).toBeCloseTo(fe2.b(), 12)
  expect(fe1.c()).toBeCloseTo(fe2.c(), 12)
  expect(fe1.e()).toBeCloseTo(fe2.e(), 12)
  expect(fe1.g()).toBeCloseTo(fe2.g(), 12)
  expect(fe1.ix()).toBeCloseTo(fe2.ix(), 12)
  expect(fe1.iy()).toBeCloseTo(fe2.iy(), 12)
  expect(fe1.cx()).toBeCloseTo(fe2.cx(), 12)
  expect(fe1.cy()).toBeCloseTo(fe2.cy(), 12)
  expect(fe1.hx()).toBeCloseTo(fe2.hx(), 12)
  expect(fe1.hy()).toBeCloseTo(fe2.hy(), 12)
  const [p1x, p1y] = fe1.perimeterPointAt(0 * Math.PI / 180)
  const [p2x, p2y] = fe2.perimeterPointAt(0 * Math.PI / 180)
  expect(p1x).toBeCloseTo(p2x, 12)
  expect(p1y).toBeCloseTo(p2y, 12)
})

test('2: FireEllipse.betaDegreesToPoint()', () => {
  // console.log('head deg', fe1.headDegrees(), 'at [x,y]', fe1.head())
  // From fire head at 135 to north at 0
  expect(fe1.betaDegreesToPoint(0, 10)).toBeCloseTo(225, 12)
  // From fire head at 135 to north-east at 45
  expect(fe1.betaDegreesToPoint(10, 10)).toBeCloseTo(270, 12)
  // From fire head at 135 to east at 90
  expect(fe1.betaDegreesToPoint(10, 0)).toBeCloseTo(315, 12)
  // From fire head at 135 to south-east at 135
  expect(fe1.betaDegreesToPoint(10, -10)).toBeCloseTo(0, 12)
  // From fire head at 135 to south at 180
  expect(fe1.betaDegreesToPoint(0, -10)).toBeCloseTo(45, 12)
  // From fire head at 135 to south-west at 225
  expect(fe1.betaDegreesToPoint(-10, -10)).toBeCloseTo(90, 12)
  // From fire head at 135 to west at 270
  expect(fe1.betaDegreesToPoint(-10, 0)).toBeCloseTo(135, 12)
  // From fire head at 135 to north-west at 315
  expect(fe1.betaDegreesToPoint(-10, 10)).toBeCloseTo(180, 12)
})

test('3: FireEllipse.betaRatioToPoint()', () => {
  expect(fe1.betaRatioToPoint(10, -10)).toEqual(1) // head is 135
  expect(fe1.betaRatioToPoint(-10, 10)).toBeCloseTo(fe1.backDist() / fe1.headDist(), 12) // head is 135
})

test('4: FireEllipse.containsPoint()', () => {
  // Start with a FireEllipse aligned with x-axis
  const fe90 = new FireEllipse(length, width, 90, time)
  const head = 93.30127018922192
  const back = 6.698729810778069

  // Rotation between FireEllipse and x-axis
  expect(fe90.headDist()).toEqual(head)
  expect(fe90.backDist()).toEqual(back)
  let rot = 0
  expect(fe90._rot).toEqual(rot)
  // Center point rotation
  let cx = T.cos(rot) * (50 - back)
  let cy = T.sin(rot) * (50 - back)
  expect(fe90.cx()).toEqual(50 - back)
  expect(fe90.cx()).toEqual(cx)
  expect(fe90.cy()).toEqual(0)
  expect(fe90.cy()).toEqual(cy)
  // Head rotation
  let hx = T.cos(rot) * head
  let hy = T.sin(rot) * head
  expect(fe90.hx()).toEqual(head)
  expect(fe90.hx()).toEqual(hx)
  expect(fe90.hy()).toEqual(0)
  expect(fe90.hy()).toEqual(hy)
  expect(fe90.containsPoint(0, 0)).toEqual(true)
  expect(fe90.containsPoint(head, 0)).toEqual(true)
  expect(fe90.containsPoint(-back, 0)).toEqual(true)
  expect(fe90.containsPoint(0, head)).toEqual(false)
  expect(fe90.containsPoint(head + 1, 0)).toEqual(false)
  expect(fe90.containsPoint(-back - 1, 0)).toEqual(false)

  expect(T.caz2rot(fe1.headDegrees())).toEqual(315) // head at 135 is rot -45 or 315
  rot = 315 * T.pi() / 180
  expect(fe1._rot).toEqual(rot)

  cx = T.cos(rot) * (50 - back)
  cy = T.sin(rot) * (50 - back)
  expect(fe1.cx()).toBeCloseTo(cx)
  expect(fe1.cx()).toBeCloseTo(30.618621784789717, 12)
  expect(fe1.cy()).toBeCloseTo(cy)
  expect(fe1.cy()).toBeCloseTo(-30.618621784789717, 12)

  hx = T.cos(rot) * head
  hy = T.sin(rot) * head
  expect(hx).toBeCloseTo(65.97396084411709, 12)
  expect(hy).toBeCloseTo(-65.97396084411712, 12)
  expect(fe1.hx()).toEqual(hx)
  expect(fe1.hy()).toEqual(hy)

  const bx = T.cos(rot) * back
  const by = T.sin(rot) * back
  expect(bx).toBeCloseTo(4.73671727453765, 12)
  expect(by).toBeCloseTo(-4.73671727453765, 12)

  expect(fe1.containsPoint(0, 0)).toEqual(true)
  expect(fe1.containsPoint(hx, hy)).toEqual(true)
  expect(fe1.containsPoint(0, 100)).toEqual(false)
  expect(fe1.containsPoint(0, -100)).toEqual(false)
  expect(fe1.containsPoint(100, 0)).toEqual(false)
  expect(fe1.containsPoint(-100, 0)).toEqual(false)

  expect(fe1.containsPoint(65, -65)).toEqual(true)
  expect(fe1.containsPoint(-65, -65)).toEqual(false)
  expect(fe1.containsPoint(65, 65)).toEqual(false)
  expect(fe1.containsPoint(-65, -65)).toEqual(false)
})

test('5: FireEllipse beta<Degrees|Radians|Ratio|Dist>ToPoint()', () => {
  expect(fe1.betaDegreesToPoint(fe1.hx(), fe1.hy())).toEqual(0)
  expect(fe1.betaRadiansToPoint(fe1.hx(), fe1.hy())).toEqual(0)
  expect(fe1.betaRatioToPoint(fe1.hx(), fe1.hy())).toEqual(1)
  expect(fe1.betaDistToPerim(0)).toEqual(fe1.headDist())
  expect(fe1.betaDistToPerim(Math.PI)).toBeCloseTo(fe1.backDist(), 12)
})

test('6: FireEllipse betaDistToPerim()', () => {
  // We can get distance from ignition point to perimeter through any grid point as follows
  const toHead = fe1.betaRadiansToPoint(10, -10) // heading is 135
  expect(fe1.betaDistToPerim(toHead)).toEqual(fe1.headDist())
  const toBack = fe1.betaRadiansToPoint(-10, 10) // backing is 315
  expect(fe1.betaDistToPerim(toBack)).toBeCloseTo(fe1.backDist(), 12)
})

test('7: FireEllipse betaTimeToPoint()', () => {
  const hx = 65.97396084411709
  const hy = -65.97396084411712
  expect(fe1.betaDegreesToPoint(hx, hy)).toEqual(0)
  expect(fe1.betaDegreesToPoint(10, -10)).toEqual(0) // se
  expect(fe1.betaDegreesToPoint(0, -10)).toEqual(45) // s
  expect(fe1.betaDegreesToPoint(-10, -10)).toEqual(90) // sw
  expect(fe1.betaDegreesToPoint(-10, 0)).toEqual(135) // w
  expect(fe1.betaDegreesToPoint(-10, 10)).toEqual(180) // nw
  expect(fe1.betaDegreesToPoint(0, 10)).toEqual(225) // n
  expect(fe1.betaDegreesToPoint(10, 10)).toEqual(270) // nw
  expect(fe1.betaDegreesToPoint(10, 0)).toEqual(315) // e
  expect(fe1.betaRatioToPoint(hx, hy)).toEqual(1)
  expect(fe1.betaTimeToPoint(hx, hy)).toEqual(1)

  const bx = -4.73671727453765
  const by = 4.73671727453765
  expect(fe1.betaDegreesToPoint(bx, by)).toBeCloseTo(180, 12)
  expect(fe1.betaRatioToPoint(bx, by)).toBeCloseTo(0.07179676972449, 12)
  expect(fe1.betaTimeToPoint(bx, by)).toBeCloseTo(1, 12)
})

// Creates a minimum bounding grid of fire ellipse 'inside' props
test('8: fire ellipse ignition time template', () => {
  const fe = new FireEllipse(length, width, degrees, time)
  const [hx, hy] = fe.head()
  const [bx, by] = fe.back()
  expect(hx).toBeCloseTo(65.97396084411709, 12)
  expect(hy).toBeCloseTo(-65.97396084411712, 12)
  expect(bx).toBeCloseTo(-4.73671727453765, 12)
  expect(by).toBeCloseTo(4.73671727453765, 12)

  // Ensure the template extends 1 spacing beyond time step
  const xmax = Math.max(hx, bx)
  const xmin = Math.min(hx, bx)
  const ymax = Math.max(hy, by)
  const ymin = Math.min(hy, by)
  const left = Math.floor(xmin) - 1
  const right = Math.ceil(xmax) + 1
  const top = Math.ceil(ymax) + 1
  const bottom = Math.floor(ymin) - 1
  expect(left).toEqual(-6)
  expect(right).toEqual(67)
  expect(top).toEqual(6)
  expect(bottom).toEqual(-67)

  const rows = right - left + 1
  const cols = top - bottom + 1
  expect(cols).toEqual(6 + 67 + 1)
  expect(rows).toEqual(6 + 67 + 1)

  // returns ignition array col index relative to the ignition col
  function itCol (col) { return (col - left) }
  // returns ignition array row index relative to the ignition row
  function itRow (row) { return (top - row) }
  // returns ignition array index for [row,col] relative to the ignition point
  function itIdx (col, row) { return itCol(col) + itRow(row) * cols }

  // Find where the ignition point is stored in the template array
  expect(itCol(0)).toEqual(6)
  expect(itRow(0)).toEqual(6)
  expect(itIdx(0, 0)).toEqual(450)
  // Find where the top-left corner point is stored
  expect(itCol(-6)).toEqual(0)
  expect(itRow(6)).toEqual(0)
  expect(itIdx(-6, 6)).toEqual(0)
  // Find where the bottom right corner point is stored
  expect(itCol(67)).toEqual(73)
  expect(itRow(-67)).toEqual(73)
  expect(itIdx(67, -67)).toEqual(74 * 74 - 1)
})

function demoListBeta () {
  let str = 'When Head at 0 Degrees (north)\nDeg  Radians  Ratio Distance    Rate\n'
  for (let deg = 0; deg <= 360; deg += 15) {
    const rad = deg * Math.PI / 180
    const ratio = fe1.betaRatio(rad)
    const dist = fe1.betaDistToPerim(rad)
    const rate = fe1.betaRate(rad)
    str += `${fmt(deg, 3, 0)} ${fmt(rad, 8, 4)} ${fmt(ratio, 6, 4)} ${fmt(dist, 8, 4)} ${fmt(rate, 8, 4)}\n`
  }
  console.log(str)

  str = 'When Head at 135 Degrees (south-east)\nDeg  Radians  Ratio Distance    Rate      X      Y\n'
  for (let deg = 0; deg <= 360; deg += 15) {
    const rad = (fe1.headDegrees() - deg) * Math.PI / 180
    const ratio = fe1.betaRatio(rad)
    const dist = fe1.betaDistToPerim(rad)
    const rate = fe1.betaRate(rad)

    const x = dist * T.cos(fe1._rot)
    const y = dist * T.sin(fe1._rot)
    str += `${fmt(deg, 3, 0)} ${fmt(rad, 8, 4)} ${fmt(ratio, 6, 4)} ${fmt(dist, 8, 4)} ${fmt(rate, 8, 4)} ${fmt(x, 8, 4)}, ${fmt(y, 8, 4)}\n`
  }
  console.log(str)
  console.log('head at', fe1.head(), 'back at', fe1.back())
}

function demoPlotFireEllipse () {
  const spacing = 5
  const dmax = Math.ceil(fe1.headDist() / spacing)
  const dmin = -Math.floor(-fe1.backDist() / spacing)
  console.log('dmax', dmax, 'dmin', dmin)
  let str = ''
  for (let row = dmax; row >= -dmax; row--) {
    const y = row * spacing
    str += `\n${y.toFixed(0).padStart(4)}: `
    for (let col = -dmax; col <= dmax; col++) {
      const x = col * spacing
      str += (fe1.containsPoint(x, y)) ? '++' : '--'
    }
  }
  console.log(str)
}

demoListBeta()
