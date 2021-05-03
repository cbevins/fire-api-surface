/**
 * USGS
 */
import axios from 'axios'
import { buildGrid, showElevation, slopeAspect } from './slopeAspect.js'

export const elevSlopeAspect = async (lat, lon, step, showElev = false, showDist = false) => {
  const url = 'https://nationalmap.gov/epqs/pqs.php?units=Feet&output=json&'
  const [grid, nsDist, ewDist] = buildGrid(lat, lon, step, showElev, showDist)

  try {
    const requests = []
    grid.forEach(([lat1, lon1]) => {
      requests.push(axios.get(url + `x=${lon1}&y=${lat1}`))
    })
    const responses = await axios.all(requests)
    const z = []
    responses.forEach(res => {
      const data = res.data.USGS_Elevation_Point_Query_Service.Elevation_Query
      z.push(data.Elevation)
    })
    const [slope, aspect] = slopeAspect(z, step * ewDist, step * nsDist)
    if (showElev) showElevation(z, slope, aspect, step, nsDist)
    return [z[4], slope, aspect]
  } catch (error) {
    console.error('error: ' + error)
  }
}

const name = 'The "M"'
const lat = 46.859340
const lon = -113.975528
// Double sample distance to ensure we don't hit the same sample point in adjacent cells
const step = 2
elevSlopeAspect(lat, lon, step, true, true)
  .then(([elev, slope, aspect]) => {
    let str = `${name} (φ=${lat}, λ=${lon})\n`
    str += `  elev:  ${elev} f\n`
    str += `  slope: ${slope.toFixed(2)} degrees\n`
    str += `  aspect: ${aspect}\n`
    console.log(str)
  })
