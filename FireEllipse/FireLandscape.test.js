/* eslint-disable jest/prefer-to-have-length */
import { FireLandscape, Burned, Unburned, Edge } from './FireLandscape.js'
import { FireWavelet } from './FireWavelet.js'

function fmt (x, y) { return `[${x.toFixed(2)}, ${y.toFixed(2)}]` }

test('1: FireLandscape constructor', () => {
  const width = 4000
  const height = 5000
  const spacing = 10
  const timeRes = 2
  const fl = new FireLandscape(width, height, timeRes, spacing)
  expect(fl instanceof FireLandscape).toEqual(true)
  expect(fl.sceneWidth()).toEqual(width)
  expect(fl.sceneHeight()).toEqual(height)
  expect(fl.scanSpacing()).toEqual(10)
  expect(fl.timeRes()).toEqual(2)
  expect(fl.hlines().length).toEqual(501)
  expect(fl.vlines().length).toEqual(401)
})

test('2: FireLandscape scanlines', () => {
  const width = 4000
  const height = 5000
  const spacing = 1
  const timeRes = 1
  const fl = new FireLandscape(width, height, timeRes, spacing)

  // Start with a single Unburned scanline segment
  let scanline = fl.hlines()[2000]
  expect(scanline.at).toEqual(2000)
  expect(scanline.segments.length).toEqual(2)
  expect(scanline.segments[0]).toEqual({ starts: 0, status: Unburned })
  expect(scanline.segments[1]).toEqual({ starts: 4000, status: Edge })
  expect(fl.scanlineFireFronts(scanline)).toEqual([])

  // The fire segment lies entirely within an Unburned scanline segment
  // Should replace the segment with an Unburned, a Burned, and another Unburned
  scanline = fl.updateScanlineWithFire(1000, 2000, scanline)
  expect(scanline.segments.length).toEqual(4)
  expect(scanline.segments[0]).toEqual({ starts: 0, status: Unburned })
  expect(scanline.segments[1]).toEqual({ starts: 1000, status: Burned })
  expect(scanline.segments[2]).toEqual({ starts: 2000, status: Unburned })
  expect(scanline.segments[3]).toEqual({ starts: 4000, status: Edge })
  expect(fl.scanlineFireFronts(scanline)).toEqual([1000, 2000])

  // The fire segment lies entirely within an Burned scanline segment
  // Should be no changes
  scanline = fl.updateScanlineWithFire(1500, 1600, scanline)
  expect(scanline.segments.length).toEqual(4)
  expect(scanline.segments[0]).toEqual({ starts: 0, status: Unburned })
  expect(scanline.segments[1]).toEqual({ starts: 1000, status: Burned })
  expect(scanline.segments[2]).toEqual({ starts: 2000, status: Unburned })
  expect(scanline.segments[3]).toEqual({ starts: 4000, status: Edge })
  expect(fl.scanlineFireFronts(scanline)).toEqual([1000, 2000])

  // The fire segment starts within an Unburned and ends within a Burned scanline segment
  // Should start the Burned segment sooner without adding any segments
  scanline = fl.updateScanlineWithFire(500, 1500, scanline)
  expect(scanline.segments.length).toEqual(4)
  expect(scanline.segments[0]).toEqual({ starts: 0, status: Unburned })
  expect(scanline.segments[1]).toEqual({ starts: 500, status: Burned })
  expect(scanline.segments[2]).toEqual({ starts: 2000, status: Unburned })
  expect(scanline.segments[3]).toEqual({ starts: 4000, status: Edge })
  expect(fl.scanlineFireFronts(scanline)).toEqual([500, 2000])

  // The fire segment starts within a Burned and ends within an Unburned scanline segment
  // The Unburned sgement should start later without adding any segments
  scanline = fl.updateScanlineWithFire(1500, 2500, scanline)
  expect(scanline.segments.length).toEqual(4)
  expect(scanline.segments[0]).toEqual({ starts: 0, status: Unburned })
  expect(scanline.segments[1]).toEqual({ starts: 500, status: Burned })
  expect(scanline.segments[2]).toEqual({ starts: 2500, status: Unburned })
  expect(scanline.segments[3]).toEqual({ starts: 4000, status: Edge })
  expect(fl.scanlineFireFronts(scanline)).toEqual([500, 2500])

  // Start a second fire run
  // Should add 2 more segments
  scanline = fl.updateScanlineWithFire(3000, 3500, scanline)
  expect(scanline.segments.length).toEqual(6)
  expect(scanline.segments[0]).toEqual({ starts: 0, status: Unburned })
  expect(scanline.segments[1]).toEqual({ starts: 500, status: Burned })
  expect(scanline.segments[2]).toEqual({ starts: 2500, status: Unburned })
  expect(scanline.segments[3]).toEqual({ starts: 3000, status: Burned })
  expect(scanline.segments[4]).toEqual({ starts: 3500, status: Unburned })
  expect(scanline.segments[5]).toEqual({ starts: 4000, status: Edge })
  expect(fl.scanlineFireFronts(scanline)).toEqual([500, 2500, 3000, 3500])

  // Fire over entire scanline
  // SHould end up with just Unburned and Edge segments
  scanline = fl.updateScanlineWithFire(-9999, 99999, scanline)
  expect(scanline.segments.length).toEqual(2)
  expect(scanline.segments[0]).toEqual({ starts: 0, status: Burned })
  expect(scanline.segments[1]).toEqual({ starts: 4000, status: Edge })
  expect(fl.scanlineFireFronts(scanline)).toEqual([])
})

test('3: FireLandscape.fireBehaviorAt()', () => {
  const width = 4000
  const height = 5000
  const spacing = 1
  const timeRes = 1
  const fl = new FireLandscape(width, height, timeRes, spacing)

  const fire = fl.fireBehaviorAt(0, 0)
  console.log(fire)
  expect(fire.key).toEqual('124|0.778|0.05|0.07|0.09|0.50|1.50|0.25|135|315|880')
  expect(fire.lwr).toEqual(3.423598931799779)
  expect(fire.backRos).toEqual(1.0358737174389132)
  expect(fire.flankRos).toEqual(6.938175750154048)
  expect(fire.headRos).toEqual(46.47118845629415)
  expect(fire.heading).toEqual(135)
  expect(fire.length).toEqual(47.50706217373306)
  expect(fire.width).toEqual(13.876351500308097)
})

test('4: FireLandscape col() and row()', () => {
  const width = 4000
  const height = 5000
  const spacing = 5
  const timeRes = 1
  const fl = new FireLandscape(width, height, timeRes, spacing)
  expect(fl.hlines().length).toEqual(1 + height / 5)
  expect(fl.col(0)).toEqual(0)
  expect(fl.col(-999999)).toEqual(0)
  expect(fl.col(2000)).toEqual(2000 / 5)
  expect(fl.col(4000)).toEqual(4000 / 5)
  expect(fl.col(999999)).toEqual(4000 / 5)
})

test('5: FireLandscape FireWavelet', () => {
  const width = 4000
  const height = 5000
  const spacing = 5
  const timeRes = 1
  const fl = new FireLandscape(width, height, timeRes, spacing)

  const fwLength = 100
  const fwWidth = 50
  const fwDegrees = 135
  const verbose = false
  const fw = new FireWavelet(fwLength, fwWidth, fwDegrees, timeRes, spacing, verbose)
  expect(fw.a()).toEqual(50)
  expect(fw.b()).toEqual(25)
  expect(fw.headRate()).toBeCloseTo(93.3012701892219, 12)
  expect(fw.hOrigin()).toEqual(1)
  expect(fw.vOrigin()).toEqual(1)

  // Set an ignition point
  const ix = 2000
  const iy = 2500
  // let str = 'yFw yFl yIdx\n'
  fw.hlines().forEach(([ypos, x1, x2]) => {
    const idx = fl.row(iy + ypos)
    expect(idx).toEqual(Math.ceil(ypos + iy) / spacing)
    let scanline = fl.hline(idx)
    expect(scanline.segments.length).toEqual(2)
    scanline = fl.updateScanlineWithFire(x1 + ix, x2 + ix, scanline)
    console.log(scanline.segments)
    expect(scanline.segments.length).toEqual(4) // Unburned, Burned, Unburned, Edge
    // str += `${Math.trunc(ypos)} ${Math.trunc(ypos + iy)} ${idx}\n`
  })
  // console.log(str)

  // let str = 'xFw xFl xIdx\n'
  // fw.vlines().forEach(([xpos, y1, y2]) => {
  //   const idx = fl.col(ix + xpos)
  //   expect(idx).toEqual(Math.ceil(xpos + ix) / spacing)
  //   let scanline = fl.vline(idx)
  //   expect(scanline.segments.length).toEqual(2)
  //   scanline = fl.updateScanlineWithFire(y1+iy, y2+iy, scanline)
  //   str += `${Math.trunc(xpos)} ${Math.trunc(xpos + ix)} ${idx}\n`
  // })
  // console.log(str)
})
