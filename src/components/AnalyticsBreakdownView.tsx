import {
  ArrowUpDown,
  Building,
  ChevronDown,
  ChevronUp,
  Clock,
  Eye,
  FileSpreadsheet,
  FileText,
  UserCheck,
  Users,
  X,
} from 'lucide-react'
import { useState } from 'react'
import type { AppDatabase, DashboardFilters } from '../types/domain'
import type { AnalyticsResult, RepresentativeStat } from '../utils/analytics'
import {
  formatDecimalHoursPersian,
  formatDurationClock,
  formatDurationVerbose,
  formatJalaliLong,
  toPersianDigits,
} from '../utils/jalali'
import { getInitials, getPalette } from '../utils/theme'
import { FilterBar } from './FilterBar'

interface AnalyticsBreakdownViewProps {
  db: AppDatabase
  analytics: AnalyticsResult
  filters: DashboardFilters
  onFiltersChange: (next: DashboardFilters) => void
  onExportPdf: () => void
  onExportExcel: () => void
}

type RepSortKey = 'hours' | 'sessions' | 'rate' | 'name' | 'boardMember'

export function AnalyticsBreakdownView({
  db,
  analytics,
  filters,
  onFiltersChange,
  onExportPdf,
  onExportExcel,
}: AnalyticsBreakdownViewProps) {
  const [subTab, setSubTab] = useState<'representatives' | 'boardMembers'>('representatives')
  const [sortKey, setSortKey] = useState<RepSortKey>('hours')
  const [sortAsc, setSortAsc] = useState(false)
  const [selectedRepStat, setSelectedRepStat] = useState<RepresentativeStat | null>(null)
  const [expandedBmId, setExpandedBmId] = useState<string | null>(
    analytics.boardMemberStats[0]?.boardMember.id || null
  )

  const handleSort = (key: RepSortKey) => {
    if (sortKey === key) {
      setSortAsc((a) => !a)
    } else {
      setSortKey(key)
      setSortAsc(key === 'name' || key === 'boardMember')
    }
  }

  const sortedReps = [...analytics.representativeStats].sort((a, b) => {
    let cmp = 0
    if (sortKey === 'hours') cmp = a.totalAttendedMinutes - b.totalAttendedMinutes
    else if (sortKey === 'sessions') cmp = a.attendedSessionsCount - b.attendedSessionsCount
    else if (sortKey === 'rate') cmp = a.sessionAttendanceRate - b.sessionAttendanceRate
    else if (sortKey === 'name')
      cmp = a.representative.fullName.localeCompare(b.representative.fullName, 'fa')
    else if (sortKey === 'boardMember')
      cmp = (a.boardMember?.fullName || '').localeCompare(b.boardMember?.fullName || '', 'fa')

    return sortAsc ? cmp : -cmp
  })

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div>
          <h2 className="text-base font-black text-slate-900">
            گزارش تحلیلی و تفکیکی ساعات حضور نمایندگان و اعضای هیئت امنا
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            مشاهده دقیق تعداد جلسات و میزان ساعت حضور به تفکیک هر نماینده و به تفکیک هر عضو هیئت امنا
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onExportPdf}
            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-100"
          >
            <FileText className="h-4 w-4" />
            خروجی PDF این گزارش
          </button>
          <button
            type="button"
            onClick={onExportExcel}
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100"
          >
            <FileSpreadsheet className="h-4 w-4" />
            خروجی اکسل ۵ برگی
          </button>
        </div>
      </div>

      <FilterBar
        db={db}
        filters={filters}
        onChange={onFiltersChange}
        matchedMeetingsCount={analytics.totalMeetingsCount}
      />

      {/* Mode Switcher */}
      <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xs">
        <button
          type="button"
          onClick={() => setSubTab('representatives')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-extrabold transition sm:text-sm ${
            subTab === 'representatives'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <UserCheck className="h-4 w-4" />
          <span>به تفکیک هر نماینده کارگروه ({toPersianDigits(sortedReps.length)} نفر)</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('boardMembers')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-extrabold transition sm:text-sm ${
            subTab === 'boardMembers'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building className="h-4 w-4" />
          <span>
            به تفکیک هر عضو هیئت امنا ({toPersianDigits(analytics.boardMemberStats.length)} عضو)
          </span>
        </button>
      </div>

      {subTab === 'representatives' ? (
        /* Detailed Per-Representative Table */
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-right text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <th className="px-4 py-3.5 font-extrabold">#</th>
                  <th className="px-4 py-3.5 font-extrabold">
                    <button
                      type="button"
                      onClick={() => handleSort('name')}
                      className="inline-flex items-center gap-1 hover:text-slate-900"
                    >
                      <span>نام نماینده کارگروه</span>
                      <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </th>
                  <th className="px-4 py-3.5 font-extrabold">
                    <button
                      type="button"
                      onClick={() => handleSort('boardMember')}
                      className="inline-flex items-center gap-1 hover:text-slate-900"
                    >
                      <span>نماینده عضو هیئت امنا</span>
                      <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </th>
                  <th className="px-4 py-3.5 font-extrabold">کارگروه تخصصی</th>
                  <th className="px-4 py-3.5 text-center font-extrabold">
                    <button
                      type="button"
                      onClick={() => handleSort('sessions')}
                      className="inline-flex items-center gap-1 hover:text-slate-900"
                    >
                      <span>تعداد جلسات حضور</span>
                      <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </th>
                  <th className="px-4 py-3.5 font-extrabold">
                    <button
                      type="button"
                      onClick={() => handleSort('hours')}
                      className="inline-flex items-center gap-1 hover:text-slate-900"
                    >
                      <span>میزان ساعت حضور</span>
                      <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </th>
                  <th className="px-4 py-3.5 font-extrabold">
                    <button
                      type="button"
                      onClick={() => handleSort('rate')}
                      className="inline-flex items-center gap-1 hover:text-slate-900"
                    >
                      <span>درصد حضور</span>
                      <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </th>
                  <th className="px-4 py-3.5 text-center font-extrabold">کارنامه جلسات</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {sortedReps.map((rStat, idx) => (
                  <tr key={rStat.representative.id} className="transition hover:bg-slate-50/80">
                    <td className="px-4 py-3.5 font-bold text-slate-400 tabular-fa">
                      {toPersianDigits(idx + 1)}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-extrabold text-slate-900">
                        {rStat.representative.fullName}
                      </div>
                      {rStat.representative.specialtyTitle && (
                        <div className="mt-0.5 text-[11px] text-slate-400">
                          {rStat.representative.specialtyTitle}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      {rStat.boardMember ? (
                        <div>
                          <span className="font-bold text-indigo-700">
                            {rStat.boardMember.fullName}
                          </span>
                          <span className="mt-0.5 block text-[10px] text-slate-400">
                            {rStat.boardMember.roleTitle}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {rStat.workingGroups.map((w) => {
                          const pal = getPalette(w.colorKey)
                          return (
                            <span
                              key={w.id}
                              className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${pal.bgBadge}`}
                            >
                              {w.name}
                            </span>
                          )
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center tabular-fa">
                      <span className="rounded-lg bg-slate-100 px-2.5 py-1 font-extrabold text-slate-800">
                        {toPersianDigits(rStat.attendedSessionsCount)}
                      </span>
                      <span className="mr-1 text-[11px] text-slate-400">
                        از {toPersianDigits(rStat.invitedSessionsCount)} جلسه
                      </span>
                    </td>
                    <td className="px-4 py-3.5 tabular-fa">
                      <div className="font-black text-emerald-700">
                        {formatDurationVerbose(rStat.totalAttendedMinutes)}
                      </div>
                      <div className="mt-0.5 text-[10px] text-slate-400">
                        معادل {formatDecimalHoursPersian(rStat.totalAttendedMinutes)} ساعت (
                        {formatDurationClock(rStat.totalAttendedMinutes)})
                      </div>
                    </td>
                    <td className="px-4 py-3.5 tabular-fa">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full ${
                              rStat.sessionAttendanceRate >= 80
                                ? 'bg-emerald-500'
                                : rStat.sessionAttendanceRate >= 50
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                            }`}
                            style={{ width: `${Math.min(100, rStat.sessionAttendanceRate)}%` }}
                          />
                        </div>
                        <span className="font-bold text-slate-700">
                          {toPersianDigits(rStat.sessionAttendanceRate)}٪
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedRepStat(rStat)}
                        className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        ریز جلسات
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>

              {sortedReps.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-slate-200 bg-slate-50 font-extrabold text-slate-900 tabular-fa">
                    <td colSpan={4} className="px-4 py-3.5">
                      جمع کل حضور نمایندگان در بازه انتخابی
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {toPersianDigits(analytics.totalPresentPersonSessions)} نفر-جلسه
                    </td>
                    <td className="px-4 py-3.5 text-emerald-800">
                      {formatDurationVerbose(analytics.totalPersonAttendedMinutes)}
                    </td>
                    <td className="px-4 py-3.5">
                      میانگین {toPersianDigits(analytics.overallSessionAttendanceRate)}٪
                    </td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      ) : (
        /* Detailed Per-Board-of-Trustees-Member Cards & Expandable Breakdown */
        <div className="space-y-4">
          {analytics.boardMemberStats.map((bmStat) => {
            const pal = getPalette(bmStat.boardMember.avatarColor)
            const isExpanded = expandedBmId === bmStat.boardMember.id

            return (
              <div
                key={bmStat.boardMember.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs"
              >
                <div
                  onClick={() => setExpandedBmId(isExpanded ? null : bmStat.boardMember.id)}
                  className="flex cursor-pointer flex-col justify-between gap-4 p-5 transition hover:bg-slate-50/60 lg:flex-row lg:items-center"
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-black text-white shadow-xs ${pal.solidBg}`}
                    >
                      {getInitials(bmStat.boardMember.fullName)}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-black text-slate-900">
                          {bmStat.boardMember.fullName}
                        </h3>
                        <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${pal.bgBadge}`}>
                          {bmStat.boardMember.roleTitle}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        دارای {toPersianDigits(bmStat.representatives.length)} نماینده تخصصی در کارگروه‌ها:{' '}
                        <span className="font-semibold text-slate-700">
                          {bmStat.representatives.map((r) => r.fullName).join(' ، ') || 'بدون نماینده'}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Summary Metrics for this Board Member */}
                  <div className="flex flex-wrap items-center gap-4 tabular-fa">
                    <div className="rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-2 text-center">
                      <span className="block text-[10px] font-semibold text-slate-400">
                        تعداد جلسات حضور نمایندگان
                      </span>
                      <span className="text-sm font-black text-slate-900">
                        {toPersianDigits(bmStat.totalRepAttendedSessions)}{' '}
                        <span className="text-[11px] font-medium text-slate-500">
                          نفر-جلسه ({toPersianDigits(bmStat.uniqueMeetingsCoveredCount)} جلسه مجزا)
                        </span>
                      </span>
                    </div>

                    <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 px-3.5 py-2 text-center">
                      <span className="block text-[10px] font-semibold text-emerald-700">
                        مجموع میزان ساعت حضور
                      </span>
                      <span className="text-sm font-black text-emerald-800">
                        {formatDurationVerbose(bmStat.totalAttendedMinutes)}
                      </span>
                    </div>

                    <div className="rounded-xl border border-amber-100 bg-amber-50/70 px-3 py-2 text-center">
                      <span className="block text-[10px] font-semibold text-amber-700">
                        نرخ مشارکت
                      </span>
                      <span className="text-sm font-black text-amber-800">
                        {toPersianDigits(bmStat.sessionAttendanceRate)}٪
                      </span>
                    </div>

                    <div className="text-slate-400">
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="space-y-4 border-t border-slate-100 bg-slate-50/60 p-5">
                    {/* Breakdown across the 4 working groups */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      {bmStat.byWorkingGroup.map((wgSlice) => {
                        const wgObj = db.workingGroups.find(
                          (w) => w.id === wgSlice.workingGroupId
                        )
                        const wgPal = getPalette(wgObj?.colorKey)
                        return (
                          <div
                            key={wgSlice.workingGroupId}
                            className="rounded-xl border border-slate-200/80 bg-white p-3.5"
                          >
                            <div className="flex items-center justify-between">
                              <span className={`text-xs font-extrabold ${wgPal.text}`}>
                                {wgSlice.workingGroupName}
                              </span>
                              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700 tabular-fa">
                                {toPersianDigits(wgSlice.sessionsAttended)} جلسه
                              </span>
                            </div>
                            <div className="mt-2 text-sm font-black text-slate-900 tabular-fa">
                              {formatDurationVerbose(wgSlice.attendedMinutes)}
                            </div>
                            <div className="mt-1 text-[11px] text-slate-500">
                              نماینده:{' '}
                              <span className="font-semibold text-slate-700">
                                {wgSlice.representativeNames.join(' ، ') || 'معرفی نشده'}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Individual Representatives Table for this Board Member */}
                    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                      <table className="w-full text-right text-xs">
                        <thead>
                          <tr className="border-b border-slate-100 bg-slate-50 text-slate-500">
                            <th className="px-4 py-2.5 font-bold">نام نماینده معرفی‌شده</th>
                            <th className="px-4 py-2.5 font-bold">تخصص / سمت</th>
                            <th className="px-4 py-2.5 font-bold">کارگروه‌های عضویت</th>
                            <th className="px-4 py-2.5 text-center font-bold">تعداد جلسات حضور</th>
                            <th className="px-4 py-2.5 font-bold">میزان ساعت حضور</th>
                            <th className="px-4 py-2.5 text-center font-bold">جزئیات</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {bmStat.representativeStats.map((rs) => (
                            <tr key={rs.representative.id}>
                              <td className="px-4 py-2.5 font-bold text-slate-900">
                                {rs.representative.fullName}
                              </td>
                              <td className="px-4 py-2.5 text-slate-500">
                                {rs.representative.specialtyTitle || '—'}
                              </td>
                              <td className="px-4 py-2.5">
                                {rs.workingGroups.map((w) => w.name).join(' ، ')}
                              </td>
                              <td className="px-4 py-2.5 text-center font-bold text-slate-700 tabular-fa">
                                {toPersianDigits(rs.attendedSessionsCount)} از{' '}
                                {toPersianDigits(rs.invitedSessionsCount)}
                              </td>
                              <td className="px-4 py-2.5 font-extrabold text-emerald-700 tabular-fa">
                                {formatDurationVerbose(rs.totalAttendedMinutes)}
                              </td>
                              <td className="px-4 py-2.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => setSelectedRepStat(rs)}
                                  className="font-bold text-indigo-600 hover:underline"
                                >
                                  مشاهده جلسات
                                </button>
                              </td>
                            </tr>
                          ))}
                          {bmStat.representativeStats.length === 0 && (
                            <tr>
                              <td colSpan={6} className="px-4 py-4 text-center text-slate-400">
                                نماینده‌ای در فیلتر فعلی یافت نشد.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Drill-down Modal for Individual Representative Session Log */}
      {selectedRepStat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4 backdrop-blur-xs">
          <div className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Users className="h-4 w-4 text-emerald-600" />
                  <h3 className="text-base font-black text-slate-900">
                    کارنامه تفصیلی حضور: {selectedRepStat.representative.fullName}
                  </h3>
                  {selectedRepStat.boardMember && (
                    <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700">
                      نماینده {selectedRepStat.boardMember.fullName}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-500 tabular-fa">
                  مجموع حضور: {toPersianDigits(selectedRepStat.attendedSessionsCount)} از{' '}
                  {toPersianDigits(selectedRepStat.invitedSessionsCount)} جلسه | میزان ساعت حضور:{' '}
                  <strong className="text-emerald-700">
                    {formatDurationVerbose(selectedRepStat.totalAttendedMinutes)}
                  </strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRepStat(null)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-200/70 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {selectedRepStat.sessionLogs.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400">
                  جلسه‌ای برای این نماینده در بازه انتخابی ثبت نشده است.
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedRepStat.sessionLogs.map((log) => (
                    <div
                      key={log.meetingId}
                      className="rounded-2xl border border-slate-200 p-4 transition hover:bg-slate-50/50"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="rounded-lg bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-800">
                            کارگروه {log.workingGroupName}
                          </span>
                          <span className="text-xs font-semibold text-slate-500 tabular-fa">
                            {formatJalaliLong(log.jalaliDate)}
                          </span>
                        </div>

                        {log.status === 'absent' ? (
                          <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-700">
                            غایب (۰ دقیقه)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-extrabold text-emerald-800 tabular-fa">
                            <Clock className="h-3 w-3" />
                            {formatDurationVerbose(log.attendedMinutes)} (
                            {toPersianDigits(log.repStartTime)} تا{' '}
                            {toPersianDigits(log.repEndTime)})
                          </span>
                        )}
                      </div>

                      <p className="mt-2 text-xs font-bold text-slate-900">
                        موضوع گزارش: {log.subject}
                      </p>
                      {log.note && (
                        <p className="mt-1 text-[11px] text-slate-500">توضیحات: {log.note}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
