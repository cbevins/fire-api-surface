/* eslint-disable jest/prefer-to-have-length */
import { FireLandscape, Burned, Unburned, Edge } from './FireLandscape.js'

test('1: FireLandscape constructor', () => {
  const width = 4000
  const height = 5000
  const spacing = 10
  const timeRes = 2
  const grid = new FireLandscape(width, height, spacing, timeRes)
  expect(grid instanceof FireLandscape).toEqual(true)
  expect(grid.sceneWidth()).toEqual(width)
  expect(grid.sceneHeight()).toEqual(height)
  expect(grid.scanSpacing()).toEqual(10)
  expect(grid.timeRes()).toEqual(2)
  expect(grid.hLines().length).toEqual(501)
  expect(grid.vLines().length).toEqual(401)
})

test('2: FireLandscape scanLines', () => {
  const width = 4000
  const height = 5000
  const spacing = 1
  const timeRes = 1
  const grid = new FireLandscape(width, height, spacing, timeRes)

  // Start with a single Unburned scanLine segment
  let dup = grid.hLines()[2000]
  expect(dup.at).toEqual(2000)
  expect(dup.segments.length).toEqual(2)
  expect(dup.segments[0]).toEqual({ starts: 0, status: Unburned })
  expect(dup.segments[1]).toEqual({ starts: 4000, status: Edge })

  // The fire segment lies entirely within an Unburned scanLine segment
  // Should replace the segment with an Unburned, a Burned, and another Unburned
  dup = grid.updateScanlineWithFire(1000, 2000, dup)
  expect(dup.segments.length).toEqual(4)
  expect(dup.segments[0]).toEqual({ starts: 0, status: Unburned })
  expect(dup.segments[1]).toEqual({ starts: 1000, status: Burned })
  expect(dup.segments[2]).toEqual({ starts: 2000, status: Unburned })
  expect(dup.segments[3]).toEqual({ starts: 4000, status: Edge })

  // The fire segment lies entirely within an Burned scanLine segment
  // Should be no changes
  dup = grid.updateScanlineWithFire(1500, 1600, dup)
  expect(dup.segments.length).toEqual(4)
  expect(dup.segments[0]).toEqual({ starts: 0, status: Unburned })
  expect(dup.segments[1]).toEqual({ starts: 1000, status: Burned })
  expect(dup.segments[2]).toEqual({ starts: 2000, status: Unburned })
  expect(dup.segments[3]).toEqual({ starts: 4000, status: Edge })

  // The fire segment starts within an Unburned and ends within a Burned scanLine segment
  // Should start the Burned segment sooner without adding any segments
  dup = grid.updateScanlineWithFire(500, 1500, dup)
  expect(dup.segments.length).toEqual(4)
  expect(dup.segments[0]).toEqual({ starts: 0, status: Unburned })
  expect(dup.segments[1]).toEqual({ starts: 500, status: Burned })
  expect(dup.segments[2]).toEqual({ starts: 2000, status: Unburned })
  expect(dup.segments[3]).toEqual({ starts: 4000, status: Edge })

  // The fire segment starts within a Burned and ends within an Unburned scanline segment
  // The Unburned sgement should start later without adding any segments
  dup = grid.updateScanlineWithFire(1500, 2500, dup)
  expect(dup.segments.length).toEqual(4)
  expect(dup.segments[0]).toEqual({ starts: 0, status: Unburned })
  expect(dup.segments[1]).toEqual({ starts: 500, status: Burned })
  expect(dup.segments[2]).toEqual({ starts: 2500, status: Unburned })
  expect(dup.segments[3]).toEqual({ starts: 4000, status: Edge })

  // Start a second fire run
  // Should add 2 more segments
  dup = grid.updateScanlineWithFire(3000, 3500, dup)
  expect(dup.segments.length).toEqual(6)
  expect(dup.segments[0]).toEqual({ starts: 0, status: Unburned })
  expect(dup.segments[1]).toEqual({ starts: 500, status: Burned })
  expect(dup.segments[2]).toEqual({ starts: 2500, status: Unburned })
  expect(dup.segments[3]).toEqual({ starts: 3000, status: Burned })
  expect(dup.segments[4]).toEqual({ starts: 3500, status: Unburned })
  expect(dup.segments[5]).toEqual({ starts: 4000, status: Edge })

  // Fire over entire scanline
  // SHould end up with just Unburned and Edge segments
  dup = grid.updateScanlineWithFire(-9999, 99999, dup)
  expect(dup.segments.length).toEqual(2)
  expect(dup.segments[0]).toEqual({ starts: 0, status: Burned })
  expect(dup.segments[1]).toEqual({ starts: 4000, status: Edge })
})
