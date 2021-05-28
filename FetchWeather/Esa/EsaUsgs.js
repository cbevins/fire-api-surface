import axios from 'axios'
import { EsaAbstract } from './EsaAbstract.js'

export class EsaUsgs extends EsaAbstract {
  async _loadGrid () {
    const url = 'https://nationalmap.gov/epqs/pqs.php?units=Feet&output=json&'
    try {
      // Make the request and await the response
      const requests = []
      console.log('Loading from USGS ...')
      this._grid.forEach(pt => { requests.push(axios.get(url + `x=${pt.lon}&y=${pt.lat}`)) })
      const responses = await axios.all(requests)
      console.log('... finished USGS')

      // Store results in the grid and return
      responses.forEach((res, idx) => {
        this._grid[idx].elev = res.data.USGS_Elevation_Point_Query_Service.Elevation_Query.Elevation
      })
      return 'OK'
    } catch (error) {
      const msg = `USGS try{} block error: ${error}`
      console.error(msg)
      return msg
    }
  }
}
