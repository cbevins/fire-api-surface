import { MeshSegment } from './MeshSegment.js'

test('1: MeshSegment constructor and accessors', () => {
  const segment = new MeshSegment(1, 10, 4)
  expect(segment.begins()).toEqual(1)
  expect(segment.ends()).toEqual(10)
  expect(segment.value()).toEqual(4)
})

test('2: MeshSegment.connects()', () => {
  // If end of one is beginning of another, then perfectly connects
  expect(new MeshSegment(0, 10).connects(new MeshSegment(10, 20))).toEqual(true)
  expect(new MeshSegment(10, 20).connects(new MeshSegment(0, 10))).toEqual(true)
  expect(new MeshSegment(10, 10).connects(new MeshSegment(10, 10))).toEqual(true)
  // If end of one if before start of another; then unconnected
  expect(new MeshSegment(0, 10).connects(new MeshSegment(11, 20))).toEqual(false)
  expect(new MeshSegment(11, 20).connects(new MeshSegment(0, 10))).toEqual(false)
  // If overlapping, then unconnected
  expect(new MeshSegment(0, 10).connects(new MeshSegment(9, 20))).toEqual(false)
  expect(new MeshSegment(9, 20).connects(new MeshSegment(0, 10))).toEqual(false)
  // If one covers another, then unconnected
  expect(new MeshSegment(0, 10).connects(new MeshSegment(5, 6))).toEqual(false)
  expect(new MeshSegment(5, 6).connects(new MeshSegment(0, 10))).toEqual(false)
})

test('3: MeshSegment.overlaps', () => {
  // If end of start is beginning of another, then no overlap
  expect(new MeshSegment(0, 10).overlapsWith(new MeshSegment(20, 30))).toEqual(false)
  expect(new MeshSegment(20, 30).overlapsWith(new MeshSegment(0, 10))).toEqual(false)
  // If connected, then no overlapped
  expect(new MeshSegment(0, 10).overlapsWith(new MeshSegment(10, 20))).toEqual(false)
  expect(new MeshSegment(10, 20).overlapsWith(new MeshSegment(0, 10))).toEqual(false)
  // If start or end of one is within range of another, then overlapped
  expect(new MeshSegment(0, 10).overlapsWith(new MeshSegment(5, 15))).toEqual(true)
  expect(new MeshSegment(5, 15).overlapsWith(new MeshSegment(0, 10))).toEqual(true)
  expect(new MeshSegment(0, 15).overlapsWith(new MeshSegment(5, 15))).toEqual(true)
  expect(new MeshSegment(5, 15).overlapsWith(new MeshSegment(0, 15))).toEqual(true)
  expect(new MeshSegment(0, 10).overlapsWith(new MeshSegment(0, 15))).toEqual(true)
  expect(new MeshSegment(0, 15).overlapsWith(new MeshSegment(0, 10))).toEqual(true)
  // If one fully covers (or is fully covered by) another, then overlapped
  expect(new MeshSegment(0, 30).overlapsWith(new MeshSegment(10, 20))).toEqual(true)
  expect(new MeshSegment(0, 20).overlapsWith(new MeshSegment(10, 20))).toEqual(true)
  expect(new MeshSegment(10, 40).overlapsWith(new MeshSegment(10, 20))).toEqual(true)
  expect(new MeshSegment(10, 20).overlapsWith(new MeshSegment(10, 20))).toEqual(true)
  expect(new MeshSegment(10, 20).overlapsWith(new MeshSegment(0, 30))).toEqual(true)
  expect(new MeshSegment(10, 20).overlapsWith(new MeshSegment(0, 20))).toEqual(true)
  expect(new MeshSegment(10, 20).overlapsWith(new MeshSegment(10, 40))).toEqual(true)
})
