/*! \file globalposition.cpp
 *  The GlobalPosition class, along with the DateTime class,  provide a C++
 *  wrapper for the Calender-Date-Time Library in cdtlib.c.
 */

export class GlobalPosition {
  /**
   * Constructs a new GlobalPosition instance with the passed values.
   *
   * @param {number} latitude Latitude in degrees east (+) or west (-) of Greenwich
   * @param {number} longitude Longitude in degrees north (+) or south (-) of equator
   * @param {number} gmtDiff Local time difference from GMT in hours (localTime = gmtDiff + GMT)
   * @param {string} locationName Arbitrary location name
   * @param {zoneName} zoneName Time zone name
   * @returns {GlobalPosition} Reference to *this*.
   */
  constructor (lat, lon, gmtDiff = 0, zoneName = '', locationName = '') {
    this._lat = lat
    this._lon = lon
    this._gmt = gmtDiff
    this._locationName = locationName
    this._zoneName = zoneName
  }

  /**
   * Returns the position's time difference (hours) from GMT
   * @returns {number} Local time difference from GMT in hours.
   */
  gmtDiff () { return this._gmt }

  /**
   * Sets the position's local time difference from GMT.
   *
   * @param {number} hours Local time difference from GMT in hours.
   * @returns {GlobalPosition} Reference to *this*.
   */
  setGmtDiff (hours) {
    this._gmt = hours
    return this
  }

  /**
   * Gets the position's latitude.
   *
   * @returns {number} Latitude in degrees north (+) or south (-) of the equator.
   */
  latitude () { return this._lat }

  /**
   * Sets the position's latitude.
   *
   * @param {number} latitude Latitude in degrees north (+) or south (-) of the equator.
   * @returns {GlobalPosition} Reference to *this*.
   */
  setLatitude (degrees) {
    this._lat = degrees
    return this
  }

  /**
   * Gets the position's location name.
   * @returns {string} The position location name.
   */
  locationName () { return this._locationName }

  /**
   * Sets the position's location name.
   *
   * @param {string} locationName New location name
   * @returns {GlobalPosition} Reference to *this*.
   */
  setLocationName (locationName) {
    this._locationName = locationName
    return this
  }

  /**
   * Gets the position's longtude.
   *
   * @returns {number} Longitude in degrees east (+) or west (-) of Greenwich Meridian.
   */
  longitude () { return this._lon }

  /**
   * Sets the position's longitude.
   *
   * @param {number} longitude Longitude in degrees east (+) or west (-) of Greenwich Meridian.
   * @returns {GlobalPosition} Reference to *this*.
   */
  setLongitude (degrees) {
    this._lon = degrees
    return this
  }

  /**
 * Sets all the position's properties.
 *
 * @param {number} latitude Latitude in degrees east (+) or west (-) of Greenwich
 * @param {number} longitude Longitude in degrees north (+) or south (-) of equator
 * @param {number} gmtDiff Local time difference from GMT in hours (localTime = gmtDiff + GMT)
 * @param {string} locationName Arbitrary location name
 * @param {zoneName} zoneName Time zone name
   * @returns {GlobalPosition} Reference to *this*.
 */
  setPosition (longitude, latitude, gmtDiff, zoneName = null, locationName = null) {
    this._lon = longitude
    this._lat = latitude
    this._gmt = gmtDiff
    this._zoneName = zoneName === null ? this._zoneName : zoneName
    this._locationName = locationName === null ? this._locationName : locationName
    return this
  }

  /**
   * Gets the position's time zone name.
   * @returns {string} The time zone name
   */
  timeZoneName () { return this._zoneName }

  /**
   * Sets the position's time zone name
   *
   * @param {string} zoneName New time zone name
   * @returns {GlobalPosition} Reference to *this*.
   */
  setTimeZoneName (zoneName) {
    this._zoneName = zoneName
    return this
  }

  /**
 * Convenience routine to convert integral degrees, minutes, and seconds into decimal degrees.
 * No sign adjustment is made for east/west or north/south.
 *
 * @param {integer} degrees arc degrees
 * @param {integer} minutes degree arc-minutes
 * @param {number} seconds degree arc seconds
 * @returns {number} Decimal degrees.
 */
  dmsToDeg (degrees, minutes, seconds) { return degrees + minutes / 60 + seconds / 3600 }

  /**
 * Convenience routine to convert decimal degrees to integral degrees, minutes, and seconds.
 * No sign conversion is made for north/south or east/west.
 *
 * @param {number} Decimal degrees
 * @returns {array} [integerDegrees, integerMinutes, floatSeconds]
 */
  degToDms (decimal) {
    let d = Math.abs(decimal)
    const degrees = Math.floor(d)
    d = 60 * (d - degrees)
    const minutes = Math.floor(d)
    const seconds = 60 * (d - minutes)
    return [degrees, minutes, seconds]
  }
}
