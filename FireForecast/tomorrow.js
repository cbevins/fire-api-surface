/**
 * Example access to the tomorrow.io weather api
 */
import fetch from 'node-fetch'
import queryString from 'query-string'

export function getWeather (lat, long, startTime, endTime, callback) {
  // set the Timelines GET endpoint as the target URL
  const getTimelineURL = 'https://api.tomorrow.io/v4/timelines'

  // get your key from app.tomorrow.io/development/keys
  const apikey = 'Vp91CwZKe0rPFd8ZDry5hKyVyOp2I4aC'

  // pick the location, as a latlong pair
  const location = [lat, long]

  // list the fields
  const fields = [
    'temperature', // oF
    'temperatureApparent', // oF
    'humidity', // %
    'dewPoint', // oF
    'windSpeed', // f/s
    'windGust', // f/s
    'windDirection', // degrees clockwise from north
    'precipitationIntensity', // in/hr
    'precipitationProbability', // %
    'precipitationType', // 0=N/A 1=Rain 2=Snow 3=Freezing Rain 4=Ice Pellets
    'cloudCover', // %
    'visibility', // mi
    'cloudBase', // mi
    'cloudCeiling', // mi
    'weatherCode', // code
    'fireIndex', // Fosberg Fire Weather Index
    'soilMoistureVolumetric0To10', // % at 0-10 cm
    'soilTemperature0To10', // oF
    'solarGHI', // Btu/ft2  (total amount of shortwave radiation received from above by a surface horizontal to the ground)
    'solarDNI', // Btu/ft2 (diffuse (i.e., scattered) component of GHI reaching the surface of the earth at each point)
    'solarDHI' // Btu/ft2 (direct component of GHI reaching the surface of the earth at each point)
  ]

  // choose the unit system, either metric or imperial
  const units = 'imperial'

  // set the timesteps, like "current", "1h" and "1d"
  const timesteps = ['1h']

  // specify the timezone, using standard IANA timezone format
  const timezone = 'America/Denver'

  // request the timelines with all the query string parameters as options
  const getTimelineParameters = queryString.stringify({
    apikey,
    location,
    fields,
    units,
    timesteps,
    startTime,
    endTime,
    timezone
  }, { arrayFormat: 'comma' })

  fetch(getTimelineURL + '?' + getTimelineParameters, { method: 'GET' })
    .then((result) => result.json())
    .then((json) => weatherRecords(json))
    .then((wx) => callback(wx))
    .catch((error) => console.error('error: ' + error))
}

// Converts json response to an array of weather objects
function weatherRecords (json) {
  const records = []
  // console.log(JSON.stringify(json, null, ' '))
  const responses = json.data.timelines[0].intervals // this is the '1h' timeline
  responses.forEach(res => {
    const wx = res.values
    wx.date = res.startTime.substr(0, 10)
    wx.time = res.startTime.substr(11, 5)
    records.push(wx)
  })
  return records
}
