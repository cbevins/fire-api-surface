/**
 * tomorrow.io weather api
 * See FireForecast for usage.
 */
import fetch from 'node-fetch'
import { tomorrow } from './apiKeys.js'
import queryString from 'query-string'

/**
 * Retrieves hourly weather forecast from tomorrow.io
 * @param {number} lat Latitude north (+) or south (-)
 * @param {number} lon Longitude east (+) or west (-)
 * @param {string} startTime Start time in ISO 8601 format, i.e., "2019-03-20T14:09:50Z"
 * @param {string} endTime End time in ISO 8601 format, i.e., "2019-03-20T14:09:50Z"
 * @param {string} timezone Timezone of time values, according to IANA Timezone Names
 *  (defaults to 'UTC') See https://docs.tomorrow.io/reference/api-formats#timezone
 * @param {string} format If 'fire', reformats response as common fire weather object,
 * anything else returns raw tomorrow.io response
 * @returns {array} Array of hourly weather records dictated by the *format* arg.
 */
export const getTimelines = async (lat, lon, startTime, endTime, timezone = 'UTC', format = 'fire') => {
  // set the Timelines GET endpoint as the target URL
  const url = tomorrow.url // 'https://api.tomorrow.io/v4/timelines'
  const apikey = tomorrow.apiKey // get your key from app.tomorrow.io/development/keys
  const location = [lat, lon] // pick the location, as a lat, lon pair
  const units = 'imperial' // choose the unit system, either 'metric' or 'imperial'
  const timesteps = ['1h'] // set the timesteps, like "current", "1h" and "1d"
  // requested fields
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
    // 'moonPhase', // not allowed for 1-h timelines
    // 'sunriseTime', // not allowed for 1-h timelines
    // 'sunsetTime' // not allowed for 1-h timelines
  ]

  // request the timelines with all the query string parameters as options
  const parms = queryString.stringify({
    apikey,
    location,
    fields,
    units,
    timesteps,
    startTime,
    endTime,
    timezone
  }, { arrayFormat: 'comma' })

  const request = await fetch(url + '?' + parms, { method: 'GET' })
    .catch((error) => console.error('Tomorrow.io query error: ' + error))
  const json = await request.json()
  // console.log(JSON.stringify(json, null, ' '))
  const records = (format === 'fire') ? asFireWeather(json) : asTomorrow(json)
  return records
}

// Repackages all the 'tomorrow' api custom fields and returns them
function asTomorrow (json) {
  const records = []
  const intervals = json.data.timelines[0].intervals // this is the '1h' timeline
  intervals.forEach(interval => {
    const wx = interval.values
    wx.date = interval.startTime.substr(0, 10)
    wx.time = interval.startTime.substr(11, 5)
    records.push(wx)
  })
  return records
}

// Repackages fire weather fields into a common format
function asFireWeather (json) {
  const records = []
  const intervals = json.data.timelines[0].intervals // this is the '1h' timeline
  intervals.forEach(interval => {
    const wx = interval.values
    records.push({
      date: interval.startTime.substr(0, 10),
      time: interval.startTime.substr(11, 5),
      dryBulb: wx.temperature, // dry bulb temperature at 2-m (oF)
      humidity: wx.humidity, // relative humidity (%)
      dewPoint: wx.dewPoint, // dewpoint temperature at 2-m (oF)
      windSpeed: wx.windSpeed, // wind speed at 10-m (mi/h)
      windGust: wx.windGust, // maximum brief increase in wind speed at 10-m, usually less than 20 seconds (mi/h)
      windFrom: wx.windDirection, // direction from which the wind originates, degrees clockwise from north
      precipRate: wx.precipitationIntensity, // in/hr
      precipProb: wx.precipitationProbability, // %
      cloudCover: wx.cloudCover, // %
      visibility: wx.visibility, // mi
      wthrCode: wx.weatherCode, // code
      feelsLike: wx.temperatureApparent, // apparent temperature at 2-m (oF)
      atmSurface: wx.pressureSurfaceLevel, // weight of the air above the surface (at the surface level) (in/Hg)
      // Items below here are unique to this service
      precipType: wx.precipitationType, // 0=N/A 1=Rain 2=Snow 3=Freezing Rain 4=Ice Pellets
      atmSea: wx.pressureSeaLevel, // weight of the air above the surface (at mean sea level) (in/Hg)
      cloudBase: wx.cloudBase, // mi
      cloudCeil: wx.cloudCeiling, // mi
      fwi: wx.fireIndex, // Fosberg Fire Weather Index
      snowAcc: wx.snowAccumulation, // The trailing amount of new snowfall that has or will have occurred over the last hour of the requested time (in)
      iceAcc: wx.iceAccumulation, // The trailing amount of ice that has or will have occurred over the last hour of the requested time (in)
      soilMois0: wx.soilMoistureVolumetric0To10, // % at 0-10 cm
      soilTemp0: wx.soilTemperature0To10, // oF
      solarGHI: wx.solarGHI, // Btu/ft2  (total amount of shortwave radiation received from above by a surface horizontal to the ground)
      solarDNI: wx.solarDNI, // Btu/ft2 (diffuse (i.e., scattered) component of GHI reaching the surface of the earth at each point)
      solarDHI: wx.solarDHI // Btu/ft2 (direct component of GHI reaching the surface of the earth at each point)
    })
  })
  return records
}
