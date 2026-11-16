import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  Edit3,
  FileText,
  ListFilter,
  Plus,
  Trash2,
  UserCheck,
  UserX,
} from 'lucide-react'
import { useState } from 'react'
import type { AppDatabase, DashboardFilters, MeetingSession } from '../types/domain'
import type { AnalyticsResult } from '../utils/analytics'
import {
  JALALI_MONTH_NAMES,
  PERSIAN_WEEKDAYS_FULL,
  buildJalaliMonthMatrix,
  formatDurationVerbose,
  formatJalaliDisplay,
  formatJalaliLong,
  getTodayJalaliParts,
  normalizeJalaliString,
  toPersianDigits,
} from '../utils/jalali'
import { getPalette } from '../utils/theme'
import { FilterBar } from './FilterBar'

interface MeetingsViewProps {
  db: AppDatabase
  analytics: AnalyticsResult
  filters: DashboardFilters
  onFiltersChange: (next: DashboardFilters) => void
  onOpenNewMeeting: (workingGroupId?: string, jalaliDate?: string) => void
  onEditMeeting: (m: MeetingSession) => void
  onDeleteMeeting: (id: string) => void
}

export function MeetingsView({
  db,
  analytics,
  filters,
  onFiltersChange,
  onOpenNewMeeting,
  onEditMeeting,
  onDeleteMeeting,
}: MeetingsViewProps) {
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const [expandedId, setExpandedId] = useState<string | null>(
    analytics.filteredMeetings[0]?.id || null
  )
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const todayParts = getTodayJalaliParts()
  const [calYear, setCalYear] = useState(todayParts.jy)
  const [calMonth, setCalMonth] = useState(todayParts.jm)

  const calendarCells = buildJalaliMonthMatrix(calYear, calMonth)
  const meetingsByDate = new Map<string, MeetingSession[]>()
  for (const m of analytics.filteredMeetings) {
    const key = normalizeJalaliString(m.jalaliDate)
    const arr = meetingsByDate.get(key) || []
    arr.push(m)
    meetingsByDate.set(key, arr)
  }

  const goPrevMonth = () => {
    if (calMonth === 1) {
      setCalMonth(12)
      setCalYear((y) => y - 1)
    } else {
      setCalMonth((m) => m - 1)
    }
  }

  const goNextMonth = () => {
    if (calMonth === 12) {
      setCalMonth(1)
      setCalYear((y) => y + 1)
    } else {
      setCalMonth((m) => m + 1)
    }
  }

  return (
    <div className="space-y-5">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div>
          <h2 className="text-base font-black text-slate-900">
            مدیریت جلسات، موضوعات گزارش و تقویم شمسی کارگروه‌ها
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            ثبت اطلاعات ساعت شروع و پایان جلسه، تاریخ شمسی، نام کارگروه، موضوع گزارش و حضور نمایندگان
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* View Mode Toggle */}
          <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                viewMode === 'list'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ListFilter className="h-3.5 w-3.5" />
              فهرست جلسات
            </button>
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                viewMode === 'calendar'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              تقویم ماهانه شمسی
            </button>
          </div>

          <button
            type="button"
            onClick={() =>
              onOpenNewMeeting(
                filters.workingGroupId !== 'all' ? filters.workingGroupId : undefined
              )
            }
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-extrabold text-white shadow-sm shadow-emerald-600/20 transition hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            ثبت جلسه جدید
          </button>
        </div>
      </div>

      {/* Filters */}
      <FilterBar
        db={db}
        filters={filters}
        onChange={onFiltersChange}
        matchedMeetingsCount={analytics.totalMeetingsCount}
      />

      {viewMode === 'calendar' ? (
        /* Monthly Solar Hijri Calendar View */
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-3.5">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={goPrevMonth}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-2">
                <select
                  value={calMonth}
                  onChange={(e) => setCalMonth(Number(e.target.value))}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-extrabold text-slate-800 focus:border-emerald-500 focus:outline-none"
                >
                  {JALALI_MONTH_NAMES.map((m, idx) => (
                    <option key={m} value={idx + 1}>
                      {m}
                    </option>
                  ))}
                </select>
                <select
                  value={calYear}
                  onChange={(e) => setCalYear(Number(e.target.value))}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-extrabold text-slate-800 tabular-fa focus:border-emerald-500 focus:outline-none"
                >
                  {Array.from({ length: 12 }, (_, i) => 1400 + i).map((yr) => (
                    <option key={yr} value={yr}>
                      {toPersianDigits(yr)}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={goNextMonth}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setCalYear(todayParts.jy)
                  setCalMonth(todayParts.jm)
                }}
                className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100"
              >
                پرش به ماه جاری ({JALALI_MONTH_NAMES[todayParts.jm - 1]}{' '}
                {toPersianDigits(todayParts.jy)})
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[820px]">
              {/* Weekday Headers */}
              <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-100/70 text-center">
                {PERSIAN_WEEKDAYS_FULL.map((wName, i) => (
                  <div
                    key={wName}
                    className={`py-2.5 text-xs font-extrabold ${
                      i === 6 ? 'text-rose-600' : 'text-slate-600'
                    }`}
                  >
                    {wName}
                  </div>
                ))}
              </div>

              {/* Month Grid */}
              <div className="grid grid-cols-7 divide-x divide-y divide-x-reverse divide-slate-100">
                {calendarCells.map((cell) => {
                  const dayMeetings = meetingsByDate.get(cell.canonical) || []
                  return (
                    <div
                      key={cell.canonical}
                      className={`group min-h-[122px] p-2 transition ${
                        !cell.isCurrentMonth
                          ? 'bg-slate-50/60 opacity-50'
                          : cell.isToday
                            ? 'bg-emerald-50/40'
                            : 'bg-white hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold tabular-fa ${
                            cell.isToday
                              ? 'bg-emerald-600 text-white'
                              : cell.isFriday
                                ? 'text-rose-600'
                                : 'text-slate-700'
                          }`}
                        >
                          {toPersianDigits(cell.jd)}
                        </span>

                        {cell.isCurrentMonth && (
                          <button
                            type="button"
                            onClick={() =>
                              onOpenNewMeeting(
                                filters.workingGroupId !== 'all'
                                  ? filters.workingGroupId
                                  : undefined,
                                cell.canonical
                              )
                            }
                            className="rounded-md p-1 text-slate-400 opacity-0 transition group-hover:opacity-100 hover:bg-emerald-50 hover:text-emerald-700"
                            title={`ثبت جلسه در ${formatJalaliDisplay(cell.canonical)}`}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="mt-1.5 space-y-1.5">
                        {dayMeetings.map((m) => {
                          const wg = db.workingGroups.find((w) => w.id === m.workingGroupId)
                          const pal = getPalette(wg?.colorKey)
                          return (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => onEditMeeting(m)}
                              className={`block w-full rounded-lg border p-1.5 text-right transition hover:shadow-xs ${pal.bgSoft} ${pal.border}`}
                            >
                              <div className="flex items-center justify-between text-[10px] font-extrabold">
                                <span className={`truncate ${pal.text}`}>{wg?.name}</span>
                                <span className="shrink-0 text-slate-500 tabular-fa">
                                  {toPersianDigits(m.startTime)}
                                </span>
                              </div>
                              <p className="mt-0.5 line-clamp-2 text-[10px] font-medium leading-snug text-slate-700">
                                {m.subject}
                              </p>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Detailed Meetings List View */
        <div className="space-y-3">
          {analytics.filteredMeetings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <FileText className="mx-auto h-10 w-10 text-slate-300" />
              <h3 className="mt-3 text-sm font-bold text-slate-700">
                هیچ جلسه‌ای برای نمایش وجود ندارد
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                با کلیک روی دکمه «ثبت جلسه جدید»، اطلاعات اولین جلسه کارگروه را وارد نمایید.
              </p>
              <button
                type="button"
                onClick={() => onOpenNewMeeting()}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
              >
                <Plus className="h-4 w-4" />
                ثبت جلسه جدید
              </button>
            </div>
          ) : (
            analytics.filteredMeetings.map((mtg) => {
              const wg = db.workingGroups.find((w) => w.id === mtg.workingGroupId)
              const pal = getPalette(wg?.colorKey)
              const isExpanded = expandedId === mtg.id
              const presentAttendances = mtg.attendances.filter(
                (a) => a.status !== 'absent' && a.durationMinutes > 0
              )
              const totalPersonMins = presentAttendances.reduce(
                (s, a) => s + a.durationMinutes,
                0
              )

              return (
                <div
                  key={mtg.id}
                  className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs transition hover:border-slate-300"
                >
                  <div className="flex flex-col justify-between gap-4 p-4 sm:flex-row sm:items-center sm:px-5">
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full border px-3 py-0.5 text-xs font-extrabold ${pal.bgBadge}`}
                        >
                          کارگروه {wg?.name || 'نامشخص'}
                        </span>
                        <span className="rounded-lg bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700 tabular-fa">
                          {formatJalaliLong(mtg.jalaliDate)}
                        </span>
                        {mtg.sessionNumber && (
                          <span className="text-[11px] font-semibold text-slate-400 tabular-fa">
                            شماره جلسه: {toPersianDigits(mtg.sessionNumber)}
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-extrabold leading-relaxed text-slate-900">
                        موضوع گزارش: {mtg.subject}
                      </h3>

                      {mtg.summary && (
                        <p className="text-xs leading-relaxed text-slate-500">{mtg.summary}</p>
                      )}

                      <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-slate-600 tabular-fa">
                        <span className="inline-flex items-center gap-1.5 font-semibold">
                          <Clock className="h-3.5 w-3.5 text-emerald-600" />
                          ساعت {toPersianDigits(mtg.startTime)} تا {toPersianDigits(mtg.endTime)} (
                          {formatDurationVerbose(mtg.durationMinutes)})
                        </span>
                        <span>
                          حاضرین:{' '}
                          <strong className="text-emerald-700">
                            {toPersianDigits(presentAttendances.length)}
                          </strong>{' '}
                          از {toPersianDigits(mtg.attendances.length)} نماینده
                        </span>
                        <span>
                          مجموع نفر-ساعت حضور جلسه:{' '}
                          <strong className="text-indigo-700">
                            {formatDurationVerbose(totalPersonMins)}
                          </strong>
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : mtg.id)}
                        className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
                      >
                        <span>ریز حضور نمایندگان</span>
                        {isExpanded ? (
                          <ChevronUp className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => onEditMeeting(mtg)}
                        className="inline-flex items-center gap-1 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700 transition hover:bg-indigo-100"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        ویرایش
                      </button>

                      {confirmDeleteId === mtg.id ? (
                        <div className="inline-flex items-center gap-1 rounded-xl border border-rose-300 bg-rose-50 p-1">
                          <button
                            type="button"
                            onClick={() => {
                              onDeleteMeeting(mtg.id)
                              setConfirmDeleteId(null)
                            }}
                            className="rounded-lg bg-rose-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-rose-700"
                          >
                            حذف قطعی
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-white"
                          >
                            لغو
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(mtg.id)}
                          className="rounded-xl border border-slate-200 p-2 text-slate-400 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                          title="حذف جلسه"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded Attendance Details */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-3.5">
                      <div className="overflow-x-auto">
                        <table className="w-full text-right text-xs">
                          <thead>
                            <tr className="border-b border-slate-200 text-slate-500">
                              <th className="pb-2 font-bold">نام نماینده کارگروه</th>
                              <th className="pb-2 font-bold">نماینده کدام عضو هیئت امنا</th>
                              <th className="pb-2 font-bold">وضعیت حضور</th>
                              <th className="pb-2 font-bold">ساعت ورود و خروج</th>
                              <th className="pb-2 font-bold">میزان ساعت حضور</th>
                              <th className="pb-2 font-bold">توضیحات</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200/60">
                            {mtg.attendances.map((att) => {
                              const rep = db.representatives.find(
                                (r) => r.id === att.representativeId
                              )
                              const bm = rep
                                ? db.boardMembers.find((b) => b.id === rep.boardMemberId)
                                : undefined
                              return (
                                <tr key={att.representativeId}>
                                  <td className="py-2.5 font-bold text-slate-900">
                                    {rep?.fullName || '—'}
                                  </td>
                                  <td className="py-2.5 text-slate-700">
                                    {bm ? (
                                      <span className="font-semibold text-indigo-700">
                                        {bm.fullName}{' '}
                                        <span className="text-[11px] font-normal text-slate-400">
                                          ({bm.roleTitle})
                                        </span>
                                      </span>
                                    ) : (
                                      '—'
                                    )}
                                  </td>
                                  <td className="py-2.5">
                                    {att.status === 'present' ? (
                                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                                        <UserCheck className="h-3 w-3" />
                                        حاضر کامل
                                      </span>
                                    ) : att.status === 'partial' ? (
                                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
                                        <Clock className="h-3 w-3" />
                                        حضور ساعتی
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-bold text-rose-800">
                                        <UserX className="h-3 w-3" />
                                        غایب
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-2.5 font-medium text-slate-700 tabular-fa">
                                    {att.status === 'absent'
                                      ? '—'
                                      : `${toPersianDigits(att.startTime)} تا ${toPersianDigits(
                                          att.endTime
                                        )}`}
                                  </td>
                                  <td className="py-2.5 font-extrabold text-emerald-700 tabular-fa">
                                    {att.status === 'absent'
                                      ? '۰ دقیقه'
                                      : formatDurationVerbose(att.durationMinutes)}
                                  </td>
                                  <td className="py-2.5 text-slate-500">{att.note || '—'}</td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
