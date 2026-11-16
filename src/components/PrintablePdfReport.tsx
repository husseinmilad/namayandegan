import type { AppDatabase, DashboardFilters, MeetingSession } from '../types/domain'
import type { AnalyticsResult, RepresentativeStat } from '../utils/analytics'
import {
  formatDecimalHoursPersian,
  formatDurationVerbose,
  formatJalaliDisplay,
  getIsoNowJalaliStamp,
  toPersianDigits,
} from '../utils/jalali'

interface PrintablePdfReportProps {
  db: AppDatabase
  analytics: AnalyticsResult
  filters: DashboardFilters
  containerRef: React.RefObject<HTMLDivElement | null>
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  if (arr.length === 0) return [[]]
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size))
  }
  return chunks
}

/**
 * Renders discrete A4 pages (794px x 1123px) styled in Vazirmatn FD so
 * html-to-image + jsPDF captures crisp Persian vector-like typography
 * without ever slicing a table row across page boundaries.
 */
export function PrintablePdfReport({
  db,
  analytics,
  filters,
  containerRef,
}: PrintablePdfReportProps) {
  const wgMap = new Map(db.workingGroups.map((w) => [w.id, w]))
  const repChunks = chunkArray<RepresentativeStat>(analytics.representativeStats, 16)
  const meetingChunks = chunkArray<MeetingSession>(analytics.filteredMeetings, 13)

  const totalPages = 1 + repChunks.length + meetingChunks.length

  const renderPageHeader = (subtitle: string) => (
    <div className="mb-5 flex items-center justify-between border-b-2 border-slate-800 pb-3">
      <div>
        <div className="text-base font-black text-slate-900">{db.organizationTitle}</div>
        <div className="mt-0.5 text-[11px] font-bold text-emerald-700">{subtitle}</div>
      </div>
      <div className="text-left text-[10px] text-slate-600 tabular-fa">
        <div>تاریخ صدور گزارش: {getIsoNowJalaliStamp()}</div>
        {(filters.dateFrom || filters.dateTo) && (
          <div className="mt-0.5">
            بازه فیلتر: {filters.dateFrom ? formatJalaliDisplay(filters.dateFrom) : 'ابتدا'} تا{' '}
            {filters.dateTo ? formatJalaliDisplay(filters.dateTo) : 'امروز'}
          </div>
        )}
      </div>
    </div>
  )

  const renderPageFooter = (pageNum: number) => (
    <div className="mt-auto flex items-center justify-between border-t border-slate-200 pt-2.5 text-[10px] text-slate-500 tabular-fa">
      <span>{db.secretariatSubtitle}</span>
      <span>
        صفحه {toPersianDigits(pageNum)} از {toPersianDigits(totalPages)}
      </span>
    </div>
  )

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed top-0 -left-[9999px] z-[-1] overflow-hidden"
    >
      <div ref={containerRef} dir="rtl" className="bg-white text-right text-slate-900">
        {/* PAGE 1: Executive Overview, Working Groups & Board of Trustees Breakdown */}
        <div
          data-pdf-page="true"
          style={{ width: '794px', height: '1123px' }}
          className="flex flex-col bg-white p-9"
        >
              {renderPageHeader('گزارش کلان مدیریتی، کارگروه‌های تخصصی و اعضای هیئت امنا')}

              {/* KPI Strip */}
              <div className="mb-5 grid grid-cols-4 gap-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="text-[10px] font-bold text-slate-500">تعداد کل جلسات</div>
                  <div className="mt-1 text-xl font-black text-slate-900 tabular-fa">
                    {toPersianDigits(analytics.totalMeetingsCount)} جلسه
                  </div>
                  <div className="mt-0.5 text-[10px] text-slate-500 tabular-fa">
                    مدت: {formatDurationVerbose(analytics.totalMeetingDurationMinutes)}
                  </div>
                </div>

                <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
                  <div className="text-[10px] font-bold text-emerald-800">
                    مجموع نفر-ساعت حضور
                  </div>
                  <div className="mt-1 text-xl font-black text-emerald-800 tabular-fa">
                    {formatDecimalHoursPersian(analytics.totalPersonAttendedMinutes)} ساعت
                  </div>
                  <div className="mt-0.5 text-[10px] text-emerald-700 tabular-fa">
                    {formatDurationVerbose(analytics.totalPersonAttendedMinutes)}
                  </div>
                </div>

                <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3">
                  <div className="text-[10px] font-bold text-amber-800">میانگین نرخ حضور</div>
                  <div className="mt-1 text-xl font-black text-amber-700 tabular-fa">
                    {toPersianDigits(analytics.overallSessionAttendanceRate)}٪
                  </div>
                  <div className="mt-0.5 text-[10px] text-amber-700 tabular-fa">
                    {toPersianDigits(analytics.totalPresentPersonSessions)} از{' '}
                    {toPersianDigits(analytics.totalInvitedPersonSessions)} نفر-جلسه
                  </div>
                </div>

                <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-3">
                  <div className="text-[10px] font-bold text-indigo-800">ساختار کارگروه‌ها</div>
                  <div className="mt-1 text-xl font-black text-indigo-800 tabular-fa">
                    {toPersianDigits(db.representatives.length)} نماینده
                  </div>
                  <div className="mt-0.5 text-[10px] text-indigo-700 tabular-fa">
                    معرفی‌شده از {toPersianDigits(db.boardMembers.length)} عضو هیئت امنا
                  </div>
                </div>
              </div>

              {/* Section A: Working Groups Table */}
              <div className="mb-5">
                <h3 className="mb-2 text-xs font-black text-slate-800">
                  الف) عملکرد کارگروه‌های تخصصی چهارگانه
                </h3>
                <table className="w-full border-collapse border border-slate-300 text-[11px]">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800">
                      <th className="border border-slate-300 px-2.5 py-2 font-extrabold">
                        نام کارگروه تخصصی
                      </th>
                      <th className="border border-slate-300 px-2 py-2 text-center font-extrabold">
                        تعداد نمایندگان
                      </th>
                      <th className="border border-slate-300 px-2 py-2 text-center font-extrabold">
                        تعداد جلسات
                      </th>
                      <th className="border border-slate-300 px-2.5 py-2 font-extrabold">
                        مدت برگزاری جلسات
                      </th>
                      <th className="border border-slate-300 px-2.5 py-2 font-extrabold">
                        مجموع نفر-ساعت حضور
                      </th>
                      <th className="border border-slate-300 px-2 py-2 text-center font-extrabold">
                        درصد حضور
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.workingGroupStats.map((w) => (
                      <tr key={w.workingGroup.id} className="tabular-fa">
                        <td className="border border-slate-300 px-2.5 py-1.5 font-bold">
                          {w.workingGroup.name}
                        </td>
                        <td className="border border-slate-300 px-2 py-1.5 text-center">
                          {toPersianDigits(w.assignedRepresentativesCount)} نفر
                        </td>
                        <td className="border border-slate-300 px-2 py-1.5 text-center font-bold">
                          {toPersianDigits(w.meetingsCount)}
                        </td>
                        <td className="border border-slate-300 px-2.5 py-1.5">
                          {formatDurationVerbose(w.totalMeetingDurationMinutes)}
                        </td>
                        <td className="border border-slate-300 px-2.5 py-1.5 font-bold text-emerald-800">
                          {formatDurationVerbose(w.totalPersonAttendedMinutes)}
                        </td>
                        <td className="border border-slate-300 px-2 py-1.5 text-center font-bold">
                          {toPersianDigits(w.attendanceRate)}٪
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Section B: Board of Trustees Breakdown */}
              <div>
                <h3 className="mb-2 text-xs font-black text-slate-800">
                  ب) گزارش تعداد جلسات و میزان ساعت حضور نمایندگان به تفکیک هر عضو هیئت امنا
                </h3>
                <table className="w-full border-collapse border border-slate-300 text-[10.5px]">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800">
                      <th className="border border-slate-300 px-2 py-2 font-extrabold">
                        نام عضو هیئت امنا
                      </th>
                      <th className="border border-slate-300 px-2 py-2 font-extrabold">
                        اسامی نمایندگان ایشان در کارگروه‌ها
                      </th>
                      <th className="border border-slate-300 px-2 py-2 text-center font-extrabold">
                        نفر-جلسه حضور
                      </th>
                      <th className="border border-slate-300 px-2 py-2 font-extrabold">
                        مجموع ساعت حضور
                      </th>
                      <th className="border border-slate-300 px-2 py-2 text-center font-extrabold">
                        نرخ حضور
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.boardMemberStats.map((bm) => (
                      <tr key={bm.boardMember.id} className="tabular-fa">
                        <td className="border border-slate-300 px-2 py-2">
                          <div className="font-extrabold text-slate-900">
                            {bm.boardMember.fullName}
                          </div>
                          <div className="text-[9.5px] text-slate-500">
                            {bm.boardMember.roleTitle}
                          </div>
                        </td>
                        <td className="border border-slate-300 px-2 py-2 leading-relaxed text-slate-700">
                          {bm.representatives.map((r) => r.fullName).join(' ، ') || '—'}
                        </td>
                        <td className="border border-slate-300 px-2 py-2 text-center font-bold">
                          {toPersianDigits(bm.totalRepAttendedSessions)} از{' '}
                          {toPersianDigits(bm.totalRepInvitedSessions)}
                        </td>
                        <td className="border border-slate-300 px-2 py-2 font-extrabold text-emerald-800">
                          {formatDurationVerbose(bm.totalAttendedMinutes)}
                        </td>
                        <td className="border border-slate-300 px-2 py-2 text-center font-bold">
                          {toPersianDigits(bm.sessionAttendanceRate)}٪
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {renderPageFooter(1)}
        </div>

        {/* PAGES 2+: Per-Representative Detailed Breakdown */}
        {repChunks.map((chunk, chunkIdx) => {
          const currentPage = 2 + chunkIdx
          return (
            <div
              key={`rep-page-${chunkIdx}`}
              data-pdf-page="true"
              style={{ width: '794px', height: '1123px' }}
              className="flex flex-col bg-white p-9"
            >
              {renderPageHeader('گزارش تفکیکی تعداد جلسات و میزان ساعت حضور هر نماینده کارگروه')}

              <h3 className="mb-2.5 text-xs font-black text-slate-800">
                ج) جدول عملکرد حضور نمایندگان کارگروه‌های تخصصی و انتساب به اعضای هیئت امنا
              </h3>

              <table className="w-full border-collapse border border-slate-300 text-[10.5px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-800">
                    <th className="border border-slate-300 px-2 py-2 text-center font-extrabold">
                      ردیف
                    </th>
                    <th className="border border-slate-300 px-2.5 py-2 font-extrabold">
                      نام و نام خانوادگی نماینده
                    </th>
                    <th className="border border-slate-300 px-2.5 py-2 font-extrabold">
                      نماینده عضو هیئت امنا
                    </th>
                    <th className="border border-slate-300 px-2 py-2 font-extrabold">
                      کارگروه تخصصی
                    </th>
                    <th className="border border-slate-300 px-2 py-2 text-center font-extrabold">
                      جلسات حضور
                    </th>
                    <th className="border border-slate-300 px-2.5 py-2 font-extrabold">
                      میزان ساعت حضور
                    </th>
                    <th className="border border-slate-300 px-2 py-2 text-center font-extrabold">
                      درصد
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {chunk.map((rStat, i) => (
                    <tr key={rStat.representative.id} className="tabular-fa">
                      <td className="border border-slate-300 px-2 py-1.5 text-center">
                        {toPersianDigits(chunkIdx * 16 + i + 1)}
                      </td>
                      <td className="border border-slate-300 px-2.5 py-1.5 font-bold text-slate-900">
                        {rStat.representative.fullName}
                      </td>
                      <td className="border border-slate-300 px-2.5 py-1.5 text-indigo-900">
                        {rStat.boardMember?.fullName || '—'}
                      </td>
                      <td className="border border-slate-300 px-2 py-1.5">
                        {rStat.workingGroups.map((w) => w.name).join(' ، ')}
                      </td>
                      <td className="border border-slate-300 px-2 py-1.5 text-center font-bold">
                        {toPersianDigits(rStat.attendedSessionsCount)} از{' '}
                        {toPersianDigits(rStat.invitedSessionsCount)}
                      </td>
                      <td className="border border-slate-300 px-2.5 py-1.5 font-extrabold text-emerald-800">
                        {formatDurationVerbose(rStat.totalAttendedMinutes)}
                      </td>
                      <td className="border border-slate-300 px-2 py-1.5 text-center font-bold">
                        {toPersianDigits(rStat.sessionAttendanceRate)}٪
                      </td>
                    </tr>
                  ))}
                  {chunk.length === 0 && (
                    <tr>
                      <td colSpan={7} className="border border-slate-300 py-6 text-center text-slate-400">
                        اطلاعاتی ثبت نشده است.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {renderPageFooter(currentPage)}
            </div>
          )
        })}

        {/* PAGES 3+: Meetings & Report Subjects Log */}
        {meetingChunks.map((chunk, chunkIdx) => {
          const currentPage = 2 + repChunks.length + chunkIdx
          return (
            <div
              key={`mtg-page-${chunkIdx}`}
              data-pdf-page="true"
              style={{ width: '794px', height: '1123px' }}
              className="flex flex-col bg-white p-9"
            >
              {renderPageHeader('فهرست جلسات برگزارشده، زمان‌بندی و موضوعات گزارش کارگروه‌ها')}

              <h3 className="mb-2.5 text-xs font-black text-slate-800">
                د) کارنامه جلسات برگزارشده به تفکیک تاریخ شمسی، ساعت شروع و پایان و موضوع گزارش
              </h3>

              <table className="w-full border-collapse border border-slate-300 text-[10.5px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-800">
                    <th className="border border-slate-300 px-2 py-2 text-center font-extrabold">
                      ردیف
                    </th>
                    <th className="border border-slate-300 px-2 py-2 text-center font-extrabold">
                      تاریخ شمسی
                    </th>
                    <th className="border border-slate-300 px-2 py-2 font-extrabold">
                      نام کارگروه
                    </th>
                    <th className="border border-slate-300 px-2 py-2 text-center font-extrabold">
                      ساعت جلسه
                    </th>
                    <th className="border border-slate-300 px-2 py-2 text-center font-extrabold">
                      مدت
                    </th>
                    <th className="border border-slate-300 px-2.5 py-2 font-extrabold">
                      موضوع گزارش
                    </th>
                    <th className="border border-slate-300 px-2 py-2 text-center font-extrabold">
                      حاضرین
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {chunk.map((m, i) => {
                    const presentCount = m.attendances.filter(
                      (a) => a.status !== 'absent' && a.durationMinutes > 0
                    ).length
                    return (
                      <tr key={m.id} className="tabular-fa">
                        <td className="border border-slate-300 px-2 py-1.5 text-center">
                          {toPersianDigits(chunkIdx * 13 + i + 1)}
                        </td>
                        <td className="border border-slate-300 px-2 py-1.5 text-center font-bold">
                          {formatJalaliDisplay(m.jalaliDate)}
                        </td>
                        <td className="border border-slate-300 px-2 py-1.5 font-bold">
                          {wgMap.get(m.workingGroupId)?.name || '—'}
                        </td>
                        <td className="border border-slate-300 px-2 py-1.5 text-center">
                          {toPersianDigits(m.startTime)} تا {toPersianDigits(m.endTime)}
                        </td>
                        <td className="border border-slate-300 px-2 py-1.5 text-center">
                          {formatDurationVerbose(m.durationMinutes)}
                        </td>
                        <td className="border border-slate-300 px-2.5 py-1.5 leading-relaxed font-medium">
                          {m.subject}
                        </td>
                        <td className="border border-slate-300 px-2 py-1.5 text-center font-bold text-emerald-800">
                          {toPersianDigits(presentCount)}/{toPersianDigits(m.attendances.length)}
                        </td>
                      </tr>
                    )
                  })}
                  {chunk.length === 0 && (
                    <tr>
                      <td colSpan={7} className="border border-slate-300 py-6 text-center text-slate-400">
                        جلسه‌ای ثبت نشده است.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {renderPageFooter(currentPage)}
            </div>
          )
        })}
      </div>
    </div>
  )
}
