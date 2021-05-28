import { EsaMapQuest } from './EsaMapQuest.js'
import { EsaUsgs } from './EsaUsgs.js'

const M = { name: 'The "M"', lat: 46.859340, lon: -113.975528 }
const mapq = new EsaMapQuest()
const usgs = new EsaUsgs()

function report (source, result) {
  console.log('source', source)
  // console.log('result', result)
  // console.log('lat', mapq._lat, 'lon', mapq._lon, 'deg', mapq._deg, 'rad', mapq._rad)
  // console.log('ns', mapq._ns, 'ew', mapq._ew)
  // console.log(mapq._grid)
}

async function runParallel () {
  // Schedule first...
  const pending = Promise.all([
    mapq.load(M.lat, M.lon),
    usgs.load(M.lat, M.lon)
  ])
  // ... `await` later.
  const [mq, us] = await pending
  // .. then do something with it
  report('MapQuest', mq)
  report('USGS', us)
}

function runSerial () {
  mapq.load(M.lat, M.lon).then(result => report('MapQuest', result))
  usgs.load(M.lat, M.lon).then(result => report('USGS', result))
}

runParallel()
