import { MeshLine } from './MeshLine.js'

test('1: MeshLine constructor, pos(), segments()', () => {
  const line = new MeshLine(123)
  expect(line.pos()).toEqual(123)
  expect(line.segments()).toEqual([])
})

test('2: MeshLine.fill(), segments(), segment()', () => {
  const line = new MeshLine(123).fill(100, 200, 'fillValue')
  expect(line.pos()).toEqual(123)
  expect(line.segments()).toHaveLength(1)
  expect(line.segment(0).begins()).toEqual(100)
  expect(line.segment(0).ends()).toEqual(200)
  expect(line.segment(0).value()).toEqual('fillValue')
})

test('3: MeshLine.extendLine()', () => {
  const line = new MeshLine(123)
  expect(line.segments()).toHaveLength(0)
  expect(line.extendLine(100, 200, 1).segments()).toHaveLength(1)
  expect(line.extendLine(200, 300, 2).segments()).toHaveLength(2)
  expect(line.segment(0)).toEqual({ _begins: 100, _ends: 200, _value: 1 })
  expect(line.segment(1)).toEqual({ _begins: 200, _ends: 300, _value: 2 })

  // Do not append segment if it is a continuation of the previous segment
  expect(line.extendLine(300, 400, 2).segments()).toHaveLength(2)
  expect(line.segment(0)).toEqual({ _begins: 100, _ends: 200, _value: 1 })
  expect(line.segment(1)).toEqual({ _begins: 200, _ends: 400, _value: 2 })

  expect(line.extendLine(400, 500, 3).segments()).toHaveLength(3)
  expect(line.segment(0)).toEqual({ _begins: 100, _ends: 200, _value: 1 })
  expect(line.segment(1)).toEqual({ _begins: 200, _ends: 400, _value: 2 })
  expect(line.segment(2)).toEqual({ _begins: 400, _ends: 500, _value: 3 })

  // fill() resets the MeshLine
  expect(line.fill(1000, 5000, 9).segments()).toHaveLength(1)
  expect(line.segment(0).begins()).toEqual(1000)
  expect(line.segment(0).ends()).toEqual(5000)
  expect(line.segment(0).value()).toEqual(9)
})

test('4: MeshLine.overlay()', () => {
  const line = new MeshLine(123)
  expect(line.segments()).toHaveLength(0)

  // Overlay onto an empty MeshLine
  const dst = line.overlay(100, 200, 1)
  expect(dst.segments()).toHaveLength(1)
  expect(dst.segment(0)).toEqual({ _begins: 100, _ends: 200, _value: 1 })

  // Overlay onto self
  line.overlaySelf(100, 200, 1)
  expect(line.segments()).toHaveLength(1)
  expect(line.segment(0)).toEqual({ _begins: 100, _ends: 200, _value: 1 })

  // Add an overlay the begins and ends before the first segment
  line.overlaySelf(0, 100, 0)
  expect(line.segments()).toHaveLength(2)
  expect(line.segment(0)).toEqual({ _begins: 0, _ends: 100, _value: 0 })
  expect(line.segment(1)).toEqual({ _begins: 100, _ends: 200, _value: 1 })

  // An overlay that begins after the last segment
  line.overlaySelf(400, 500, 4)
  expect(line.segments()).toHaveLength(3)
  expect(line.segment(0)).toEqual({ _begins: 0, _ends: 100, _value: 0 })
  expect(line.segment(1)).toEqual({ _begins: 100, _ends: 200, _value: 1 })
  expect(line.segment(2)).toEqual({ _begins: 400, _ends: 500, _value: 4 })

  // Fill in the MeshLine a bit
  line.overlaySelf(200, 300, 2).overlaySelf(300, 400, 3).overlaySelf(500, 600, 5)
  expect(line.segments()).toHaveLength(6)
  expect(line.segment(0)).toEqual({ _begins: 0, _ends: 100, _value: 0 })
  expect(line.segment(1)).toEqual({ _begins: 100, _ends: 200, _value: 1 })
  expect(line.segment(2)).toEqual({ _begins: 200, _ends: 300, _value: 2 })
  expect(line.segment(3)).toEqual({ _begins: 300, _ends: 400, _value: 3 })
  expect(line.segment(4)).toEqual({ _begins: 400, _ends: 500, _value: 4 })
  expect(line.segment(5)).toEqual({ _begins: 500, _ends: 600, _value: 5 })

  // An overlay the begins and ends on adjacent segments
  line.overlaySelf(250, 350, 2.5)
  expect(line.segments()).toHaveLength(7)
  expect(line.segment(0)).toEqual({ _begins: 0, _ends: 100, _value: 0 })
  expect(line.segment(1)).toEqual({ _begins: 100, _ends: 200, _value: 1 })
  expect(line.segment(2)).toEqual({ _begins: 200, _ends: 250, _value: 2 })
  expect(line.segment(3)).toEqual({ _begins: 250, _ends: 350, _value: 2.5 })
  expect(line.segment(4)).toEqual({ _begins: 350, _ends: 400, _value: 3 })
  expect(line.segment(5)).toEqual({ _begins: 400, _ends: 500, _value: 4 })
  expect(line.segment(6)).toEqual({ _begins: 500, _ends: 600, _value: 5 })

  // An overlay begins and ends within nonadjacent segments
  line.overlaySelf(150, 450, 3.5)
  expect(line.segments()).toHaveLength(5)
  expect(line.segment(0)).toEqual({ _begins: 0, _ends: 100, _value: 0 })
  expect(line.segment(1)).toEqual({ _begins: 100, _ends: 150, _value: 1 })
  expect(line.segment(2)).toEqual({ _begins: 150, _ends: 450, _value: 3.5 })
  expect(line.segment(3)).toEqual({ _begins: 450, _ends: 500, _value: 4 })
  expect(line.segment(4)).toEqual({ _begins: 500, _ends: 600, _value: 5 })

  // Overlay that begins and end on a boundary
  line.overlaySelf(450, 500, 4.5)
  expect(line.segments()).toHaveLength(5)
  expect(line.segment(0)).toEqual({ _begins: 0, _ends: 100, _value: 0 })
  expect(line.segment(1)).toEqual({ _begins: 100, _ends: 150, _value: 1 })
  expect(line.segment(2)).toEqual({ _begins: 150, _ends: 450, _value: 3.5 })
  expect(line.segment(3)).toEqual({ _begins: 450, _ends: 500, _value: 4.5 })
  expect(line.segment(4)).toEqual({ _begins: 500, _ends: 600, _value: 5 })

  // Overlay that begins on a boundary and ends within a segment
  line.overlaySelf(450, 550, 5.5)
  expect(line.segments()).toHaveLength(5)
  expect(line.segment(0)).toEqual({ _begins: 0, _ends: 100, _value: 0 })
  expect(line.segment(1)).toEqual({ _begins: 100, _ends: 150, _value: 1 })
  expect(line.segment(2)).toEqual({ _begins: 150, _ends: 450, _value: 3.5 })
  expect(line.segment(3)).toEqual({ _begins: 450, _ends: 550, _value: 5.5 })
  expect(line.segment(4)).toEqual({ _begins: 550, _ends: 600, _value: 5 })

  // Overlay that begins within a segment and ends on a boundary
  line.overlaySelf(500, 600, 6.5)
  expect(line.segments()).toHaveLength(5)
  expect(line.segment(0)).toEqual({ _begins: 0, _ends: 100, _value: 0 })
  expect(line.segment(1)).toEqual({ _begins: 100, _ends: 150, _value: 1 })
  expect(line.segment(2)).toEqual({ _begins: 150, _ends: 450, _value: 3.5 })
  expect(line.segment(3)).toEqual({ _begins: 450, _ends: 500, _value: 5.5 })
  expect(line.segment(4)).toEqual({ _begins: 500, _ends: 600, _value: 6.5 })

  // Overlay that begins and ends within the same segment
  line.overlaySelf(525, 575, 7)
  expect(line.segments()).toHaveLength(7)
  expect(line.segment(0)).toEqual({ _begins: 0, _ends: 100, _value: 0 })
  expect(line.segment(1)).toEqual({ _begins: 100, _ends: 150, _value: 1 })
  expect(line.segment(2)).toEqual({ _begins: 150, _ends: 450, _value: 3.5 })
  expect(line.segment(3)).toEqual({ _begins: 450, _ends: 500, _value: 5.5 })
  expect(line.segment(4)).toEqual({ _begins: 500, _ends: 525, _value: 6.5 })
  expect(line.segment(5)).toEqual({ _begins: 525, _ends: 575, _value: 7 })
  expect(line.segment(6)).toEqual({ _begins: 575, _ends: 600, _value: 6.5 })
})

test('7: MeshLine.valueAtDistance()', () => {
  const line = new MeshLine(123)
  line.overlaySelf(0, 100, 0).overlaySelf(100, 200, 1).overlaySelf(200, 300, 2)
    .overlaySelf(300, 400, 3).overlaySelf(400, 500, 4).overlaySelf(500, 600, 5)
  expect(line.segments()).toHaveLength(6)

  expect(line.valueAtDistance(0)).toEqual(0)
  expect(line.valueAtDistance(50)).toEqual(0)
  expect(line.valueAtDistance(99.999)).toEqual(0)

  expect(line.valueAtDistance(100)).toEqual(1)
  expect(line.valueAtDistance(199)).toEqual(1)
  expect(line.valueAtDistance(200)).toEqual(2)
  expect(line.valueAtDistance(299)).toEqual(2)
})
