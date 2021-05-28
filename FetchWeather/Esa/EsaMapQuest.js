import fetch from 'node-fetch'
import { EsaAbstract } from './EsaAbstract.js'

export class EsaMapQuest extends EsaAbstract {
  async _loadGrid () {
    try {
      const url = 'https://open.mapquestapi.com/elevation/v1/profile'
      const key = 'd7ghMP8OtMz17DubWO3qsTPZTzXKfbY1'
      const parms = `?key=${key}&shapeFormat=raw&unit=f&`

      // Create query string of elevation grid cell center [lat,lon] pairs
      let points = 'latLngCollection='
      this._grid.forEach(pt => { points += `${pt.lat},${pt.lon},` })
      const query = url + parms + points

      // Make the request and await the response
      console.log('Loading from MapQuest...')
      const response = await fetch(query, { method: 'GET' })
        .catch((error) => {
          const msg = `EsaMapQuest fetch error: ${error}`
          console.error(msg)
          return msg
        })

      // Store results in the grid and return
      const json = await response.json()
      json.elevationProfile.forEach((e, idx) => { this._grid[idx].elev = e.height })
      console.log('... finished MapQuest')
      return 'OK'
    } catch (error) {
      const msg = `EsaMapQuest try{} block error: ${error}`
      console.error(msg)
      return msg
    }
  }
}
