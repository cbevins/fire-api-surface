/**
 * MapQuest Developer Open Elevation API
 */
import { mapQuestKey } from './apiKeys.js'
import fetch from 'node-fetch'
import { buildGrid, showElevation, slopeAspect } from './slopeAspect.js'

export const elevSlopeAspect = async (lat, lon, step, showElev = false, showDist = false) => {
  const url = 'http://open.mapquestapi.com/elevation/v1/profile'
  const parms = `?key=${mapQuestKey}&shapeFormat=raw&unit=f&`
  const [grid, nsDist, ewDist] = buildGrid(lat, lon, step, showElev, showDist)

  // Add each neighboring cell location to the query
  let points = 'latLngCollection='
  grid.forEach(([lat1, lon1]) => {
    points += `${lat1},${lon1},`
  })
  const query = url + parms + points

  // old way ...
  // fetch(query, { method: 'GET' })
  //   .then((result) => result.json())
  //   .then((json) => report(json, step, ewDist, nsDist))

  const request = await fetch(query, { method: 'GET' })
    .catch((error) => console.error('error: ' + error))
  const json = await request.json()
  const z = json.elevationProfile.map(e => e.height)
  const [slope, aspect] = slopeAspect(z, step * ewDist, step * nsDist)
  if (showElev) showElevation(z, slope, aspect, step, nsDist)
  return [z[4], slope, aspect]
}
