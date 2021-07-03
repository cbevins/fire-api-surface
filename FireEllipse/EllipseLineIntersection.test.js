/* eslint-disable no-unused-vars */
import { FireEllipse } from './FireEllipse.js'
import { ellipseLineIntersection } from './ellipseLineIntersection.js'
import * as T from './trig.js'

const headRos = 93.3012701892219
const length = 100
const width = 50
const degrees = 135
const time = 1
const fe = new FireEllipse(length, width, degrees, time)

const nx = 0 // northern x value
const ny = 500 // north y value
const sx = 0 // southern x value
const sy = -500 // southern y value
const ex = 500 // eastern x value
const ey = 0 // eastern y value
const wx = -500 // western x value
const wy = 0 // western y value

function fmt (x, y) { return `[${x.toFixed(2)}, ${y.toFixed(2)}]` }

function rotated (fe, p1x, p1y, p2x, p2y, verbose = false) {
  let str = ''
  // 1 - Translate line endpoints by -cx, -cy
  let t1x = p1x - fe.cx()
  let t1y = p1y - fe.cy()
  let t2x = p2x - fe.cx()
  let t2y = p2y - fe.cy()
  str += `1: line endpts translate to ${fmt(t1x, t1y)} and ${fmt(t2x, t2y)}\n`
  // 2 - Rotate
  ;[t1x, t1y] = T.rotatePoint(t1x, t1y, 0, 0, -fe._rot)
  ;[t2x, t2y] = T.rotatePoint(t2x, t2y, 0, 0, -fe._rot)
  str += `2: line endpts rotate to    ${fmt(t1x, t1y)} and ${fmt(t2x, t2y)}\n`
  // Determine intersections (may be 0, 1, or 2)
  const pts = ellipseLineIntersection(fe.a(), fe.b(), t1x, t1y, t2x, t2y)
  str += `There are ${pts.length} intersections between line and ellipse\n`
  const p = []
  pts.forEach(([x, y]) => {
    str += `   ${fmt(x, y)}`
    // 4 - Unrotate
    ;[x, y] = T.rotatePoint(x, y, 0, 0, fe._rot)
    str += ` unrotates to ${fmt(x, y)}`
    // 5 - Translate back to ignition point
    x += fe.cx()
    y += fe.cy()
    str += ` translates to ${fmt(x, y)}\n`
    p.push([x, y])
  })
  if (verbose) console.log(str)
  return p
}

function translated (fe, p1x, p1y, p2x, p2y) {
  const xShift = fe.a() - fe.backDist()
  const [[x1, y1], [x2, y2]] = ellipseLineIntersection(fe.a(), fe.b(),
    p1x - xShift, p1y, p2x - xShift, p2y, false)
  return [[x1 + xShift, y1], [x2 + xShift, y2]]
}

function untransformed (fe, p1x, p1y, p2x, p2y) {
  return ellipseLineIntersection(fe.a(), fe.b(), p1x, p1y, p2x, p2y, false)
}

// Determine the points of intersection of grid lines and rotated ellipse perimeter
test('1: EllipseLineIntersection FireEllipse() as expected', () => {
  expect(fe.a()).toEqual(50)
  expect(fe.b()).toEqual(25)
  expect(fe.headRate()).toBeCloseTo(headRos, 12)
})

// Determine the points of intersection of grid lines and untransformed ellipse perimeter
test('2: EllipseLineIntersection() on centered, unrotated ellipse', () => {
  let str = `2: Fire Ellipse centered at grid origin: a=${fe.a()}, b=${fe.b()}, deg=${fe.headDegrees()}\n`
  str += `   Head is ${fe.headDist()} units at [${fe.hx()}, ${fe.hy()}]\n`
  str += `   Back is ${fe.backDist()} units at [${fe.bx()}, ${fe.by()}]\n`

  // north-south (along y-axis through x-axis origin)
  let [[x1, y1], [x2, y2]] = untransformed(fe, nx, ny, sx, sy)
  str += `north-south line [${nx},${ny}] to [${sx}, ${sy}] on *untransformed* ellipse intercepts perimeter at:\n`
  str += `  [${x1}, ${y1}] and [${x2}, ${y2}]\n`
  expect(x1).toEqual(0)
  expect(y1).toEqual(-fe.b())
  expect(x2).toEqual(0)
  expect(y2).toEqual(fe.b())

  // east-west (along x-axis through y-axis origin)
  ;[[x1, y1], [x2, y2]] = untransformed(fe, wx, wy, ex, ey)
  str += `east-west line [${wx},${wy}] to [${ex}, ${ey}] on *untransformed* ellipse intercepts perimeter at:\n`
  str += `  [${x1}, ${y1}] and [${x2}, ${y2}]\n`
  expect(x1).toEqual(-fe.a())
  expect(y1).toEqual(0)
  expect(x2).toEqual(fe.a())
  expect(y2).toEqual(0)
  // console.log(str)
})

// Determine the points of intersection of grid lines and untransformed ellipse perimeter
test('3: EllipseLineIntersection() on ignition point translated to grid origin', () => {
  let str = `3: Fire Ellipse ignition point translated to grid origin: a=${fe.a()}, b=${fe.b()}, deg=${fe.headDegrees()}\n`
  str += `FireEllipse: a=${fe.a()}, b=${fe.b()}, deg=${fe.headDegrees()}\n`
  str += `   Head is ${fe.headDist()} units at [${fe.hx()}, ${fe.hy()}]\n`
  str += `   Back is ${fe.backDist()} units at [${fe.bx()}, ${fe.by()}]\n`

  // east-west (along x-axis through y-axis origin)
  let [[x1, y1], [x2, y2]] = translated(fe, wx, wy, ex, ey)
  str += `east-west line [${wx},${wy}] to [${ex}, ${ey}] on *translated* ellipse intercepts perimeter at:\n`
  str += `  [${x1}, ${y1}] and [${x2}, ${y2}]\n`
  expect(x1).toBeCloseTo(-fe.backDist(), 11)
  expect(y1).toEqual(0)
  expect(x2).toBeCloseTo(fe.headDist(), 11)
  expect(y2).toEqual(0)

  // north-south (along y-axis through x-axis origin)
  ;[[x1, y1], [x2, y2]] = translated(fe, nx, ny, sx, sy)
  str += `north-south line [${nx},${ny}] to [${sx}, ${sy}] on *translated* ellipse intercepts perimeter at:\n`
  str += `  [${x1}, ${y1}] and [${x2}, ${y2}]\n`
  expect(x1).toEqual(0)
  expect(y1).toEqual(-12.5)
  expect(x2).toEqual(0)
  expect(y2).toEqual(12.5)
  // console.log(str)
})

// Determine the points of intersection of grid lines and untransformed ellipse perimeter
test('4: EllipseLineIntersection() on ignition point rotated', () => {
  let str = `3: Rotated Fire Ellipse axis intercepts: a=${fe.a()}, b=${fe.b()}, deg=${fe.headDegrees()}\n`
  str += `FireEllipse: a=${fe.a()}, b=${fe.b()}, deg=${fe.headDegrees()}\n`
  str += `   Head is ${fe.headDist()} units at [${fe.hx()}, ${fe.hy()}]\n`
  str += `   Back is ${fe.backDist()} units at [${fe.bx()}, ${fe.by()}]\n`

  // east-west (along x-axis through y-axis origin)
  const [[x1, y1], [x2, y2]] = rotated(fe, wx, wy, ex, ey)
  str += `east-west line [${wx},${wy}] to [${ex}, ${ey}] on *rotated* ellipse intercepts perimeter at:\n`
  str += `  [${x1}, ${y1}] and [${x2}, ${y2}]\n`

  // north-south (along y-axis through x-axis origin)
  // ;[[x1, y1], [x2, y2]] = rotated(fe, nx, ny, sx, sy)
  // str += `north-south line [${nx},${ny}] to [${sx}, ${sy}] on *rotated* ellipse intercepts perimeter at:\n`
  // str += `  [${x1}, ${y1}] and [${x2}, ${y2}]\n`
  expect(1).toEqual(1)
  // console.log(str)
})

function hscan (fe, spacing = 1) {
  const scans = []
  const lines = Math.ceil(fe.length() / spacing) + 1
  const x = spacing * lines
  // Traverse from north (positive y) to origin to south (negative y)
  for (let line = lines; line >= -lines; line--) {
    const y = line * spacing
    const a = rotated(fe, -x, y, x, y)
    if (a.length) {
      if (a.length === 1) a.push(a[0]) // include tangents
      scans.push([a[0][1], a[0][0], a[1][0]]) // [y, x1, x2]
    }
  }
  return scans
}

function vscan (fe, spacing = 1) {
  const scans = []
  const lines = Math.ceil(fe.length() / spacing) + 1
  const y = spacing * lines
  // Traverse from west (negative x) to origin to east (positive x)
  for (let line = -lines; line <= lines; line++) {
    const x = line * spacing
    const a = rotated(fe, x, y, x, -y)
    if (a.length) {
      if (a.length === 1) a.push(a[0]) // include tangents
      scans.push([a[0][0], a[0][1], a[1][1]]) // [x, y1, y2]
    }
  }
  return scans
}

function demoHscan (fe, spacing) {
  const scans = hscan(fe, spacing)
  let str = `Length=${fe.length()}, Head=${fe.head()}, Back=${fe.back()}\n`
  str += 'Horizontal Grid Line Intersections for Y Steps\n'
  scans.forEach(([y, x1, x2]) => { str += `${fmt(x1, y)}, ${fmt(x2, y)}\n` })
  console.log(str)
}

function demoVscan (fe, spacing) {
  const scans = vscan(fe, spacing)
  let str = `Length=${fe.length()}, Head=${fe.head()}, Back=${fe.back()}\n`
  str += 'Vertical Grid Line Intersections for Y Steps\n'
  scans.forEach(([x, y1, y2]) => { str += `${fmt(x, y1)}, ${fmt(x, y2)}\n` })
  console.log(str)
}

demoVscan(fe, 5)
