import { MeshArray } from './Mesh.js'

test('1: Vertical MeshArray', () => {
  // Vertical MeshLine geographical AND display positions
  // usually increase from left (west) to right (east)
  const v = new MeshArray(1000, 2000, 10, false)
  expect(v.posStart()).toEqual(1000)
  expect(v.posStop()).toEqual(2000)
  expect(v.posStep()).toEqual(10)
  expect(v.spacing()).toEqual(10)
  expect(v.isHorizontal()).toEqual(false)
  expect(v.lines()).toHaveLength(101)

  expect(v.line(0).pos()).toEqual(1000)
  expect(v.line(1).pos()).toEqual(1010)
  expect(v.line(99).pos()).toEqual(1990)
  expect(v.line(100).pos()).toEqual(2000)

  expect(v.line(0).segments()).toHaveLength(0)
  v.fill(5000, 'fillValue')
  expect(v.line(0).segments()).toHaveLength(1)
  expect(v.line(0).segment(0).starts()).toEqual(5000)
  expect(v.line(0).segment(0).value()).toEqual('fillValue')
  expect(v.line(0).segment(0)).toEqual({ _starts: 5000, _value: 'fillValue' })

  // Idx progresses for east-to-west
  expect(v.idxAtPos(500)).toEqual(0)
  expect(v.lineAtPos(500).pos()).toEqual(1000)

  expect(v.idxAtPos(1000)).toEqual(0)
  expect(v.lineAtPos(1000).pos()).toEqual(1000)

  expect(v.idxAtPos(1250)).toEqual(25)
  expect(v.lineAtPos(1250).pos()).toEqual(1250)

  expect(v.idxAtPos(1500)).toEqual(50)
  expect(v.lineAtPos(1500).pos()).toEqual(1500)

  expect(v.idxAtPos(1750)).toEqual(75)
  expect(v.lineAtPos(1750).pos()).toEqual(1750)

  expect(v.idxAtPos(2000)).toEqual(100)
  expect(v.lineAtPos(2000).pos()).toEqual(2000)

  expect(v.idxAtPos(9999)).toEqual(100)
  expect(v.lineAtPos(9999).pos()).toEqual(2000)

  // Can find closest MeshLine to any position
  expect(v.idxAtPos(1504)).toEqual(50)
  expect(v.lineAtPos(1504).pos()).toEqual(1500)
  expect(v.idxAtPos(1496)).toEqual(50)
  expect(v.lineAtPos(1496).pos()).toEqual(1500)

  expect(v.idxAtPos(-9999999)).toEqual(0)
  expect(v.lineAtPos(-9999999).pos()).toEqual(1000)
})

test('2: Horizontal MeshArray', () => {
  // Horizontal MeshLine geographical positions usually decrease from top (north) to bottom (south),
  // while device positions increase from top (0) to bottom
  const h = new MeshArray(2000, 1000, 10, true)
  expect(h.posStart()).toEqual(2000)
  expect(h.posStop()).toEqual(1000)
  expect(h.posStep()).toEqual(-10)
  expect(h.spacing()).toEqual(10)
  expect(h.isHorizontal()).toEqual(true)
  expect(h.lines()).toHaveLength(101)

  expect(h.line(0).pos()).toEqual(2000)
  expect(h.line(1).pos()).toEqual(1990)
  expect(h.line(99).pos()).toEqual(1010)
  expect(h.line(100).pos()).toEqual(1000)

  // Reverse idx for north-to-south
  expect(h.idxAtPos(3000)).toEqual(0)
  expect(h.lineAtPos(3000).pos()).toEqual(2000)

  expect(h.idxAtPos(2000)).toEqual(0)
  expect(h.lineAtPos(2000).pos()).toEqual(2000)

  expect(h.idxAtPos(1750)).toEqual(25)
  expect(h.lineAtPos(1750).pos()).toEqual(1750)

  expect(h.idxAtPos(1500)).toEqual(50)
  expect(h.lineAtPos(1500).pos()).toEqual(1500)

  expect(h.idxAtPos(1250)).toEqual(75)
  expect(h.lineAtPos(1250).pos()).toEqual(1250)

  expect(h.idxAtPos(1000)).toEqual(100)
  expect(h.lineAtPos(1000).pos()).toEqual(1000)

  expect(h.idxAtPos(-1000)).toEqual(100)
  expect(h.lineAtPos(-1000).pos()).toEqual(1000)

  // Can find closest MeshLine to any position
  expect(h.idxAtPos(1504)).toEqual(50)
  expect(h.lineAtPos(1504).pos()).toEqual(1500)
  expect(h.idxAtPos(1496)).toEqual(50)
  expect(h.lineAtPos(1496).pos()).toEqual(1500)
  expect(h.idxAtPos(9999999)).toEqual(0)
  expect(h.lineAtPos(9999999).pos()).toEqual(2000)

  expect(h.line(0).segments()).toHaveLength(0)
  h.fill(5000, 'fillValue')
  expect(h.line(0).segments()).toHaveLength(1)
  expect(h.line(0).segment(0).starts()).toEqual(5000)
  expect(h.line(0).segment(0).value()).toEqual('fillValue')
  expect(h.line(0).segment(0)).toEqual({ _starts: 5000, _value: 'fillValue' })
})

test('3: MeshArray.valueAtPos()', () => {
  // Horizontal MeshLine geographical positions usually decrease from top (north) to bottom (south),
  // while device positions increase from top (0) to bottom
  const h = new MeshArray(2000, 1000, 10, true)
  const src = h.lineAtPos(1500)
  expect(h.idxAtPos(1500)).toEqual(50)
  src.appendSegment(500, 1)
  src.appendSegment(1000, 2)
  src.appendSegment(1500, 3)
  src.appendSegment(2000, 4)
  expect(src.segments()).toHaveLength(4)

  // Duplicate MeshLine
  const dst = src.overlay(1250, 1750, 'overlay')
  expect(dst.segments()).toHaveLength(5)
  expect(dst.segment(0)).toEqual({ _starts: 500, _value: 1 })
  expect(dst.segment(1)).toEqual({ _starts: 1000, _value: 2 })
  expect(dst.segment(2)).toEqual({ _starts: 1250, _value: 'overlay' })
  expect(dst.segment(3)).toEqual({ _starts: 1750, _value: 3 })
  expect(dst.segment(4)).toEqual({ _starts: 2000, _value: 4 })

  expect(dst.valueAtDistance(0)).toEqual(1)
  expect(dst.valueAtDistance(500)).toEqual(1)
  expect(dst.valueAtDistance(999)).toEqual(1)
  expect(dst.valueAtDistance(1000)).toEqual(2)
  expect(dst.valueAtDistance(1249)).toEqual(2)
  expect(dst.valueAtDistance(1250)).toEqual('overlay')
  expect(dst.valueAtDistance(1749)).toEqual('overlay')
  expect(dst.valueAtDistance(1750)).toEqual(3)
  expect(dst.valueAtDistance(1999)).toEqual(3)
  expect(dst.valueAtDistance(2000)).toEqual(4)
  expect(dst.valueAtDistance(9999)).toEqual(4)

  // Store overlaid MeshLine back into the original MeshArray
  h._lines[50] = src.overlay(1250, 1750, 'overlay')
  expect(h.valueAtPos(1500, 0)).toEqual(1)
  expect(h.valueAtPos(1500, 500)).toEqual(1)
  expect(h.valueAtPos(1500, 999)).toEqual(1)
  expect(h.valueAtPos(1500, 1000)).toEqual(2)
  expect(h.valueAtPos(1500, 1249)).toEqual(2)
  expect(h.valueAtPos(1500, 1250)).toEqual('overlay')
  expect(h.valueAtPos(1500, 1749)).toEqual('overlay')
  expect(h.valueAtPos(1500, 1750)).toEqual(3)
  expect(h.valueAtPos(1500, 1999)).toEqual(3)
  expect(h.valueAtPos(1500, 2000)).toEqual(4)
  expect(h.valueAtPos(1500, 9999)).toEqual(4)
})
