import axios from 'axios'
import { destination, distance } from './greatCircle.js'
import { slopeAspect } from './slopeAspect.js'

const urlUsgsEpqs = 'https://nationalmap.gov/epqs/pqs.php?units=Meters&output=json&'

const get3x3 = async (lat, lon, xDist, yDist, grid) => {
  grid.push({ i: 0, b: 0, e: 0, xd: 1, yd: 1 }) // will reset center cell below
  grid.push({ i: 1, b: 315, e: 0, xd: -1, yd: 1 })
  grid.push({ i: 2, b: 0, e: 0, xd: 0, yd: 1 })
  grid.push({ i: 3, b: 45, e: 0, xd: 1, yd: 1 })
  grid.push({ i: 4, b: 270, e: 0, xd: -1, yd: 0 })
  grid.push({ i: 5, b: 90, e: 0, xd: 1, yd: 0 })
  grid.push({ i: 6, b: 225, e: 0, xd: -1, yd: -1 })
  grid.push({ i: 7, b: 180, e: 0, xd: 0, yd: -1 })
  grid.push({ i: 8, b: 135, e: 0, xd: 1, yd: -1 })
  // Figure out location of each grid cell
  grid.forEach(cell => {
    const d2 = (xDist * cell.xd) ** 2 + (yDist * cell.yd) ** 2
    const d = (d2 > 0) ? Math.sqrt(d2) : 0
    ;[cell.y, cell.x] = destination(lat, lon, cell.b, d)
  })
  // Now we can set the center cell
  grid[0].y = lat; grid[0].x = lon
  try {
    const requests = []
    grid.forEach(cell => {
      requests.push(axios.get(urlUsgsEpqs + `x=${cell.lon}&y=${cell.lat}`))
    })
    const responses = await axios.all(requests)
    return responses
  } catch (error) {
    console.error('error: ' + error)
  }
}

function elevSlopeAspect (responses, grid) {
  responses.forEach((res, idx) => {
    const z = []
    const data = res.data.USGS_Elevation_Point_Query_Service.Elevation_Query
    if (grid[idx].x !== data.x || grid[idx].y !== data.y) {
      throw new Error(`Grid[${idx}].x=${grid[idx].x} instead of ${data.x}`)
    }
    z.push(data.Elevation)
    grid[idx].e = data.Elevation
  })
  const z0 = grid[0].e
  let str = `Grid has center cell elevation ${z0}\n`
  str += `${cell(grid[1], z0)} ${cell(grid[2], z0)} ${cell(grid[3], z0)}\n`
  str += `${cell(grid[4], z0)} ${cell(grid[0], z0)} ${cell(grid[5], z0)}\n`
  str += `${cell(grid[6], z0)} ${cell(grid[7], z0)} ${cell(grid[8], z0)}\n`
  console.log(str)
  const [slope, aspect] = slopeAspect(z, grid[0].d, grid[0].d)
}

function cell (c, z) { return `[${c.i}, ${(c.e - z).toFixed(2).padStart(6, ' ')}]` }

const lat = 47
const lon = -114
;(async () => {
  const start = Date.now()
  // USGS elevation grid is at 1/3 arc-second
  const arc = 1 / 60 * 60 * 30
  // 1/3 arc-second sample distance in y direction (north-south) is fixed
  const yDist = distance(lat, lon, lat + arc, lon)
  // 1/3 arc-second sample distance in x direction (east-west) diminishes with tan(lat)
  const xDist = distance(lat, lon, lat, lon + arc)
  // Array where requested elevations will be stored
  const grid = []

  elevSlopeAspect(await get3x3(47, -114, xDist, yDist, grid), grid)
  console.log('USGS latency:', Date.now() - start)
})()
