import { Geometry } from '../Geometry'

const N = 32
const vertices = []
const indices = []
for (let i = 0; i < N; i++) {
  vertices.push(
    -1, -1, i / N,
    +1, -1, i / N,
    +1, +1, i / N,
    -1, +1, i / N
  )
  const ii = i * 4
  indices.push(
    ii, ii + 1, ii + 2,
    ii, ii + 2, ii + 3
  )
}
export const StackedQuads = new Geometry({
  vertices,
  indices
})