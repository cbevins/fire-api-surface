import { FireEllipse, createFireEllipse } from './FireEllipse.js'
import * as T from './trig.js'
import { ellipseLineIntersection } from './ellipseLineIntersection.js'

const headRos = 93.3012701892219
const length = 100
const width = 50
const degrees = 135
const time = 1
const fe1 = new FireEllipse(length, width, degrees, time)
const fe2 = createFireEllipse(headRos, length / width, degrees, time)

function fmt (v, w, d) { return (v.toFixed(d)).padStart(w, ' ') }

test('1: angle()', () => {
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

test('2: FireEllipse ctors', () => {
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

test('3: caz2rot()', () => {
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

function listBeta () {
  let str = 'When Head at 0 Degrees (north)\nDeg  Radians Factor Distance    Rate\n'
  for (let deg = 0; deg <= 360; deg += 15) {
    const rad = deg * Math.PI / 180
    const f = fe1.betaFactor(rad)
    const d = fe1.betaDistToPerim(rad)
    const r = fe1.betaRateToPerim(rad)
    str += `${fmt(deg, 3, 0)} ${fmt(rad, 8, 4)} ${fmt(f, 6, 4)} ${fmt(d, 8, 4)} ${fmt(r, 8, 4)}\n`
  }
  console.log(str)

  str = 'When Head at 135 Degrees (south-east)\nDeg  Radians Factor Distance    Rate\n'
  for (let deg = 0; deg <= 360; deg += 15) {
    const rad = (fe1.headDegrees() - deg) * Math.PI / 180
    const f = fe1.betaFactor(rad)
    const d = fe1.betaDist(rad)
    const r = fe1.betaRate(rad)
    str += `${fmt(deg, 3, 0)} ${fmt(rad, 8, 4)} ${fmt(f, 6, 4)} ${fmt(d, 8, 4)} ${fmt(r, 8, 4)}\n`
  }
  // console.log(str)
  // const p3 = { x: 1, y: 0 }
  // expect('Beta angle to', p3, 'is', fe1.betaAngle(p3) * 180 / Math.PI)
}

test('5: azimuthOf()', () => {
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

test('6: betaDegreesToPoint()', () => {
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

test('7: betaRatioToPoint()', () => {
  expect(fe1.betaRatioToPoint(10, -10)).toEqual(1) // head is 135
  expect(fe1.betaRatioToPoint(-10, 10)).toBeCloseTo(fe1.backDist() / fe1.headDist(), 12) // head is 135
})

test('8: containsPoint()', () => {
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

test('9: perimeterpointAt()', () => {
  expect(fe1.betaDegreesToPoint(fe1.hx(), fe1.hy())).toEqual(0)
  expect(fe1.betaRadiansToPoint(fe1.hx(), fe1.hy())).toEqual(0)
  expect(fe1.betaRatioToPoint(fe1.hx(), fe1.hy())).toEqual(1)
  expect(fe1.betaDistToPerim(0)).toEqual(fe1.headDist())
  expect(fe1.betaDistToPerim(Math.PI)).toBeCloseTo(fe1.backDist(), 12)

  // We can get distance from ignition point to perimeter through any grid point as follows
  const beta = fe1.betaRadiansToPoint(10, -10)
  expect(fe1.betaDistToPerim(beta)).toEqual(fe1.headDist())
})

function plotFireEllipse () {
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

// Creates a minimum bounding grid of fire ellipse 'inside' props
// \TODO Split into a boundary array and a time grid
function template (fe, spacing) {
  const tpl = { rows: [] }
  const dmax = Math.ceil(fe.headDist() / spacing)
  for (let row = dmax; row >= -dmax; row--) {
    const y = row * spacing
    let firstCol = -1
    let lastCol = -1
    for (let col = -dmax; col <= dmax; col++) {
      const x = col * spacing
      if (fe.containsPoint(x, y)) {
        if (firstCol < 0) firstCol = col
        lastCol = col
      }
    }
    if (firstCol >= 0) tpl.rows.push([row, firstCol, lastCol])
  }
  // Now we can repackage this into a template grid
  // First, get the minimum bounding extent
  tpl.row = { first: tpl.rows[0][0], last: tpl.rows[tpl.rows.length - 1][0] }
  tpl.col = { first: 9999999, last: -9999999 }
  tpl.points = { total: 0, inside: 0 }
  tpl.rows.forEach(([row, col0, col1], idx) => {
    tpl.col.first = Math.min(tpl.col.first, col0)
    tpl.col.last = Math.max(tpl.col.last, col1)
  })
  // Create the grid, which for now only has the 'inside' ellipse property
  // but we could add beta factor, distance, and/or time from origin
  tpl.grid = []
  tpl.rows.forEach(([row, col0, col1], rowIdx) => {
    const gridRow = []
    for (let col = tpl.col.first, colIdx = 0; col <= tpl.col.last; col++, colIdx++) {
      const inside = (col >= col0 && col <= col1)
      gridRow.push(inside)
      if (inside) tpl.points.inside++
      if (row === 0 && col === 0) tpl.origin = { row: rowIdx, col: colIdx }
    }
    tpl.grid.push(gridRow)
    tpl.row.n = tpl.rows.length
    tpl.col.n = tpl.col.last - tpl.col.first + 1
    tpl.points.total = tpl.row.n * tpl.col.n
  })
  return tpl
}

// Determine the points of intersection of grid lines and rotated ellipse perimeter
test('10: ellipseLineIntersection() on 100:50 unrotated ellipse', () => {
  expect(fe1.a()).toEqual(50)
  expect(fe1.b()).toEqual(25)

  const nx = 0 // northern x value
  const ny = 500 // north y value
  const sx = 0 // southern x value
  const sy = -500 // southern y value
  const ex = 500 // eastern x value
  const ey = 0 // eastern y value
  const wx = -500 // western x value
  const wy = 0 // western y value

  const ns = ellipseLineIntersection(fe1.a(), fe1.b(), nx, ny, sx, sy, false)
  console.log('north-south untransformed: a=', fe1.a(), 'b=', fe1.b(), 'p=', ns)
  expect(ns[0][0]).toEqual(0)
  expect(ns[0][1]).toEqual(-fe1.b())
  expect(ns[1][0]).toEqual(0)
  expect(ns[1][1]).toEqual(fe1.b())

  // east-west y-origin intersection points on untransformed ellipse
  const ew = ellipseLineIntersection(fe1.a(), fe1.b(), wx, wy, ex, ey, false)
  console.log('east-west *untransformed*: a=', fe1.a(), 'b=', fe1.b(), 'p=', ew)
  expect(ew[0][0]).toEqual(-fe1.a())
  expect(ew[0][1]).toEqual(0)
  expect(ew[1][0]).toEqual(fe1.a())
  expect(ew[1][1]).toEqual(0)

  // east-west y-origin translate east-west
  ew[0][0] += (fe1.a() - fe1.backDist())
  ew[1][0] += (fe1.a() - fe1.backDist())
  console.log('east-west *translated*: a=', fe1.a(), 'b=', fe1.b(), 'p=', ew)
  expect(ew[0][0]).toEqual(-fe1.backDist())
  expect(ew[1][0]).toEqual(fe1.headDist())

  // rotate
  const rew = []
  rew.push(T.rotatePoint(ew[0][0], ew[0][1], 0, 0, -fe1._rot))
  rew.push(T.rotatePoint(ew[1][0], ew[1][1], 0, 0, -fe1._rot))
  console.log('east-west *rotated*: a=', fe1.a(), 'b=', fe1.b(), 'p=', rew)
})
// const tpl = template(fe1, 1)
// console.log('row', tpl.row, 'col', tpl.col, 'origin', tpl.origin, 'points', tpl.points)
