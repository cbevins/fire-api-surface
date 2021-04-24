/**
 * The following functions are taken from:
 * https://www.movable-type.co.uk/scripts/latlong.html
 * and adapted from his dms.js and latlon-spherical.js files.
 *
 * From the author:
 *
 * "This function uses the ‘haversine’ formula to calculate the great-circle distance
 * between two points – that is, the shortest distance over the earth’s surface –
 * giving an ‘as-the-crow-flies’ distance between the points."
 *
 * "The haversine formula1 ‘remains particularly well-conditioned for numerical
 * computa­tion even at small distances’ – unlike calcula­tions based on the
 * spherical law of cosines. The ‘(re)versed sine’ is 1−cosθ, and the ‘half-versed-sine’
 * is (1−cosθ)/2 or sin²(θ/2) as used above. Once widely used by navigators,
 * it was described by Roger Sinnott in Sky & Telescope magazine in 1984
 * (“Virtues of the Haversine”): Sinnott explained that the angular separa­tion
 * between Mizar and Alcor in Ursa Major – 0°11′49.69″ – could be accurately
 * calculated in Basic on a TRS-80 using the haversine."
 *
 * "In fact, JavaScript (and most modern computers & languages) use ‘IEEE 754’
 * 64-bit floating-point numbers, which provide 15 significant figures of precision.
 * By my estimate, with this precision, the simple spherical law of cosines formula
 * (cos c = cos a cos b + sin a sin b cos C) gives well-condi­tioned results
 * down to distances as small as a few metres on the earth’s surface.
 * (Note that the geodetic form of the law of cosines is rearranged from the
 * canonical one so that the latitude can be used directly, rather than the colatitude)."
 *
 * This makes the simpler law of cosines a reasonable 1-line alternative to the
 * haversine formula for many geodesy purposes (if not for astronomy).
 * The choice may be driven by programming language, processor, coding context,
 * available trig func­tions (in different languages), etc – and, for very small distances an equirectangular approxima­tion may be more suitable.
 *
 * */

// R is the earth’s radius (mean radius = 6,371km)
const R = 6371e3 // metres

/**
 * @param {number} lat1 decimal degrees north (+) or south (-)
 * @param {number} lon1 decimal degrees east (+) or west (-)
 * @param {number} lat2 decimal degrees north (+) or south (-)
 * @param {number} lon2 decimal degrees east (+) or west (-)
 * @param {bool} haversine If TRUE, haversine method is applied
 *  If FALSE, simple spherical law of cosines methodis applied.
 * @returns {number} Great circle distance between the two points (m)
 */
export function distance (lat1, lon1, lat2, lon2, haversine = true) {
  // Convert latitude (φ) and longitude (λ) to radians
  const φ1 = lat1 * Math.PI / 180
  const φ2 = lat2 * Math.PI / 180
  const Δφ = (lat2 - lat1) * Math.PI / 180
  const Δλ = (lon2 - lon1) * Math.PI / 180
  let c
  // haversine method:
  if (haversine) {
  // 'a' is the square of half the chord length between the points
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    // 'c' is the angular distance in radians
    c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  } else {
  // simple spherical law of cosines method:
    c = Math.acos(Math.sin(φ1) * Math.sin(φ2) + Math.cos(φ1) * Math.cos(φ2) * Math.cos(Δλ))
  }
  // 'd' is the distance in metres
  const d = R * c
  return d
}

/**
 * Calculates destination [lat, lon] from an initial [lat,lon], bearing, and distance.
 * @param {number} lat starting point decimal degrees north (+) or south (-)
 * @param {number} lon starting point decimal degrees east (+) or west (-)
 * @param {number} brng direction of travel (bearing) in decimal degrees from north
 * @param {number} d distance traveled (m)
 * @returns {array|number} [lat1, lon1]
 *  - lat1 ending point decimal degrees north (+) or south (-)
 *  - lon1 ending point decimal degrees east (+) or west (-)
 */
export function destination (lat, lon, brng, d) {
  // R is the earth’s radius (mean radius = 6,371km)
  const R = 6371e3 // metres
  // Convert latitude (φ) and longitude (λ) to radians
  const φ1 = lat * Math.PI / 180
  const λ1 = lon * Math.PI / 180

  const φ2 = Math.asin(Math.sin(φ1) * Math.cos(d / R) +
    Math.cos(φ1) * Math.sin(d / R) * Math.cos(brng))
  const λ2 = λ1 + Math.atan2(Math.sin(brng) * Math.sin(d / R) * Math.cos(φ1),
    Math.cos(d / R) - Math.sin(φ1) * Math.sin(φ2))
  return [φ2 * 180 / Math.PI, λ2 * 180 / Math.PI]
}
