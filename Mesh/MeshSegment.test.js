import { MeshSegment } from './Mesh.js'

test('1: MeshSegment constructor', () => {
  const segment = new MeshSegment(123, 4)
  expect(segment.starts()).toEqual(123)
  expect(segment.value()).toEqual(4)
})
