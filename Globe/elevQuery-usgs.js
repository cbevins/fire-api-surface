/**
 * USGS Elevation Point Query Service
 */
import axios from 'axios'
import { locationGrid, slopeAspect } from './slopeAspect.js'

/**
 * Returns elevation, slope, and aspect at a point using Elevation Point Query Service
 *
 * @param {number} lat Center cell latitude north (+) or south (-)
 * @param {number} lon  Center cell longitude east (+) or west (-)
 * @param {number} sampleRes Sample resolution in decimal degrees (usually 1/3 arc-second)
 * @param {number} cellWidth Cell width (and height) in sampleRes units
 * @returns {object} {lat, lon, elev, slopeDeg, slopeRatio, aspect, cells, nsMeters, ewMeters, nsDegrees, ewDegrees}
 */
export const elevSlopeAspect = async (lat0, lon0, sampleRes, cellWidth) => {
  const url = 'https://nationalmap.gov/epqs/pqs.php?units=Feet&output=json&'
  const loc = locationGrid(lat0, lon0, sampleRes, cellWidth)

  try {
    const requests = []
    loc.cells.forEach(cell => {
      requests.push(axios.get(url + `x=${cell.lon}&y=${cell.lat}`))
    })
    const responses = await axios.all(requests)

    // Repackage response
    const elevationGrid = []
    responses.forEach((res, idx) => {
      const data = res.data.USGS_Elevation_Point_Query_Service.Elevation_Query
      elevationGrid.push(data.Elevation)
      loc.cells[idx].elev = data.Elevation
    })

    // Add elevations to the *loc.cells* object array and also center elev, slope, aspect
    const [slope, aspect] = slopeAspect(elevationGrid, 3.2808 * loc.ewMeters, 3.2808 * loc.nsMeters)
    loc.lat = lat0
    loc.lon = lon0
    loc.elev = elevationGrid[4]
    loc.slopeDeg = slope
    loc.slopeRatio = Math.tan(slope * Math.PI / 180)
    loc.aspect = aspect
    return loc
  } catch (error) {
    console.error('error: ' + error)
  }
}
