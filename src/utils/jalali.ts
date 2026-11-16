import * as jalaali from 'jalaali-js'

export const JALALI_MONTH_NAMES = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
] as const

export const PERSIAN_WEEKDAYS_FULL = [
  'شنبه',
  'یکشنبه',
  'دوشنبه',
  'سه‌شنبه',
  'چهارشنبه',
  'پنجشنبه',
  'جمعه',
] as const

export const PERSIAN_WEEKDAYS_SHORT = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'] as const

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']

export function toPersianDigits(input: string | number | undefined | null): string {
  if (input === undefined || input === null) return ''
  return String(input).replace(/\d/g, (d) => PERSIAN_DIGITS[Number(d)] ?? d)
}

export function toEnglishDigits(input: string): string {
  return input
    .replace(/[۰-۹]/g, (ch) => String(ch.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (ch) => String(ch.charCodeAt(0) - 1632))
}

export function pad2(num: number): string {
  return String(num).padStart(2, '0')
}

export interface JalaliParts {
  jy: number
  jm: number
  jd: number
}

export function getTodayJalaliParts(): JalaliParts {
  const now = new Date()
  return jalaali.toJalaali(now.getFullYear(), now.getMonth() + 1, now.getDate())
}

export function formatJalaliCanonical(jy: number, jm: number, jd: number): string {
  return `${jy}/${pad2(jm)}/${pad2(jd)}`
}

export function getTodayJalali(): string {
  const { jy, jm, jd } = getTodayJalaliParts()
  return formatJalaliCanonical(jy, jm, jd)
}

export function parseJalaliDate(jalaliStr: string): JalaliParts | null {
  if (!jalaliStr) return null
  const normalized = toEnglishDigits(jalaliStr.trim()).replace(/-/g, '/')
  const match = normalized.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/)
  if (!match) return null
  const jy = Number(match[1])
  const jm = Number(match[2])
  const jd = Number(match[3])
  if (!jalaali.isValidJalaaliDate(jy, jm, jd)) return null
  return { jy, jm, jd }
}

export function normalizeJalaliString(jalaliStr: string): string {
  const parsed = parseJalaliDate(jalaliStr)
  if (!parsed) return jalaliStr
  return formatJalaliCanonical(parsed.jy, parsed.jm, parsed.jd)
}

/**
 * Returns Persian weekday index where 0 = شنبه (Saturday) ... 6 = جمعه (Friday)
 */
export function getPersianWeekdayIndex(jy: number, jm: number, jd: number): number {
  const g = jalaali.toGregorian(jy, jm, jd)
  const jsDay = new Date(g.gy, g.gm - 1, g.gd).getDay()
  return (jsDay + 1) % 7
}

export function getJalaliMonthDaysCount(jy: number, jm: number): number {
  return jalaali.jalaaliMonthLength(jy, jm)
}

export function formatJalaliDisplay(jalaliStr: string): string {
  const parsed = parseJalaliDate(jalaliStr)
  if (!parsed) return toPersianDigits(jalaliStr)
  return toPersianDigits(formatJalaliCanonical(parsed.jy, parsed.jm, parsed.jd))
}

export function formatJalaliLong(jalaliStr: string, includeWeekday = true): string {
  const parsed = parseJalaliDate(jalaliStr)
  if (!parsed) return toPersianDigits(jalaliStr)
  const monthName = JALALI_MONTH_NAMES[parsed.jm - 1] || ''
  const dayStr = toPersianDigits(parsed.jd)
  const yearStr = toPersianDigits(parsed.jy)
  if (!includeWeekday) {
    return `${dayStr} ${monthName} ${yearStr}`
  }
  const weekday = PERSIAN_WEEKDAYS_FULL[getPersianWeekdayIndex(parsed.jy, parsed.jm, parsed.jd)]
  return `${weekday} ${dayStr} ${monthName} ${yearStr}`
}

export function formatJalaliMonthYear(jy: number, jm: number): string {
  const monthName = JALALI_MONTH_NAMES[jm - 1] || ''
  return `${monthName} ${toPersianDigits(jy)}`
}

export function getIsoNowJalaliStamp(): string {
  const now = new Date()
  const { jy, jm, jd } = jalaali.toJalaali(now.getFullYear(), now.getMonth() + 1, now.getDate())
  const hh = pad2(now.getHours())
  const mm = pad2(now.getMinutes())
  return toPersianDigits(`${jy}/${pad2(jm)}/${pad2(jd)} - ساعت ${hh}:${mm}`)
}

export interface CalendarDayCell {
  jy: number
  jm: number
  jd: number
  canonical: string
  isCurrentMonth: boolean
  isToday: boolean
  isFriday: boolean
}

export function buildJalaliMonthMatrix(jy: number, jm: number): CalendarDayCell[] {
  const today = getTodayJalali()
  const firstWeekday = getPersianWeekdayIndex(jy, jm, 1) // 0=Sat..6=Fri
  const daysInMonth = getJalaliMonthDaysCount(jy, jm)

  const prevJm = jm === 1 ? 12 : jm - 1
  const prevJy = jm === 1 ? jy - 1 : jy
  const daysInPrevMonth = getJalaliMonthDaysCount(prevJy, prevJm)

  const cells: CalendarDayCell[] = []

  // Leading days from previous month
  for (let i = firstWeekday - 1; i >= 0; i--) {
    const jd = daysInPrevMonth - i
    const canonical = formatJalaliCanonical(prevJy, prevJm, jd)
    cells.push({
      jy: prevJy,
      jm: prevJm,
      jd,
      canonical,
      isCurrentMonth: false,
      isToday: canonical === today,
      isFriday: cells.length % 7 === 6,
    })
  }

  // Current month days
  for (let jd = 1; jd <= daysInMonth; jd++) {
    const canonical = formatJalaliCanonical(jy, jm, jd)
    cells.push({
      jy,
      jm,
      jd,
      canonical,
      isCurrentMonth: true,
      isToday: canonical === today,
      isFriday: cells.length % 7 === 6,
    })
  }

  // Trailing days to complete weeks (35 or 42 cells)
  const nextJm = jm === 12 ? 1 : jm + 1
  const nextJy = jm === 12 ? jy + 1 : jy
  let nextJd = 1
  while (cells.length % 7 !== 0) {
    const canonical = formatJalaliCanonical(nextJy, nextJm, nextJd)
    cells.push({
      jy: nextJy,
      jm: nextJm,
      jd: nextJd,
      canonical,
      isCurrentMonth: false,
      isToday: canonical === today,
      isFriday: cells.length % 7 === 6,
    })
    nextJd++
  }

  return cells
}

/**
 * Time & Duration Helpers
 */
export function parseTimeMinutes(hhmm: string): number | null {
  if (!hhmm) return null
  const clean = toEnglishDigits(hhmm.trim())
  const match = clean.match(/^(\d{1,2}):(\d{2})$/)
  if (!match) return null
  const h = Number(match[1])
  const m = Number(match[2])
  if (h < 0 || h > 23 || m < 0 || m > 59) return null
  return h * 60 + m
}

export function normalizeTime(hhmm: string): string {
  const mins = parseTimeMinutes(hhmm)
  if (mins === null) return '08:00'
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${pad2(h)}:${pad2(m)}`
}

export function calcDurationMinutes(startTime: string, endTime: string): number {
  const s = parseTimeMinutes(startTime)
  const e = parseTimeMinutes(endTime)
  if (s === null || e === null) return 0
  if (e <= s) return 0
  return e - s
}

export function formatDurationVerbose(totalMinutes: number): string {
  const safe = Math.max(0, Math.round(totalMinutes))
  if (safe === 0) return '۰ دقیقه'
  const hours = Math.floor(safe / 60)
  const mins = safe % 60
  if (hours > 0 && mins > 0) {
    return `${toPersianDigits(hours)} ساعت و ${toPersianDigits(mins)} دقیقه`
  }
  if (hours > 0) {
    return `${toPersianDigits(hours)} ساعت`
  }
  return `${toPersianDigits(mins)} دقیقه`
}

export function formatDurationClock(totalMinutes: number): string {
  const safe = Math.max(0, Math.round(totalMinutes))
  const hours = Math.floor(safe / 60)
  const mins = safe % 60
  return toPersianDigits(`${hours}:${pad2(mins)}`)
}

export function minutesToDecimalHours(totalMinutes: number): number {
  return Math.round((Math.max(0, totalMinutes) / 60) * 100) / 100
}

export function formatDecimalHoursPersian(totalMinutes: number): string {
  const val = minutesToDecimalHours(totalMinutes)
  const formatted = Number.isInteger(val) ? String(val) : val.toFixed(1).replace(/\.0$/, '')
  return toPersianDigits(formatted.replace('.', '٫'))
}
