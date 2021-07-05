import { MeshLine } from './Mesh.js'

test('1: MeshLine constructor, pos(), segments()', () => {
  const line = new MeshLine(123)
  expect(line.pos()).toEqual(123)
  expect(line.segments()).toEqual([])
})

test('2: MeshLine.fill(), segments(), segment()', () => {
  const line = new MeshLine(123).fill(456, 789)
  expect(line.pos()).toEqual(123)
  expect(line.segments()).toHaveLength(1)
  expect(line.segment(0).starts()).toEqual(456)
  expect(line.segment(0).value()).toEqual(789)
})

test('3: MeshLine.appendSegment()', () => {
  const line = new MeshLine(123)
  expect(line.segments()).toHaveLength(0)
  expect(line.appendSegment(123, 1).segments()).toHaveLength(1)
  expect(line.appendSegment(456, 2).segments()).toHaveLength(2)
  // Do not append segment if it is a continuation of the previous segment
  expect(line.appendSegment(789, 2).segments()).toHaveLength(2)
  expect(line.appendSegment(111, 3).segments()).toHaveLength(3)
  // fill() resets the MeshLine
  expect(line.fill(999, 4).segments()).toHaveLength(1)
  expect(line.segment(0).starts()).toEqual(999)
  expect(line.segment(0).value()).toEqual(4)
})

test('4: MeshLine.overlay() before first segment with gap', () => {
  const src = new MeshLine(123)
  src.appendSegment(500, 1)
  // Should have a single segment {500, 1}
  expect(src.segments()).toHaveLength(1)
  expect(src.segment(0)).toEqual({ _starts: 500, _value: 1 })

  // Overlay a segment BEFORE this one
  // Should end up {100, 2}, {200, 1}
  const dst = src.overlay(100, 200, 2)
  expect(dst.segments()).toHaveLength(2)
  expect(dst.segment(0)).toEqual({ _starts: 100, _value: 2 })
  expect(dst.segment(1)).toEqual({ _starts: 200, _value: 1 })
})

test('5: MeshLine.overlay() before first segment without gap', () => {
  const src = new MeshLine(123)
  src.appendSegment(500, 1)
  // Should have a single segment {500, 1}
  expect(src.segments()).toHaveLength(1)

  // Overlay a segment BEFORE this one
  // Should end up {100, 2}, {700, 1}
  const dst = src.overlay(100, 700, 2)
  expect(dst.segments()).toHaveLength(2)
  expect(dst.segment(0)).toEqual({ _starts: 100, _value: 2 })
  expect(dst.segment(1)).toEqual({ _starts: 700, _value: 1 })
})

test('6: MeshLine.overlay() after last segment without gap', () => {
  const src = new MeshLine(123)
  src.appendSegment(500, 1)
  // Should have a single segment {500, 1}
  expect(src.segments()).toHaveLength(1)
  expect(src.segment(0)).toEqual({ _starts: 500, _value: 1 })
  expect(src.starts(0)).toEqual(500)
  expect(src.ends(0)).toEqual(Infinity)
  expect(src.value(0)).toEqual(1)

  // Overlay a segment AFTER this one
  const dst = src.overlay(700, 100, 2)
  expect(dst.segments()).toHaveLength(2)
  expect(dst.segment(0)).toEqual({ _starts: 500, _value: 1 })
  expect(dst.segment(1)).toEqual({ _starts: 700, _value: 2 })
})

test('7: MeshLine.overlay() into several segments', () => {
  const src = new MeshLine(123)
  src.appendSegment(500, 1)
  src.appendSegment(1000, 2)
  src.appendSegment(1500, 3)
  src.appendSegment(2000, 4)
  expect(src.segments()).toHaveLength(4)

  const dst = src.overlay(1250, 1750, 'overlay')
  expect(dst.segments()).toHaveLength(5)
  expect(dst.segment(0)).toEqual({ _starts: 500, _value: 1 })
  expect(dst.segment(1)).toEqual({ _starts: 1000, _value: 2 })
  expect(dst.segment(2)).toEqual({ _starts: 1250, _value: 'overlay' })
  expect(dst.segment(3)).toEqual({ _starts: 1750, _value: 3 })
  expect(dst.segment(4)).toEqual({ _starts: 2000, _value: 4 })

  expect(dst.valueAtPos(0)).toEqual(1)
  expect(dst.valueAtPos(500)).toEqual(1)
  expect(dst.valueAtPos(999)).toEqual(1)
  expect(dst.valueAtPos(1000)).toEqual(2)
  expect(dst.valueAtPos(1249)).toEqual(2)
  expect(dst.valueAtPos(1250)).toEqual('overlay')
  expect(dst.valueAtPos(1749)).toEqual('overlay')
  expect(dst.valueAtPos(1750)).toEqual(3)
  expect(dst.valueAtPos(1999)).toEqual(3)
  expect(dst.valueAtPos(2000)).toEqual(4)
  expect(dst.valueAtPos(9999)).toEqual(4)
})
