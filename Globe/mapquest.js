// Gets elevation, slope, and aspect using MapQuest Elevation API
import { elevSlopeAspect } from './elevation-mapquest.js'

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
