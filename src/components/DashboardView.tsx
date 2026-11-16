import {
  Award,
  BarChart3,
  Briefcase,
  Building2,
  CalendarCheck2,
  ChevronLeft,
  Clock,
  FileSpreadsheet,
  FileText,
  Layers,
  Plus,
  Share2,
  TrendingUp,
  Users,
} from 'lucide-react'
import { useRef, useState } from 'react'
import type { ActiveTab, AppDatabase, DashboardFilters, MeetingSession } from '../types/domain'
import type { AnalyticsResult } from '../utils/analytics'
import {
  formatDecimalHoursPersian,
  formatDurationVerbose,
  formatJalaliDisplay,
  formatJalaliLong,
  toPersianDigits,
} from '../utils/jalali'
import { getInitials, getPalette } from '../utils/theme'
import { FilterBar } from './FilterBar'

interface DashboardViewProps {
  db: AppDatabase
  analytics: AnalyticsResult
  filters: DashboardFilters
  onFiltersChange: (next: DashboardFilters) => void
  onOpenNewMeeting: (workingGroupId?: string) => void
  onEditMeeting: (m: MeetingSession) => void
  onNavigateTab: (tab: ActiveTab) => void
  onExportPdf: () => void
  onExportExcel: () => void
  onOpenShare: () => void
  dashboardCaptureRef: React.RefObject<HTMLDivElement | null>
}

export function DashboardView({
  db,
  analytics,
  filters,
  onFiltersChange,
  onOpenNewMeeting,
  onEditMeeting,
  onNavigateTab,
  onExportPdf,
  onExportExcel,
  onOpenShare,
  dashboardCaptureRef,
}: DashboardViewProps) {
  const [hoveredWgId, setHoveredWgId] = useState<string | null>(null)
  const localRef = useRef<HTMLDivElement>(null)

  const totalWgMinutes = Math.max(
    1,
    analytics.workingGroupStats.reduce((s, w) => s + w.totalPersonAttendedMinutes, 0)
  )

  // Compute SVG Donut segments without side effects during render
  const radius = 62
  const circumference = 2 * Math.PI * radius
  const donutSegments = analytics.workingGroupStats.reduce<{
    items: Array<{
      wgStat: (typeof analytics.workingGroupStats)[number]
      fraction: number
      dashLength: number
      dashOffset: number
      palette: ReturnType<typeof getPalette>
    }>
    offsetFraction: number
  }>(
    (acc, wgStat) => {
      const fraction =
        analytics.totalPersonAttendedMinutes > 0
          ? wgStat.totalPersonAttendedMinutes / totalWgMinutes
          : 0
      const dashLength = fraction * circumference
      const dashOffset = -acc.offsetFraction * circumference
      acc.items.push({
        wgStat,
        fraction,
        dashLength,
        dashOffset,
        palette: getPalette(wgStat.workingGroup.colorKey),
      })
      acc.offsetFraction += fraction
      return acc
    },
    { items: [], offsetFraction: 0 }
  ).items

  const maxBmMinutes = Math.max(
    60,
    ...analytics.boardMemberStats.map((b) => b.totalAttendedMinutes)
  )

  return (
    <div className="space-y-5">
      {/* Executive Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-l from-slate-900 via-slate-800 to-emerald-950 p-6 text-white shadow-lg">
        <div
          className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-emerald-500/15 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-24 right-1/3 h-64 w-64 rounded-full bg-indigo-500/15 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">
              <Building2 className="h-3.5 w-3.5" />
              <span>داشبورد مدیریتی پایش کارگروه‌های تخصصی هیئت امنا</span>
            </div>
            <h1 className="mt-2.5 text-xl font-black tracking-tight sm:text-2xl">
              {db.organizationTitle}
            </h1>
            <p className="mt-1 text-xs text-slate-300 sm:text-sm">{db.secretariatSubtitle}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => onOpenNewMeeting()}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-extrabold text-slate-950 shadow-md shadow-emerald-500/20 transition hover:bg-emerald-400"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              ثبت جلسه جدید
            </button>

            <button
              type="button"
              onClick={onExportPdf}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/10 px-3.5 py-2.5 text-xs font-bold text-white backdrop-blur-xs transition hover:bg-white/20"
            >
              <FileText className="h-4 w-4 text-rose-300" />
              صدور PDF رسمی
            </button>

            <button
              type="button"
              onClick={onExportExcel}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/10 px-3.5 py-2.5 text-xs font-bold text-white backdrop-blur-xs transition hover:bg-white/20"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-300" />
              صدور اکسل
            </button>

            <button
              type="button"
              onClick={onOpenShare}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/10 px-3.5 py-2.5 text-xs font-bold text-white backdrop-blur-xs transition hover:bg-white/20"
            >
              <Share2 className="h-4 w-4 text-sky-300" />
              اشتراک‌گذاری گزارش
            </button>
          </div>
        </div>
      </div>

      {/* Unified Filter Bar */}
      <FilterBar
        db={db}
        filters={filters}
        onChange={onFiltersChange}
        matchedMeetingsCount={analytics.totalMeetingsCount}
      />

      {/* Capturable Dashboard Core */}
      <div ref={dashboardCaptureRef || localRef} className="space-y-5">
        {/* Top 4 KPI Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {/* KPI 1: Total Sessions */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition hover:shadow-md">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500">تعداد کل جلسات برگزارشده</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-900 tabular-fa">
                    {toPersianDigits(analytics.totalMeetingsCount)}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">جلسه رسمی</span>
                </div>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <CalendarCheck2 className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
              <span>مجموع مدت زمان جلسات:</span>
              <span className="font-bold text-slate-800 tabular-fa">
                {formatDurationVerbose(analytics.totalMeetingDurationMinutes)}
              </span>
            </div>
          </div>

          {/* KPI 2: Total Person-Hours Attended */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition hover:shadow-md">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500">مجموع نفر-ساعت حضور نمایندگان</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-emerald-700 tabular-fa">
                    {formatDecimalHoursPersian(analytics.totalPersonAttendedMinutes)}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">نفر-ساعت</span>
                </div>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <Clock className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
              <span>معادل دقیق ساعتی:</span>
              <span className="font-bold text-emerald-800 tabular-fa">
                {formatDurationVerbose(analytics.totalPersonAttendedMinutes)}
              </span>
            </div>
          </div>

          {/* KPI 3: Overall Attendance Rate */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition hover:shadow-md">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500">میانگین نرخ مشارکت و حضور</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-amber-600 tabular-fa">
                    {toPersianDigits(analytics.overallSessionAttendanceRate)}٪
                  </span>
                  <span className="text-xs font-semibold text-slate-500">نرخ حضور جلسات</span>
                </div>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="mb-1 flex justify-between text-[11px] text-slate-500 tabular-fa">
                <span>
                  {toPersianDigits(analytics.totalPresentPersonSessions)} حضور از{' '}
                  {toPersianDigits(analytics.totalInvitedPersonSessions)} دعوت
                </span>
                <span>پوشش زمانی: {toPersianDigits(analytics.overallTimeAttendanceRate)}٪</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-amber-500 transition-all duration-500"
                  style={{ width: `${Math.min(100, analytics.overallSessionAttendanceRate)}%` }}
                />
              </div>
            </div>
          </div>

          {/* KPI 4: Board & Representatives Count */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition hover:shadow-md">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500">اعضای هیئت امنا و نمایندگان</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-900 tabular-fa">
                    {toPersianDigits(db.representatives.length)}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    نماینده معرفی‌شده
                  </span>
                </div>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
              <span>اعضای هیئت امنا:</span>
              <button
                type="button"
                onClick={() => onNavigateTab('directory')}
                className="inline-flex items-center gap-1 font-bold text-indigo-600 hover:text-indigo-800"
              >
                <span>{toPersianDigits(db.boardMembers.length)} عضو در ۴ کارگروه</span>
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* 4 Specialized Working Groups Cards */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-extrabold text-slate-800">
              <Layers className="h-4 w-4 text-emerald-600" />
              <span>کارگروه‌های تخصصی چهارگانه هیئت امنا</span>
            </h2>
            <span className="text-xs text-slate-400">
              برای فیلتر سریع روی کارت کارگروه کلیک کنید
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {analytics.workingGroupStats.map((w) => {
              const pal = getPalette(w.workingGroup.colorKey)
              const isFiltered = filters.workingGroupId === w.workingGroup.id
              return (
                <div
                  key={w.workingGroup.id}
                  onClick={() =>
                    onFiltersChange({
                      ...filters,
                      workingGroupId: isFiltered ? 'all' : w.workingGroup.id,
                    })
                  }
                  className={`group cursor-pointer rounded-2xl border bg-white p-4 shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md ${
                    isFiltered
                      ? `${pal.border} ring-2 ${pal.ring}`
                      : 'border-slate-200/90 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`h-3 w-3 rounded-full ${pal.solidBg}`} />
                      <h3 className="text-sm font-extrabold text-slate-900">
                        {w.workingGroup.name}
                      </h3>
                    </div>
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold tabular-fa ${pal.bgBadge}`}
                    >
                      {toPersianDigits(w.meetingsCount)} جلسه
                    </span>
                  </div>

                  <p className="mt-2 line-clamp-2 min-h-[2rem] text-[11px] leading-relaxed text-slate-500">
                    {w.workingGroup.description}
                  </p>

                  <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-2.5 text-xs">
                    <div>
                      <span className="block text-[10px] text-slate-400">مجموع نفر-ساعت حضور</span>
                      <span className={`mt-0.5 block font-extrabold tabular-fa ${pal.text}`}>
                        {formatDurationVerbose(w.totalPersonAttendedMinutes)}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400">نرخ حضور / نمایندگان</span>
                      <span className="mt-0.5 block font-bold text-slate-800 tabular-fa">
                        {toPersianDigits(w.attendanceRate)}٪ ({toPersianDigits(w.assignedRepresentativesCount)} نفر)
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between pt-1 text-[11px]">
                    <span className="text-slate-400 tabular-fa">
                      آخرین جلسه:{' '}
                      {w.lastMeetingDate ? formatJalaliDisplay(w.lastMeetingDate) : 'ثبت نشده'}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onOpenNewMeeting(w.workingGroup.id)
                      }}
                      className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 font-bold transition ${pal.bgSoft} ${pal.text} hover:opacity-85`}
                    >
                      <Plus className="h-3 w-3" />
                      ثبت جلسه
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Visual Charts Row: Board Members Bar Chart + Working Group Donut Chart */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          {/* Chart 1: Hours & Sessions per Board of Trustees Member */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs lg:col-span-7">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
                  <BarChart3 className="h-4 w-4 text-indigo-600" />
                  <span>میزان ساعت حضور و تعداد جلسات به تفکیک هر عضو هیئت امنا</span>
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  تفکیک رنگی ساعت حضور نمایندگان هر عضو هیئت امنا در کارگروه‌های چهارگانه
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('analytics')}
                className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800"
              >
                <span>گزارش ریز اعضا</span>
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
            </div>

            {analytics.boardMemberStats.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                اطلاعاتی برای نمایش وجود ندارد.
              </div>
            ) : (
              <div className="space-y-4">
                {analytics.boardMemberStats.map((bStat) => {
                  const totalWidthPct = Math.max(
                    3,
                    Math.round((bStat.totalAttendedMinutes / maxBmMinutes) * 100)
                  )
                  return (
                    <div key={bStat.boardMember.id} className="space-y-1.5">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold text-white ${
                              getPalette(bStat.boardMember.avatarColor).solidBg
                            }`}
                          >
                            {getInitials(bStat.boardMember.fullName)}
                          </span>
                          <div>
                            <span className="font-extrabold text-slate-800">
                              {bStat.boardMember.fullName}
                            </span>
                            <span className="mr-2 text-[11px] text-slate-400">
                              ({bStat.boardMember.roleTitle} •{' '}
                              {toPersianDigits(bStat.representatives.length)} نماینده)
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 tabular-fa">
                          <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700">
                            {toPersianDigits(bStat.totalRepAttendedSessions)} نفر-جلسه حضور
                          </span>
                          <span className="font-extrabold text-emerald-700">
                            {formatDurationVerbose(bStat.totalAttendedMinutes)}
                          </span>
                        </div>
                      </div>

                      {/* Segmented Stacked Progress Bar by Working Group */}
                      <div className="h-3.5 w-full overflow-hidden rounded-full bg-slate-100 p-0.5">
                        <div
                          className="flex h-full overflow-hidden rounded-full transition-all duration-500"
                          style={{
                            width: bStat.totalAttendedMinutes > 0 ? `${totalWidthPct}%` : '0%',
                          }}
                        >
                          {bStat.byWorkingGroup.map((slice) => {
                            if (slice.attendedMinutes <= 0) return null
                            const wgObj = db.workingGroups.find(
                              (w) => w.id === slice.workingGroupId
                            )
                            const pal = getPalette(wgObj?.colorKey)
                            const segPct =
                              (slice.attendedMinutes / bStat.totalAttendedMinutes) * 100
                            return (
                              <div
                                key={slice.workingGroupId}
                                style={{
                                  width: `${segPct}%`,
                                  backgroundColor: pal.hex,
                                }}
                                title={`${slice.workingGroupName}: ${formatDurationVerbose(
                                  slice.attendedMinutes
                                )} (${toPersianDigits(slice.sessionsAttended)} جلسه)`}
                                className="h-full border-l border-white/40 first:rounded-r-full last:border-l-0 last:rounded-l-full"
                              />
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )
                })}

                {/* Color Legend */}
                <div className="flex flex-wrap items-center gap-4 border-t border-slate-100 pt-3">
                  {db.workingGroups.map((wg) => {
                    const pal = getPalette(wg.colorKey)
                    return (
                      <div key={wg.id} className="flex items-center gap-1.5 text-[11px] text-slate-600">
                        <span
                          className="h-2.5 w-2.5 rounded-xs"
                          style={{ backgroundColor: pal.hex }}
                        />
                        <span>{wg.name}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Chart 2: Interactive SVG Donut of Working Groups Share */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs lg:col-span-5">
            <h3 className="text-sm font-extrabold text-slate-900">
              سهم کارگروه‌ها از کل نفر-ساعت حضور
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              توزیع زمانی جلسات و حضور نمایندگان بین ۴ کارگروه تخصصی
            </p>

            <div className="mt-4 flex flex-col items-center gap-5 sm:flex-row">
              <div className="relative flex h-44 w-44 shrink-0 items-center justify-center">
                <svg viewBox="0 0 160 160" className="h-44 w-44 -rotate-90 transform">
                  <circle
                    cx="80"
                    cy="80"
                    r={radius}
                    fill="transparent"
                    stroke="#f1f5f9"
                    strokeWidth="20"
                  />
                  {donutSegments.map((seg) => (
                    <circle
                      key={seg.wgStat.workingGroup.id}
                      cx="80"
                      cy="80"
                      r={radius}
                      fill="transparent"
                      stroke={seg.palette.hex}
                      strokeWidth={
                        hoveredWgId === seg.wgStat.workingGroup.id ? '24' : '20'
                      }
                      strokeDasharray={`${seg.dashLength} ${circumference}`}
                      strokeDashoffset={seg.dashOffset}
                      className="cursor-pointer transition-all duration-300"
                      onMouseEnter={() => setHoveredWgId(seg.wgStat.workingGroup.id)}
                      onMouseLeave={() => setHoveredWgId(null)}
                    />
                  ))}
                </svg>

                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-[11px] font-semibold text-slate-400">مجموع کل</span>
                  <span className="text-lg font-black text-slate-900 tabular-fa">
                    {formatDecimalHoursPersian(analytics.totalPersonAttendedMinutes)}
                  </span>
                  <span className="text-[10px] font-medium text-slate-500">نفر-ساعت</span>
                </div>
              </div>

              <div className="w-full flex-1 space-y-2.5">
                {donutSegments.map(({ wgStat, fraction, palette }) => {
                  const pct = Math.round(fraction * 100)
                  return (
                    <div
                      key={wgStat.workingGroup.id}
                      onMouseEnter={() => setHoveredWgId(wgStat.workingGroup.id)}
                      onMouseLeave={() => setHoveredWgId(null)}
                      className={`flex items-center justify-between rounded-xl border p-2 text-xs transition ${
                        hoveredWgId === wgStat.workingGroup.id
                          ? `${palette.bgSoft} ${palette.border}`
                          : 'border-slate-100 bg-slate-50/60'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span
                          className="h-3 w-3 shrink-0 rounded-full"
                          style={{ backgroundColor: palette.hex }}
                        />
                        <span className="truncate font-bold text-slate-800">
                          {wgStat.workingGroup.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 tabular-fa">
                        <span className="text-[11px] text-slate-500">
                          {formatDecimalHoursPersian(wgStat.totalPersonAttendedMinutes)} ساعت
                        </span>
                        <span className="rounded-md bg-white px-1.5 py-0.5 text-[11px] font-extrabold text-slate-800 shadow-2xs">
                          {toPersianDigits(pct)}٪
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Governance Matrix: Board of Trustees Members × 4 Working Groups */}
        <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/70 px-5 py-4">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
                <Briefcase className="h-4 w-4 text-emerald-600" />
                <span>
                  ماتریس جامع نمایندگان اعضای هیئت امنا و ساعات حضور در کارگروه‌های چهارگانه
                </span>
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                نمایش دقیق اینکه هر نماینده در هر کارگروه، نماینده کدام عضو هیئت امناست به همراه تعداد جلسات و میزان ساعت حضور
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('directory')}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
            >
              مدیریت اسامی اعضا و نمایندگان
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-right text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <th className="px-4 py-3 font-extrabold">عضو هیئت امنا</th>
                  {db.workingGroups.map((wg) => {
                    const pal = getPalette(wg.colorKey)
                    return (
                      <th key={wg.id} className="px-3.5 py-3 font-extrabold">
                        <div className="flex items-center gap-1.5">
                          <span className={`h-2.5 w-2.5 rounded-full ${pal.solidBg}`} />
                          <span>{wg.name}</span>
                        </div>
                      </th>
                    )
                  })}
                  <th className="bg-emerald-50/60 px-4 py-3 font-extrabold text-emerald-900">
                    جمع کل حضور عضو هیئت امنا
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {analytics.boardMemberStats.map((bmStat) => (
                  <tr key={bmStat.boardMember.id} className="transition hover:bg-slate-50/70">
                    <td className="px-4 py-3.5 align-top">
                      <div className="font-extrabold text-slate-900">
                        {bmStat.boardMember.fullName}
                      </div>
                      <div className="mt-0.5 text-[11px] text-slate-500">
                        {bmStat.boardMember.roleTitle}
                      </div>
                    </td>

                    {bmStat.byWorkingGroup.map((cell) => {
                      const hasRep = cell.representativeNames.length > 0
                      return (
                        <td key={cell.workingGroupId} className="px-3.5 py-3.5 align-top">
                          {hasRep ? (
                            <div className="space-y-1">
                              <div className="font-bold text-slate-800">
                                {cell.representativeNames.join(' ، ')}
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5 text-[11px] tabular-fa">
                                <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-semibold text-slate-700">
                                  {toPersianDigits(cell.sessionsAttended)} جلسه
                                </span>
                                <span className="font-bold text-emerald-700">
                                  {formatDurationVerbose(cell.attendedMinutes)}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-300">— بدون نماینده —</span>
                          )}
                        </td>
                      )
                    })}

                    <td className="bg-emerald-50/30 px-4 py-3.5 align-top tabular-fa">
                      <div className="font-black text-emerald-800">
                        {formatDurationVerbose(bmStat.totalAttendedMinutes)}
                      </div>
                      <div className="mt-0.5 text-[11px] font-semibold text-slate-600">
                        {toPersianDigits(bmStat.totalRepAttendedSessions)} نفر-جلسه حضور (
                        {toPersianDigits(bmStat.sessionAttendanceRate)}٪)
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom Split: Top Representatives Breakdown + Latest Meetings & Report Subjects */}
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
          {/* Representatives Summary Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs xl:col-span-7">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h3 className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
                  <Award className="h-4 w-4 text-amber-500" />
                  <span>عملکرد و میزان ساعت حضور به تفکیک هر نماینده</span>
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  مرتب‌شده بر اساس بیشترین ساعت حضور ثبت‌شده در جلسات کارگروه‌ها
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('analytics')}
                className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800"
              >
                <span>مشاهده کامل و ریز جلسات</span>
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500">
                    <th className="px-4 py-2.5 font-bold">نام نماینده</th>
                    <th className="px-3 py-2.5 font-bold">نماینده عضو هیئت امنا</th>
                    <th className="px-3 py-2.5 font-bold">کارگروه</th>
                    <th className="px-3 py-2.5 font-bold text-center">تعداد جلسات</th>
                    <th className="px-4 py-2.5 font-bold">میزان ساعت حضور</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {analytics.representativeStats.slice(0, 8).map((rStat) => (
                    <tr key={rStat.representative.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3 font-bold text-slate-900">
                        {rStat.representative.fullName}
                      </td>
                      <td className="px-3 py-3 text-slate-600">
                        {rStat.boardMember?.fullName || '—'}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-1">
                          {rStat.workingGroups.map((w) => {
                            const pal = getPalette(w.colorKey)
                            return (
                              <span
                                key={w.id}
                                className={`rounded-md border px-1.5 py-0.5 text-[10px] font-bold ${pal.bgBadge}`}
                              >
                                {w.name}
                              </span>
                            )
                          })}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center font-bold text-slate-700 tabular-fa">
                        {toPersianDigits(rStat.attendedSessionsCount)} از{' '}
                        {toPersianDigits(rStat.invitedSessionsCount)}
                      </td>
                      <td className="px-4 py-3 font-extrabold text-emerald-700 tabular-fa">
                        {formatDurationVerbose(rStat.totalAttendedMinutes)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Meetings & Report Subjects */}
          <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs xl:col-span-5">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  آخرین جلسات و موضوعات گزارش‌شده
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  کلیک روی هر جلسه جهت مشاهده یا ویرایش ساعت حضور
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('meetings')}
                className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800"
              >
                <span>همه جلسات و تقویم</span>
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="flex-1 divide-y divide-slate-100">
              {analytics.filteredMeetings.slice(0, 5).map((mtg) => {
                const wg = db.workingGroups.find((w) => w.id === mtg.workingGroupId)
                const pal = getPalette(wg?.colorKey)
                const presentReps = mtg.attendances.filter(
                  (a) => a.status !== 'absent' && a.durationMinutes > 0
                ).length
                return (
                  <div
                    key={mtg.id}
                    onClick={() => onEditMeeting(mtg)}
                    className="cursor-pointer p-4 transition hover:bg-slate-50"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${pal.bgBadge}`}
                      >
                        {wg?.name || 'کارگروه'}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500 tabular-fa">
                        {formatJalaliLong(mtg.jalaliDate)}
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-xs font-bold leading-relaxed text-slate-900">
                      {mtg.subject}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 tabular-fa">
                      <span>
                        ساعت {toPersianDigits(mtg.startTime)} تا {toPersianDigits(mtg.endTime)} (
                        {formatDurationVerbose(mtg.durationMinutes)})
                      </span>
                      <span className="font-semibold text-emerald-700">
                        حضور {toPersianDigits(presentReps)} از{' '}
                        {toPersianDigits(mtg.attendances.length)} نماینده
                      </span>
                    </div>
                  </div>
                )
              })}
              {analytics.filteredMeetings.length === 0 && (
                <div className="p-8 text-center text-xs text-slate-400">
                  هیچ جلسه‌ای با فیلترهای انتخابی یافت نشد.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
