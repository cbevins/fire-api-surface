import fetch from 'node-fetch'
import moment from 'moment'
import queryString from 'query-string'
import 'regenerator-runtime/runtime'
// These are usually provided by the client
const lat = 46.859340
const lon = -113.975528
const timezone = 'America/Denver'

// These are usually fixed
const url = 'https://api.tomorrow.io/v4/timelines'
const apikey = 'Vp91CwZKe0rPFd8ZDry5hKyVyOp2I4aC'
const hours = 1
const location = [lat, lon] // pick the location, as a lat, lon pair
const units = 'imperial' // choose the unit system, either 'metric' or 'imperial'
const now = moment.utc()
const startTime = moment.utc(now).startOf('hour').toISOString() // "2019-03-20T14:09:50Z"
const endTime = moment.utc(now).add(hours, 'hours').toISOString()
const timesteps = ['1h'] // set the timesteps, like "current", "1h" and "1d"
const fields = [
  'temperature', // dry bulb temperature at 2-m (oF)
  'temperatureApparent', // apparent temperature at 2-m (oF)
  'humidity', // relative humidity (%)
  'dewPoint', // dewpoint temperature at 2-m (oF)
  'windSpeed', // wind speed at 10-m (mi/h)
  'windGust', // maximum brief increase in wind speed at 10-m, usually less than 20 seconds (mi/h)
  'windDirection', // direction from which the wind originates, degrees clockwise from north
  'precipitationIntensity', // in/hr
  'precipitationProbability', // %
  'precipitationType', // 0=N/A 1=Rain 2=Snow 3=Freezing Rain 4=Ice Pellets
  'pressureSurfaceLevel', // weight of the air above the surface (at the surface level) (in/Hg)
  'pressureSeaLevel', // weight of the air above the surface (at mean sea level) (in/Hg)
  'cloudCover', // %
  'visibility', // mi
  'cloudBase', // mi
  'cloudCeiling', // mi
  'weatherCode', // code
  'fireIndex', // Fosberg Fire Weather Index
  'snowAccumulation', // The trailing amount of new snowfall that has or will have occurred over the last hour of the requested time (in)
  'iceAccumulation', // The trailing amount of ice that has or will have occurred over the last hour of the requested time (in)
  'soilMoistureVolumetric0To10', // % at 0-10 cm
  'soilTemperature0To10', // oF
  'solarGHI', // Btu/ft2  (total amount of shortwave radiation received from above by a surface horizontal to the ground)
  'solarDNI', // Btu/ft2 (diffuse (i.e., scattered) component of GHI reaching the surface of the earth at each point)
  'solarDHI' // Btu/ft2 (direct component of GHI reaching the surface of the earth at each point)
]

// not allowed for 1-h timelines
const fields2 = [...fields,
  'moonPhase',
  'sunriseTime',
  'sunsetTime'
]

const parms = queryString.stringify({
  apikey, location, fields, units, timesteps, startTime, endTime, timezone
}, { arrayFormat: 'comma' })

// const parms2 = queryString.stringify({
//   apikey, location, fields2, units, timesteps, startTime, endTime, timezone
// }, { arrayFormat: 'comma' })

test('tomorrow.io valid request', async () => {
  const res = await fetch(url + '?' + parms, { method: 'GET' })
  if (res.status === 429) { // 'Too Many Requests' 3/sec, 25/hr, 500/day
    console.log(`Tomorrow request limit exceeded: ${res.status}, ${res.statusText}`)
  }
  expect(res.status).toEqual(200)
  const data = await res.json()
  console.log(data)
})

// test('tomorrow.io invalid sunrise request', async () => {
//   const res = await fetch(url + '?' + parms2, { method: 'GET' })
//   if (res.status === 429) { // 'Too Many Requests'
//     console.log(`Tomorrow request limit exceeded: ${res.status}, ${res.statusText}`)
//   }
//   expect(res.status).toEqual(400)

//   const data = await res.json()
//   expect(data).toEqual(expect.objectContaining({ code: expect.any(Number), type: expect.any(String), message: expect.any(String) }))
//   expect(data.code).toEqual(400002)
//   expect(data.type).toEqual('Invalid Query Parameters')
//   console.log(data)
// })

// test('tomorrow.io page not found', async () => {
//   const res = await fetch(url + 'junk' + '?' + parms2, { method: 'GET' })
//   expect(res.status).toEqual(404)
//   expect(res.statusText).toEqual('Not Found')
//   console.log(res)
// })

// test('the fetch fails with an error', () => {
//   expect.assertions(1)
//   return fetch(url + '?' + parms, { method: 'GET' })
//     .catch(e => expect(e).toMatch('error'))
// })
