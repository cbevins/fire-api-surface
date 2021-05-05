import { getForecast } from './wxQuery-weatherapi.js'

const lat = 46.85714
const lon = -114.0073
const days = 3
const format = 'table' // 'fire' or 'table'
getForecast(lat, lon, days, format)
  .then(records => { console.log(records) })
