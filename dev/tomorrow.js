import fetch from 'node-fetch'
import queryString from 'query-string'
import moment from 'moment'

function fix (f, len, dec) { return f.toFixed(dec).padStart(len) }

function displayWeather (json) {
  // console.log(JSON.stringify(json, null, ' '))
  let str = 'Year-Mo-Dy Hr:Mn |  oF  Rh  CC | WS WG  WD | Solar |\n'
  const records = json.data.timelines[0].intervals // this is the '1h' timeline
  records.forEach(w => {
    const date = w.startTime.substr(0, 10)
    const time = w.startTime.substr(11, 5)
    const v = w.values
    str += `${date} ${time} | `
    str += `${fix(v.temperature, 3, 0)} `
    str += `${fix(v.humidity, 3, 0)} `
    str += `${fix(v.cloudCover, 3, 0)} | `
    str += `${fix(v.windSpeed, 2, 0)} `
    str += `${fix(v.windGust, 2, 0)} `
    str += `${fix(v.windDirection, 3, 0)} | `
    str += `${fix(v.solarGHI, 5, 0)} |\n`
  })
  console.log(str)
}

function getWeather (lat, long, startTime, endTime) {
  // set the Timelines GET endpoint as the target URL
  const getTimelineURL = 'https://api.tomorrow.io/v4/timelines'

  // get your key from app.tomorrow.io/development/keys
  const apikey = 'Vp91CwZKe0rPFd8ZDry5hKyVyOp2I4aC'

  // pick the location, as a latlong pair
  const location = [lat, long]

  // list the fields
  const fields = [
    'temperature',
    'temperatureApparent',
    'humidity',
    'dewPoint',
    'windSpeed',
    'windGust',
    'windDirection',
    'precipitationProbability',
    'precipitationIntensity', // in/hr
    'precipitationType',
    'cloudCover',
    'cloudBase',
    'cloudCeiling',
    'weatherCode',
    'fireIndex',
    'soilMoistureVolumetric0To10',
    'soilTemperature0To10',
    // 'sunriseTime',
    // 'sunsetTime',
    'solarGHI' // Btu/ft2
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
    .then((json) => displayWeather(json))
    .catch((error) => console.error('error: ' + error))
}

// configure the time frame up to 6 hours back and 15 days out
const now = moment.utc()
const startTime = moment.utc(now).add(0, 'minutes').toISOString()
const endTime = moment.utc(now).add(24, 'hours').toISOString()

getWeather(46.85722, -114.00723, startTime, endTime)
