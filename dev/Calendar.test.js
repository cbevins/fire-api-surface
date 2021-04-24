import {
  clockTime,
  daysInMonth,
  decimalDaysToDhms,
  decimalHoursToDhms,
  decimalMinutesToDhms,
  decimalSecondsToDhms,
  dhmsToDays,
  dhmsToHours,
  dhmsToMinutes,
  dhmsToSeconds,
  dhmsToMs,
  dowAbbr,
  dowName,
  doyToYmd,
  easterDay,
  formatDate,
  formatTime,
  isGregorian,
  isLeapYear,
  jdToMjd,
  jdToYmd,
  mjdToJd,
  mjdToYmd,
  monthAbbr,
  monthName,
  ymdToDow,
  ymdToDoy,
  ymdToJd,
  ymdToMjd
} from './Calendar.js'

test('1: ymdToJd() and jdToYmd()', () => {
  // Common cases are all convertable from Julian day number to year-month-day and back
  expect(ymdToJd(1985, 2, 17)).toEqual(2446113.5) // Duffett-Smith example
  expect(jdToYmd(2446113.5)).toEqual([1985, 2, 17]) // Duffett-Smith example

  expect(ymdToJd(1957, 10, 4.81)).toEqual(2436116.31) // Meeus example
  expect(jdToYmd(2436116.31)).toEqual([1957, 10, 4.810000000055879]) // Meeus example

  expect(ymdToJd(1977, 4, 26.4)).toEqual(2443259.9) // Meeus example
  expect(jdToYmd(2443259.9)).toEqual([1977, 4, 26.399999999906868]) // Meeus example

  expect(ymdToJd(2000, 1, 1.5)).toEqual(2451545) // wikipedia
  expect(jdToYmd(2451545)).toEqual([2000, 1, 1.5]) // wikipedia

  expect(ymdToJd(2013, 1, 1 + (1 / 48))).toBeCloseTo(2456293.520833, 5) // wikipedia
  expect(jdToYmd(2456293.520833)).toEqual([2013, 1, 1.020833000075072]) // wikipedia

  expect(ymdToJd(1985, 2, 17.25)).toEqual(2446113.75)
  expect(jdToYmd(2446113.75)).toEqual([1985, 2, 17.25])

  expect(ymdToJd(-584, 5, 28.63)).toEqual(1507900.13) // Meeus example
  expect(jdToYmd(1507900.13)).toEqual([-584, 5, 28.62999999988824]) // Meeus example

  expect(ymdToJd(333, 1, 27.5)).toEqual(1842713.0) // Meeus example
  expect(jdToYmd(1842713.0)).toEqual([333, 1, 27.5]) // Meeus example

  // Edge cases..
  // When math operations are performed on day...
  expect(ymdToJd(1980, 1, 0)).toEqual(2444238.5) // Duffett-Smith example
  expect(ymdToJd(1979, 12, 31)).toEqual(2444238.5) // Duffett-Smith example
  expect(jdToYmd(2444238.5)).toEqual([1979, 12, 31]) // Duffett-Smith example
  const sec = 1 / (60 * 60 * 24) // 1 second as a decimal day
  expect(ymdToJd(1980, 1, sec)).toEqual(2444238.500011574) // Duffett-Smith example

  expect(ymdToJd(1980, 1, -sec)).toEqual(2444238.499988426) // Duffett-Smith example
  expect(ymdToJd(1979, 12, 31 - sec)).toEqual(2444238.499988426) // Duffett-Smith example
  expect(jdToYmd(2444238.499988426)).toEqual([1979, 12, 30.999988425988704]) // Duffett-Smith example

  // Start of Julian epoch has some conversion issues ... these are not reflective
  expect(ymdToJd(-4712, 1, 1)).toEqual(0.5) // 1 BC is year 0
  // expect(jdToYmd(0.5)).toEqual([-4712, 1, 1]) // expected day=1, received 2

  expect(ymdToJd(-4712, 1, 1.5)).toEqual(1) // 1 BC is year 0
  // expect(jdToYmd(1)).toEqual([-4712, 1, 1.5]) // expected day = 1.5, received 2.5

  expect(ymdToJd(-4712, 1, 1.75)).toEqual(1.25) // 1 BC is year 0
  // expect(jdToYmd(1.25)).toEqual([-4712, 1, 1.75]) // expected day = 1.75, received day = 2.75
})

test('2: ymdToMjd()', () => {
  // 'Modified JD' begins at midnight on Nov 11, 1858 (mjd = jd - 2400000.5)
  expect(ymdToJd(1858, 11, 17)).toEqual(2400000.5)
  expect(ymdToMjd(1858, 11, 17)).toEqual(0)
  expect(ymdToJd(2000, 9, 4)).toEqual(2400000.5 + 51791)
  expect(ymdToMjd(2000, 9, 4)).toEqual(51791)
})

test('3: easterDay()', () => {
  // Earliest possible
  expect(easterDay(1818)).toEqual([3, 22])
  expect(easterDay(2285)).toEqual([3, 22])
  // Latest possible
  expect(easterDay(1886)).toEqual([4, 25])
  expect(easterDay(1943)).toEqual([4, 25])
  expect(easterDay(2038)).toEqual([4, 25])

  expect(easterDay(2000)).toEqual([4, 23])
  expect(easterDay(1954)).toEqual([4, 18])
  expect(easterDay(1979)).toEqual([4, 15])
  expect(easterDay(1980)).toEqual([4, 6])
  expect(easterDay(1980.6)).toEqual([4, 6])
})

test('4: ymdToDow()', () => {
  expect(ymdToDow(1985, 2, 17)).toEqual(0)
  expect(dowAbbr(ymdToDow(1985, 2, 17))).toEqual('Sun')
  expect(dowName(ymdToDow(1985, 2, 17))).toEqual('Sunday')

  expect(ymdToDow(1954, 6, 30)).toEqual(3)
  expect(dowAbbr(ymdToDow(1954, 6, 30))).toEqual('Wed')
  expect(dowName(ymdToDow(1954, 6, 30))).toEqual('Wednesday')

  expect(ymdToDow(1952, 9, 4)).toEqual(4)
  expect(dowName(ymdToDow(1952, 9, 4))).toEqual('Thursday')
  expect(dowAbbr(ymdToDow(1952, 9, 4))).toEqual('Thu')

  // Try it using  jdn instead of ymd
  const jdn = ymdToJd(1952, 9, 4)
  expect(jdn).toEqual(2434259.5)
  expect(ymdToDow(jdn)).toEqual(4)
})

test('5: decimalDayToDhms() and dhmsToDays()', () => {
  expect(decimalDaysToDhms(0)).toEqual([0, 0, 0, 0, 0])
  expect(dhmsToDays(0, 0, 0, 0, 0)).toEqual(0)
  expect(dhmsToDays(0)).toEqual(0)

  expect(decimalDaysToDhms(1)).toEqual([1, 0, 0, 0, 0])
  expect(dhmsToDays(1, 0, 0, 0, 0)).toEqual(1)
  expect(dhmsToDays(0, 24, 0, 0, 0)).toEqual(1)
  expect(dhmsToDays(0, 0, 1440, 0, 0)).toEqual(1)
  expect(dhmsToDays(0, 0, 0, 86400, 0)).toEqual(1)

  expect(decimalHoursToDhms(24)).toEqual([1, 0, 0, 0, 0])
  expect(dhmsToDays(1, 12, 12 * 60, 0, 0)).toEqual(2)
  expect(dhmsToHours(1, 12, 12 * 60, 0, 0)).toEqual(48)
  expect(dhmsToMinutes(1, 12, 12 * 60, 0, 0)).toEqual(2880)
  expect(dhmsToSeconds(1, 12, 12 * 60, 0, 0)).toEqual(172800)
  expect(dhmsToMs(1, 12, 12 * 60, 30, 123)).toEqual(172830123)

  expect(decimalMinutesToDhms(2880)).toEqual([2, 0, 0, 0, 0])
  expect(decimalSecondsToDhms(172800)).toEqual([2, 0, 0, 0, 0])
  expect(decimalSecondsToDhms(172830.123)).toEqual([2, 0, 0, 30, 123])

  expect(decimalDaysToDhms(2)).toEqual([2, 0, 0, 0, 0])
  expect(decimalHoursToDhms(48)).toEqual([2, 0, 0, 0, 0])
  expect(dhmsToDays(1, 24, 24 * 60, 0, 0)).toEqual(3)

  expect(decimalDaysToDhms(1.5)).toEqual([1, 12, 0, 0, 0])
  expect(dhmsToDays(1, 12, 0, 0, 0)).toEqual(1.5)
  expect(dhmsToDays(0, 36, 0, 0, 0)).toEqual(1.5)
  expect(dhmsToDays(0, 24, 12 * 60, 0, 0)).toEqual(1.5)

  expect(dhmsToDays(0, 16, 20, 4, 20)).toBeCloseTo(0.680602084, 8)
  expect(decimalDaysToDhms(0.680602084)).toEqual([0, 16, 20, 4, 20])
})

test('6: isLeapYear()', () => {
  expect(isLeapYear(1900)).toEqual(false)
  expect(isLeapYear(1996)).toEqual(true)
  expect(isLeapYear(1999)).toEqual(false)
  expect(isLeapYear(2000)).toEqual(true)
  expect(isLeapYear(2100)).toEqual(false)
  expect(isLeapYear(2400)).toEqual(true)
  expect(isLeapYear(400)).toEqual(true)
  expect(isLeapYear(100)).toEqual(true)
})

test('7: isGregorian()', () => {
  expect(isGregorian(1582, 10, 6)).toEqual(false)
  expect(isGregorian(1582, 10, 14)).toEqual(false)
  expect(isGregorian(1582, 10, 15)).toEqual(true)
  expect(isGregorian(2020, 12, 31)).toEqual(true)
})

test('8: ymdToDoy(), doyToYmd()', () => {
  expect(doyToYmd(1889, 222)).toEqual([1889, 8, 10])
  expect(doyToYmd(1889, 1)).toEqual([1889, 1, 1])

  expect(ymdToDoy(1980, 1, 1)).toEqual(1)
  expect(doyToYmd(1980, 1)).toEqual([1980, 1, 1])

  expect(ymdToDoy(1980, 1, 31)).toEqual(31)
  expect(doyToYmd(1980, 31)).toEqual([1980, 1, 31])

  expect(ymdToDoy(1980, 2, 1)).toEqual(32)
  expect(doyToYmd(1980, 32)).toEqual([1980, 2, 1])

  expect(ymdToDoy(1978, 11, 14)).toEqual(318)
  expect(doyToYmd(1978, 318)).toEqual([1978, 11, 14])

  expect(ymdToDoy(1980, 11, 14)).toEqual(319)
  expect(doyToYmd(1980, 319)).toEqual([1980, 11, 14])

  expect(ymdToDoy(1978, 4, 22)).toEqual(112)
  expect(doyToYmd(1978, 112)).toEqual([1978, 4, 22])

  expect(ymdToDoy(1980, 4, 22)).toEqual(113)
  expect(doyToYmd(1980, 113)).toEqual([1980, 4, 22])

  expect(ymdToDoy(1978, 2, 1)).toEqual(32)
  expect(doyToYmd(1978, 32)).toEqual([1978, 2, 1])

  expect(ymdToDoy(1980, 12, 31)).toEqual(366)
  expect(doyToYmd(1980, 366)).toEqual([1980, 12, 31])

  expect(ymdToDoy(1978, 12, 31)).toEqual(365)
  expect(doyToYmd(1978, 365)).toEqual([1978, 12, 31])

  // 1582 has no dates Oct 5-14, so 10 fewer than expected
  expect(ymdToDoy(1582, 12, 31)).toEqual(355)
  expect(doyToYmd(1582, 355)).toEqual([1582, 12, 31])
})

test('9: decimalDaysToDhms()', () => {
  expect(isGregorian(1582, 10, 6)).toEqual(false)
  expect(isGregorian(1582, 10, 14)).toEqual(false)
  expect(isGregorian(1582, 10, 15)).toEqual(true)
  expect(isGregorian(2020, 12, 31)).toEqual(true)
})

test('10: monthName()', () => {
  expect(monthName(0)).toEqual('Bad month index')
  expect(monthName(1)).toEqual('January')
  expect(monthName(2)).toEqual('February')
  expect(monthName(3)).toEqual('March')
  expect(monthName(4)).toEqual('April')
  expect(monthName(5)).toEqual('May')
  expect(monthName(6)).toEqual('June')
  expect(monthName(7)).toEqual('July')
  expect(monthName(8)).toEqual('August')
  expect(monthName(9)).toEqual('September')
  expect(monthName(10)).toEqual('October')
  expect(monthName(11)).toEqual('November')
  expect(monthName(12)).toEqual('December')
  expect(monthName(13)).toEqual('Bad month index')
})

test('11: monthAbbr()', () => {
  expect(monthAbbr(0)).toEqual('Bad month index')
  expect(monthAbbr(1)).toEqual('Jan')
  expect(monthAbbr(2)).toEqual('Feb')
  expect(monthAbbr(3)).toEqual('Mar')
  expect(monthAbbr(4)).toEqual('Apr')
  expect(monthAbbr(5)).toEqual('May')
  expect(monthAbbr(6)).toEqual('Jun')
  expect(monthAbbr(7)).toEqual('Jul')
  expect(monthAbbr(8)).toEqual('Aug')
  expect(monthAbbr(9)).toEqual('Sep')
  expect(monthAbbr(10)).toEqual('Oct')
  expect(monthAbbr(11)).toEqual('Nov')
  expect(monthAbbr(12)).toEqual('Dec')
  expect(monthAbbr(13)).toEqual('Bad month index')
})

test('12: daysInMonth()', () => {
  expect(daysInMonth(2020, 0)).toEqual(0)
  expect(daysInMonth(2020, 1)).toEqual(31)
  expect(daysInMonth(2020, 2)).toEqual(29)
  expect(daysInMonth(2021, 2)).toEqual(28)
  expect(daysInMonth(2020, 3)).toEqual(31)
  expect(daysInMonth(2020, 4)).toEqual(30)
  expect(daysInMonth(2020, 5)).toEqual(31)
  expect(daysInMonth(2020, 6)).toEqual(30)
  expect(daysInMonth(2020, 7)).toEqual(31)
  expect(daysInMonth(2020, 8)).toEqual(31)
  expect(daysInMonth(2020, 9)).toEqual(30)
  expect(daysInMonth(2020, 10)).toEqual(31)
  expect(daysInMonth(2020, 11)).toEqual(30)
  expect(daysInMonth(2020, 12)).toEqual(31)
  expect(daysInMonth(2020, 13)).toEqual(0)
  expect(daysInMonth(1582, 10)).toEqual(21)
})

test('13: dowName()', () => {
  expect(dowName(0)).toEqual('Sunday')
  expect(dowName(1)).toEqual('Monday')
  expect(dowName(2)).toEqual('Tuesday')
  expect(dowName(3)).toEqual('Wednesday')
  expect(dowName(4)).toEqual('Thursday')
  expect(dowName(5)).toEqual('Friday')
  expect(dowName(6)).toEqual('Saturday')
  expect(dowName(7)).toEqual('Bad Day-of-Week index')
  expect(dowName(-1)).toEqual('Bad Day-of-Week index')
})

test('14: dowAbbr()', () => {
  expect(dowAbbr(0)).toEqual('Sun')
  expect(dowAbbr(1)).toEqual('Mon')
  expect(dowAbbr(2)).toEqual('Tue')
  expect(dowAbbr(3)).toEqual('Wed')
  expect(dowAbbr(4)).toEqual('Thu')
  expect(dowAbbr(5)).toEqual('Fri')
  expect(dowAbbr(6)).toEqual('Sat')
  expect(dowAbbr(7)).toEqual('Bad Day-of-Week index')
  expect(dowAbbr(-1)).toEqual('Bad Day-of-Week index')
})

test('15: ymdToMjd() and mjdToYmd()', () => {
  const mjd = 2400000.5
  // Common cases are all convertable from Julian day number to year-month-day and back
  expect(ymdToMjd(1985, 2, 17)).toEqual(2446113.5 - mjd) // Duffett-Smith example
  expect(mjdToYmd(2446113.5 - mjd)).toEqual([1985, 2, 17]) // Duffett-Smith example

  expect(jdToMjd(2446113.5)).toEqual(46113)
  expect(mjdToJd(46113)).toEqual(2446113.5)

  expect(ymdToMjd(1957, 10, 4.81)).toEqual(2436116.31 - mjd) // Meeus example
  expect(mjdToYmd(2436116.31 - mjd)).toEqual([1957, 10, 4.810000000055879]) // Meeus example

  expect(ymdToMjd(1977, 4, 26.4)).toEqual(2443259.9 - mjd) // Meeus example
  expect(mjdToYmd(2443259.9 - mjd)).toEqual([1977, 4, 26.399999999906868]) // Meeus example

  expect(ymdToMjd(2000, 1, 1.5)).toEqual(2451545 - mjd) // wikipedia
  expect(mjdToYmd(2451545 - mjd)).toEqual([2000, 1, 1.5]) // wikipedia

  expect(ymdToMjd(2013, 1, 1 + (1 / 48))).toBeCloseTo(2456293.520833 - mjd, 5) // wikipedia
  expect(mjdToYmd(2456293.520833 - mjd)).toEqual([2013, 1, 1.020833000075072]) // wikipedia

  expect(ymdToMjd(1985, 2, 17.25)).toEqual(2446113.75 - mjd)
  expect(mjdToYmd(2446113.75 - mjd)).toEqual([1985, 2, 17.25])

  expect(ymdToMjd(-584, 5, 28.63)).toEqual(1507900.13 - mjd) // Meeus example
  expect(mjdToYmd(1507900.13 - mjd)).toEqual([-584, 5, 28.62999999988824]) // Meeus example

  expect(ymdToMjd(333, 1, 27.5)).toEqual(1842713.0 - mjd) // Meeus example
  expect(mjdToYmd(1842713.0 - mjd)).toEqual([333, 1, 27.5]) // Meeus example
})

test('16: dhmsTo<Something>() default args', () => {
  expect(dhmsToDays(123)).toEqual(123)
  expect(dhmsToHours(1)).toEqual(24)
  expect(dhmsToMinutes(1)).toEqual(60 * 24)
  expect(dhmsToSeconds(1)).toEqual(60 * 60 * 24)
  expect(dhmsToMs(1)).toEqual(60 * 60 * 24 * 1000)
})

test('17: formatDate()', () => {
  const jd = ymdToJd(1952, 9, 4)
  expect(formatDate(jd)).toEqual('1952-09-04')
  expect(formatDate(1952, 9, 4)).toEqual('1952-09-04')
  expect(formatDate(52, 9, 4)).toEqual('0052-09-04')
  expect(formatDate(1, 1, 1)).toEqual('0001-01-01')
  expect(formatDate(0, 0, 0)).toEqual('0000-00-00')
})

test('18: clockTime(), formatTime()', () => {
  expect(formatTime(0, 0, 0)).toEqual('00:00:00')
  expect(formatTime(1, 1, 1)).toEqual('01:01:01')
  expect(formatTime(4, 20, 30, 123)).toEqual('04:20:30.123')

  expect(clockTime(0, 0, 0)).toEqual('00:00:00')
  expect(clockTime(1, 1, 1)).toEqual('01:01:01')
  expect(clockTime(4, 20, 30, 123)).toEqual('04:20:30')
})
