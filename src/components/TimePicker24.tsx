import { Clock } from 'lucide-react'
import { pad2, parseTimeMinutes, toPersianDigits } from '../utils/jalali'

interface TimePicker24Props {
  value: string
  onChange: (val: string) => void
  disabled?: boolean
  compact?: boolean
}

const HOURS = Array.from({ length: 24 }, (_, i) => pad2(i))
const MINUTES = Array.from({ length: 12 }, (_, i) => pad2(i * 5))

export function TimePicker24({
  value,
  onChange,
  disabled = false,
  compact = false,
}: TimePicker24Props) {
  const parsed = parseTimeMinutes(value)
  const h = parsed !== null ? pad2(Math.floor(parsed / 60)) : '08'
  const mRaw = parsed !== null ? pad2(parsed % 60) : '00'
  const minuteOptions = MINUTES.includes(mRaw) ? MINUTES : [...MINUTES, mRaw].sort()

  return (
    <div
      dir="ltr"
      className={`inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white transition focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 ${
        disabled ? 'cursor-not-allowed bg-slate-100 opacity-60' : ''
      } ${compact ? 'px-2 py-1 text-xs' : 'px-2.5 py-2 text-sm'}`}
    >
      <Clock className="mr-1 h-3.5 w-3.5 shrink-0 text-slate-400" />
      <select
        disabled={disabled}
        value={h}
        onChange={(e) => onChange(`${e.target.value}:${mRaw}`)}
        aria-label="ساعت"
        className="cursor-pointer appearance-none bg-transparent text-center font-semibold text-slate-800 tabular-fa focus:outline-none disabled:cursor-not-allowed"
      >
        {HOURS.map((hr) => (
          <option key={hr} value={hr}>
            {toPersianDigits(hr)}
          </option>
        ))}
      </select>
      <span className="font-bold text-slate-400">:</span>
      <select
        disabled={disabled}
        value={mRaw}
        onChange={(e) => onChange(`${h}:${e.target.value}`)}
        aria-label="دقیقه"
        className="cursor-pointer appearance-none bg-transparent text-center font-semibold text-slate-800 tabular-fa focus:outline-none disabled:cursor-not-allowed"
      >
        {minuteOptions.map((mn) => (
          <option key={mn} value={mn}>
            {toPersianDigits(mn)}
          </option>
        ))}
      </select>
    </div>
  )
}
