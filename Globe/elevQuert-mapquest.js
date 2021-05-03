/**
 * MapQuest Developer Open Elevation API
 */
import fetch from 'node-fetch'
import { locationGrid, slopeAspect } from './slopeAspect.js'
import { mapQuestKey } from './apiKeys.js'

/**
 * Returns elevation, slope, and aspect at a point using MapQuest Developer Open Elevation API
 *
 * @param {number} lat Center cell latitude north (+) or south (-)
 * @param {number} lon  Center cell longitude east (+) or west (-)
 * @param {number} sampleRes Sample resolution in decimal degrees (usually 1/3 arc-second)
 * @param {number} cellWidth Cell width (and height) in sampleRes units
 * @returns {object} {lat, lon, elev, slopeDeg, aspect, cells, nsMeters, ewMeters, nsDegrees, ewDegrees}
 */
export const elevSlopeAspect = async (lat0, lon0, sampleRes, cellWidth) => {
  const url = 'http://open.mapquestapi.com/elevation/v1/profile'
  const parms = `?key=${mapQuestKey}&shapeFormat=raw&unit=f&`

  // Create query string of cell center [lat,lon] pairs
  const loc = locationGrid(lat0, lon0, sampleRes, cellWidth)
  let points = 'latLngCollection='
  loc.cells.forEach(cell => { points += `${cell.lat},${cell.lon},` })
  const query = url + parms + points

  // Make request
  // fetch(query, { method: 'GET' })
  //   .then((result) => result.json())
  //   .then((json) => report(json, step, ewDist, nsDist))
  const request = await fetch(query, { method: 'GET' })
    .catch((error) => console.error('error: ' + error))
  const json = await request.json()

  // Repackage response
  const elevationGrid = json.elevationProfile.map(e => e.height)

  // Add elevations to the *loc.cells* object array and also center elev, slope, aspect
  const [slope, aspect] = slopeAspect(elevationGrid, 3.2808 * loc.ewMeters, 3.2808 * loc.nsMeters)
  json.elevationProfile.forEach((e, idx) => { loc.cells[idx].elev = e.height })
  loc.lat = lat0
  loc.lon = lon0
  loc.elev = elevationGrid[4]
  loc.slopeDeg = slope
  loc.aspect = aspect
  return loc
}
