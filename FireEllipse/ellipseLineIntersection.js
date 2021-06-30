// Find the points of intersection between an ellipse and a line segment.
// Assumes an unrotated ellipse centered at the origin
export function ellipseLineIntersection (a, b, x1, y1, x2, y2, segmentOnly) {
  // If the ellipse or line segment are empty, return no intersections.
  if (a <= 0 || b <= 0 || (x1 === x2 && y1 === y2)) return []

  // For now, assume original center is at origin (can translate later)
  const cx = 0
  const cy = 0

  // Calculate the quadratic parameters.
  const A = (x2 - x1) * (x2 - x1) / a / a + (y2 - y1) * (y2 - y1) / b / b
  const B = 2 * x1 * (x2 - x1) / a / a + 2 * y1 * (y2 - y1) / b / b
  const C = x1 * x1 / a / a + y1 * y1 / b / b - 1

  // Make a list of t values.
  const t = []

  // Calculate the discriminant.
  const discriminant = B * B - 4 * A * C
  if (discriminant === 0) { // One real solution.
    t.push(-B / 2 / A)
  } else if (discriminant > 0) { // Two real solutions.
    const d = Math.sqrt(discriminant)
    t.push((-B + d) / 2 / A)
    t.push((-B - d) / 2 / A)
  }

  // Convert the t values into points.
  const points = []
  t.forEach(v => {
    // If the points are on the segment (or we don't care if they are), add them to the list.
    if (!segmentOnly || (v >= 0 && v <= 1)) {
      const x = x1 + (x2 - x1) * v + cx
      const y = y1 + (y2 - y1) * v + cy
      points.push([x, y])
    }
  })
  // Order array by x value
  if (points.length === 2 && points[0][0] > points[1][0]) {
    return [points[1], points[0]]
  }
  return points
}
