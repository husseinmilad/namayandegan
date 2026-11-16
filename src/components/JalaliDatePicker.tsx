import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import {
  JALALI_MONTH_NAMES,
  PERSIAN_WEEKDAYS_SHORT,
  buildJalaliMonthMatrix,
  formatJalaliDisplay,
  formatJalaliLong,
  getTodayJalali,
  getTodayJalaliParts,
  parseJalaliDate,
  toPersianDigits,
} from '../utils/jalali'

interface JalaliDatePickerProps {
  value: string
  onChange: (newDate: string) => void
  placeholder?: string
  clearable?: boolean
  showLongFormat?: boolean
  className?: string
  compact?: boolean
}

export function JalaliDatePicker({
  value,
  onChange,
  placeholder = 'انتخاب تاریخ شمسی',
  clearable = false,
  showLongFormat = false,
  className = '',
  compact = false,
}: JalaliDatePickerProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const initialParts = parseJalaliDate(value) || getTodayJalaliParts()
  const [viewYear, setViewYear] = useState(initialParts.jy)
  const [viewMonth, setViewMonth] = useState(initialParts.jm)

  const toggleOpen = () => {
    if (!open) {
      const parsed = parseJalaliDate(value) || getTodayJalaliParts()
      setViewYear(parsed.jy)
      setViewMonth(parsed.jm)
    }
    setOpen((o) => !o)
  }

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleOutside)
    }
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [open])

  const cells = buildJalaliMonthMatrix(viewYear, viewMonth)
  const years: number[] = []
  for (let y = 1398; y <= 1412; y++) years.push(y)

  const goPrevMonth = () => {
    if (viewMonth === 1) {
      setViewMonth(12)
      setViewYear((y) => y - 1)
    } else {
      setViewMonth((m) => m - 1)
    }
  }

  const goNextMonth = () => {
    if (viewMonth === 12) {
      setViewMonth(1)
      setViewYear((y) => y + 1)
    } else {
      setViewMonth((m) => m + 1)
    }
  }

  const selectToday = () => {
    const today = getTodayJalali()
    const parts = getTodayJalaliParts()
    setViewYear(parts.jy)
    setViewMonth(parts.jm)
    onChange(today)
    setOpen(false)
  }

  const displayValue = value
    ? showLongFormat
      ? formatJalaliLong(value)
      : formatJalaliDisplay(value)
    : ''

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div
        role="button"
        tabIndex={0}
        onClick={toggleOpen}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            toggleOpen()
          }
        }}
        className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl border bg-white transition-all select-none ${
          open
            ? 'border-emerald-500 ring-2 ring-emerald-500/20'
            : 'border-slate-200 hover:border-slate-300'
        } ${compact ? 'px-3 py-2 text-xs' : 'px-3.5 py-2.5 text-sm'}`}
      >
        <div className="flex items-center gap-2 truncate">
          <Calendar className="h-4 w-4 shrink-0 text-emerald-600" />
          {displayValue ? (
            <span className="truncate font-medium text-slate-800 tabular-fa">{displayValue}</span>
          ) : (
            <span className="truncate text-slate-400">{placeholder}</span>
          )}
        </div>
        {clearable && value && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onChange('')
            }}
            className="rounded-md p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            title="پاک کردن تاریخ"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-76 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xl shadow-slate-900/10">
          {/* Calendar Header */}
          <div className="mb-3 flex items-center justify-between gap-1.5">
            <button
              type="button"
              onClick={goPrevMonth}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-100"
              title="ماه قبل"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-1.5">
              <select
                value={viewMonth}
                onChange={(e) => setViewMonth(Number(e.target.value))}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-800 focus:border-emerald-500 focus:outline-none"
              >
                {JALALI_MONTH_NAMES.map((mName, idx) => (
                  <option key={mName} value={idx + 1}>
                    {mName}
                  </option>
                ))}
              </select>

              <select
                value={viewYear}
                onChange={(e) => setViewYear(Number(e.target.value))}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-800 tabular-fa focus:border-emerald-500 focus:outline-none"
              >
                {years.map((yr) => (
                  <option key={yr} value={yr}>
                    {toPersianDigits(yr)}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={goNextMonth}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-100"
              title="ماه بعد"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>

          {/* Weekday Headers */}
          <div className="mb-1.5 grid grid-cols-7 text-center">
            {PERSIAN_WEEKDAYS_SHORT.map((day, idx) => (
              <div
                key={day}
                className={`py-1 text-xs font-bold ${
                  idx === 6 ? 'text-rose-500' : 'text-slate-500'
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {cells.map((cell) => {
              const isSelected = value === cell.canonical
              return (
                <button
                  key={cell.canonical}
                  type="button"
                  onClick={() => {
                    onChange(cell.canonical)
                    setOpen(false)
                  }}
                  className={`relative flex h-9 w-full items-center justify-center rounded-lg text-xs font-medium transition tabular-fa ${
                    isSelected
                      ? 'bg-emerald-600 font-bold text-white shadow-sm'
                      : cell.isToday
                        ? 'border border-emerald-500 bg-emerald-50 font-bold text-emerald-700'
                        : !cell.isCurrentMonth
                          ? 'text-slate-300 hover:bg-slate-50'
                          : cell.isFriday
                            ? 'text-rose-600 hover:bg-rose-50'
                            : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {toPersianDigits(cell.jd)}
                </button>
              )
            })}
          </div>

          {/* Footer Quick Actions */}
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5">
            <button
              type="button"
              onClick={selectToday}
              className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
            >
              امروز ({formatJalaliDisplay(getTodayJalali())})
            </button>

            {clearable && value ? (
              <button
                type="button"
                onClick={() => {
                  onChange('')
                  setOpen(false)
                }}
                className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              >
                حذف فیلتر
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              >
                بستن
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
