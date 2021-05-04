// - 500 calls/day, 25 calls/hour, 3 calls/sec
// - current weather by hour and minute
// - 3 day forecast
// - 6 hours historical
export const tomorrow = {
  url: 'https://api.tomorrow.io/v4/timelines',
  apiKey: 'Vp91CwZKe0rPFd8ZDry5hKyVyOp2I4aC'
}

// weatherapi
// 1,000,000 calls/month
// - 3 day city and town weather, daily and hourly
// - no solar radiation
export const weatherapiAstronomy = {
  url: 'http://api.weatherapi.com/v1/astronomy.json',
  key: 'key=43956b1f6760417db1d182743212704',
  parms: 'q=46.85714,-114.0073&dt=1952-09-04'
}

export const weatherapiForecast = {
  url: 'http://api.weatherapi.com/v1/forecast.json',
  key: 'key=43956b1f6760417db1d182743212704',
  parms: '&days=3&q=46.85714,-114.0073&aqi=no&alerts=no'
}
