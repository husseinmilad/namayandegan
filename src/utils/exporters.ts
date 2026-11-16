import { toPng } from 'html-to-image'
import { jsPDF } from 'jspdf'
import * as XLSX from 'xlsx'
import type { AppDatabase, DashboardFilters } from '../types/domain'
import type { AnalyticsResult } from './analytics'
import {
  formatDurationClock,
  formatDurationVerbose,
  formatJalaliDisplay,
  formatJalaliLong,
  getIsoNowJalaliStamp,
  getTodayJalali,
  minutesToDecimalHours,
  toPersianDigits,
} from './jalali'

export function exportAnalyticsToExcel(
  db: AppDatabase,
  analytics: AnalyticsResult,
  filters: DashboardFilters
): string {
  const wb = XLSX.utils.book_new()
  wb.Workbook = { Views: [{ RTL: true }] }

  const wgMap = new Map(db.workingGroups.map((w) => [w.id, w]))
  const repMap = new Map(db.representatives.map((r) => [r.id, r]))
  const bmMap = new Map(db.boardMembers.map((b) => [b.id, b]))

  // Sheet 1: خلاصه کارگروه‌ها
  const wgRows: Record<string, string | number>[] = analytics.workingGroupStats.map((w, idx) => ({
    ردیف: idx + 1,
    'نام کارگروه تخصصی': w.workingGroup.name,
    'تعداد نمایندگان عضو': w.assignedRepresentativesCount,
    'تعداد جلسات برگزارشده': w.meetingsCount,
    'مجموع زمان جلسات (ساعت:دقیقه)': formatDurationClock(w.totalMeetingDurationMinutes),
    'مجموع زمان جلسات (ساعت اعشاری)': minutesToDecimalHours(w.totalMeetingDurationMinutes),
    'مجموع نفر-ساعت حضور نمایندگان': formatDurationVerbose(w.totalPersonAttendedMinutes),
    'نفر-ساعت حضور (عدد ساعت)': minutesToDecimalHours(w.totalPersonAttendedMinutes),
    'میانگین نرخ حضور (%)': w.attendanceRate,
    'آخرین جلسه (شمسی)': w.lastMeetingDate ? formatJalaliDisplay(w.lastMeetingDate) : '—',
  }))

  wgRows.push({
    ردیف: '',
    'نام کارگروه تخصصی': 'جمع کل / میانگین کلان',
    'تعداد نمایندگان عضو': db.representatives.length,
    'تعداد جلسات برگزارشده': analytics.totalMeetingsCount,
    'مجموع زمان جلسات (ساعت:دقیقه)': formatDurationClock(analytics.totalMeetingDurationMinutes),
    'مجموع زمان جلسات (ساعت اعشاری)': minutesToDecimalHours(analytics.totalMeetingDurationMinutes),
    'مجموع نفر-ساعت حضور نمایندگان': formatDurationVerbose(analytics.totalPersonAttendedMinutes),
    'نفر-ساعت حضور (عدد ساعت)': minutesToDecimalHours(analytics.totalPersonAttendedMinutes),
    'میانگین نرخ حضور (%)': analytics.overallSessionAttendanceRate,
    'آخرین جلسه (شمسی)': formatJalaliDisplay(getTodayJalali()),
  })

  const ws1 = XLSX.utils.json_to_sheet(wgRows)
  ws1['!cols'] = [
    { wch: 8 },
    { wch: 28 },
    { wch: 20 },
    { wch: 22 },
    { wch: 26 },
    { wch: 26 },
    { wch: 30 },
    { wch: 24 },
    { wch: 20 },
    { wch: 18 },
  ]
  ;(ws1 as Record<string, unknown>)['!views'] = [{ rightToLeft: true }]
  XLSX.utils.book_append_sheet(wb, ws1, 'خلاصه کارگروه‌ها')

  // Sheet 2: به تفکیک اعضای هیئت امنا
  const bmRows = analytics.boardMemberStats.map((b, idx) => {
    const row: Record<string, string | number> = {
      ردیف: idx + 1,
      'نام عضو هیئت امنا': b.boardMember.fullName,
      'سمت در هیئت امنا': b.boardMember.roleTitle,
      'تعداد نمایندگان معرفی‌شده': b.representatives.length,
      'اسامی نمایندگان ایشان': b.representatives.map((r) => r.fullName).join(' ، '),
      'جلسات دارای نماینده حاضر': b.uniqueMeetingsCoveredCount,
      'مجموع نفر-جلسه حضور نمایندگان': b.totalRepAttendedSessions,
      'کل نفر-جلسات دعوت‌شده': b.totalRepInvitedSessions,
      'مجموع ساعت حضور نمایندگان': formatDurationVerbose(b.totalAttendedMinutes),
      'مجموع حضور (عدد ساعت)': minutesToDecimalHours(b.totalAttendedMinutes),
      'نرخ حضور نمایندگان (%)': b.sessionAttendanceRate,
    }
    for (const wgSlice of b.byWorkingGroup) {
      row[`ساعت حضور - ${wgSlice.workingGroupName}`] = minutesToDecimalHours(wgSlice.attendedMinutes)
      row[`جلسات - ${wgSlice.workingGroupName}`] = wgSlice.sessionsAttended
    }
    return row
  })

  const ws2 = XLSX.utils.json_to_sheet(bmRows)
  ws2['!cols'] = [
    { wch: 8 },
    { wch: 28 },
    { wch: 22 },
    { wch: 22 },
    { wch: 46 },
    { wch: 24 },
    { wch: 26 },
    { wch: 22 },
    { wch: 28 },
    { wch: 22 },
    { wch: 20 },
    { wch: 24 },
    { wch: 20 },
    { wch: 24 },
    { wch: 20 },
    { wch: 24 },
    { wch: 20 },
    { wch: 24 },
    { wch: 20 },
  ]
  ;(ws2 as Record<string, unknown>)['!views'] = [{ rightToLeft: true }]
  XLSX.utils.book_append_sheet(wb, ws2, 'اعضای هیئت امنا')

  // Sheet 3: به تفکیک نمایندگان کارگروه‌ها
  const repRows = analytics.representativeStats.map((r, idx) => ({
    ردیف: idx + 1,
    'نام و نام خانوادگی نماینده': r.representative.fullName,
    'نماینده عضو هیئت امنا': r.boardMember?.fullName || 'نامشخص',
    'سمت عضو هیئت امنا': r.boardMember?.roleTitle || '',
    'تخصص نماینده': r.representative.specialtyTitle || '—',
    'کارگروه‌های عضویت': r.workingGroups.map((w) => w.name).join(' ، '),
    'تعداد کل جلسات دعوت‌شده': r.invitedSessionsCount,
    'تعداد جلسات حضور': r.attendedSessionsCount,
    'تعداد غیبت': r.absentSessionsCount,
    'میزان ساعت حضور (ساعت و دقیقه)': formatDurationVerbose(r.totalAttendedMinutes),
    'میزان ساعت حضور (ساعت:دقیقه)': formatDurationClock(r.totalAttendedMinutes),
    'میزان حضور (عدد ساعت)': minutesToDecimalHours(r.totalAttendedMinutes),
    'درصد حضور جلسات (%)': r.sessionAttendanceRate,
    'درصد حضور زمانی (%)': r.timeAttendanceRate,
  }))

  const ws3 = XLSX.utils.json_to_sheet(repRows)
  ws3['!cols'] = [
    { wch: 8 },
    { wch: 28 },
    { wch: 28 },
    { wch: 20 },
    { wch: 32 },
    { wch: 34 },
    { wch: 22 },
    { wch: 18 },
    { wch: 14 },
    { wch: 28 },
    { wch: 22 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
  ]
  ;(ws3 as Record<string, unknown>)['!views'] = [{ rightToLeft: true }]
  XLSX.utils.book_append_sheet(wb, ws3, 'نمایندگان کارگروه‌ها')

  // Sheet 4: فهرست جلسات و موضوعات گزارش
  const mtgRows = analytics.filteredMeetings.map((m, idx) => {
    const presentCount = m.attendances.filter((a) => a.status !== 'absent' && a.durationMinutes > 0).length
    const totalPersonMins = m.attendances.reduce(
      (s, a) => s + (a.status !== 'absent' ? a.durationMinutes : 0),
      0
    )
    return {
      ردیف: idx + 1,
      'شماره جلسه': m.sessionNumber || '—',
      'تاریخ جلسه (شمسی)': formatJalaliDisplay(m.jalaliDate),
      'تاریخ حروفی': formatJalaliLong(m.jalaliDate),
      'نام کارگروه': wgMap.get(m.workingGroupId)?.name || '—',
      'ساعت شروع': toPersianDigits(m.startTime),
      'ساعت پایان': toPersianDigits(m.endTime),
      'مدت جلسه': formatDurationVerbose(m.durationMinutes),
      'مدت جلسه (ساعت)': minutesToDecimalHours(m.durationMinutes),
      'تعداد حاضرین': presentCount,
      'کل مدعوین': m.attendances.length,
      'مجموع نفر-ساعت جلسه': minutesToDecimalHours(totalPersonMins),
      'موضوع گزارش': m.subject,
      'خلاصه مباحث و مصوبات': m.summary || '—',
    }
  })

  const ws4 = XLSX.utils.json_to_sheet(mtgRows)
  ws4['!cols'] = [
    { wch: 8 },
    { wch: 16 },
    { wch: 18 },
    { wch: 26 },
    { wch: 26 },
    { wch: 14 },
    { wch: 14 },
    { wch: 22 },
    { wch: 16 },
    { wch: 14 },
    { wch: 14 },
    { wch: 20 },
    { wch: 52 },
    { wch: 56 },
  ]
  ;(ws4 as Record<string, unknown>)['!views'] = [{ rightToLeft: true }]
  XLSX.utils.book_append_sheet(wb, ws4, 'فهرست جلسات و موضوعات')

  // Sheet 5: ریز حضور و غیاب جلسات
  const detailRows: Record<string, string | number>[] = []
  let rowIndex = 1
  for (const m of analytics.filteredMeetings) {
    const wgName = wgMap.get(m.workingGroupId)?.name || '—'
    for (const a of m.attendances) {
      if (filters.representativeId !== 'all' && a.representativeId !== filters.representativeId) {
        continue
      }
      const rep = repMap.get(a.representativeId)
      const bm = rep ? bmMap.get(rep.boardMemberId) : undefined
      if (filters.boardMemberId !== 'all' && bm?.id !== filters.boardMemberId) {
        continue
      }
      const statusLabel =
        a.status === 'present' ? 'حاضر کامل' : a.status === 'partial' ? 'حضور ساعتی' : 'غایب'
      detailRows.push({
        ردیف: rowIndex++,
        'تاریخ جلسه (شمسی)': formatJalaliDisplay(m.jalaliDate),
        'نام کارگروه': wgName,
        'موضوع گزارش': m.subject,
        'نام نماینده': rep?.fullName || '—',
        'نماینده عضو هیئت امنا': bm?.fullName || '—',
        'وضعیت حضور': statusLabel,
        'ساعت ورود نماینده': a.status === 'absent' ? '—' : toPersianDigits(a.startTime),
        'ساعت خروج نماینده': a.status === 'absent' ? '—' : toPersianDigits(a.endTime),
        'مدت حضور (ساعت و دقیقه)': a.status === 'absent' ? '۰' : formatDurationVerbose(a.durationMinutes),
        'مدت حضور (عدد ساعت)': a.status === 'absent' ? 0 : minutesToDecimalHours(a.durationMinutes),
        توضیحات: a.note || '—',
      })
    }
  }

  const ws5 = XLSX.utils.json_to_sheet(detailRows)
  ws5['!cols'] = [
    { wch: 8 },
    { wch: 18 },
    { wch: 24 },
    { wch: 44 },
    { wch: 26 },
    { wch: 28 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 24 },
    { wch: 20 },
    { wch: 32 },
  ]
  ;(ws5 as Record<string, unknown>)['!views'] = [{ rightToLeft: true }]
  XLSX.utils.book_append_sheet(wb, ws5, 'ریز حضور نمایندگان')

  const stamp = getTodayJalali().replace(/\//g, '-')
  const fileName = `گزارش-حضور-نمایندگان-هیئت-امنا-${stamp}.xlsx`
  XLSX.writeFile(wb, fileName)
  return fileName
}

export async function exportReportPagesToPdf(
  containerEl: HTMLElement,
  customFileName?: string
): Promise<string> {
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready
  }

  const pageEls = Array.from(
    containerEl.querySelectorAll<HTMLElement>('[data-pdf-page="true"]')
  )
  if (pageEls.length === 0) {
    throw new Error('صفحه‌ای برای تولید گزارش PDF یافت نشد.')
  }

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  })

  const pageWidthMm = 210
  const pageHeightMm = 297

  for (let i = 0; i < pageEls.length; i++) {
    const pageEl = pageEls[i]
    const dataUrl = await toPng(pageEl, {
      quality: 0.98,
      pixelRatio: 2,
      backgroundColor: '#ffffff',
      cacheBust: true,
    })

    if (i > 0) {
      pdf.addPage('a4', 'portrait')
    }
    pdf.addImage(dataUrl, 'PNG', 0, 0, pageWidthMm, pageHeightMm, undefined, 'FAST')
  }

  const stamp = getTodayJalali().replace(/\//g, '-')
  const fileName = customFileName || `گزارش-مدیریتی-نمایندگان-هیئت-امنا-${stamp}.pdf`
  pdf.save(fileName)
  return fileName
}

export async function exportElementToPng(
  targetEl: HTMLElement,
  customFileName?: string
): Promise<string> {
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready
  }
  const dataUrl = await toPng(targetEl, {
    quality: 0.98,
    pixelRatio: 2,
    backgroundColor: '#f8fafc',
    cacheBust: true,
  })
  const stamp = getTodayJalali().replace(/\//g, '-')
  const fileName = customFileName || `داشبورد-هیئت-امنا-${stamp}.png`
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  return fileName
}

export function buildExecutiveShareText(
  db: AppDatabase,
  analytics: AnalyticsResult,
  filters: DashboardFilters
): string {
  const lines: string[] = []
  lines.push(`📊 *گزارش مدیریتی حضور نمایندگان هیئت امنا*`)
  lines.push(`🏛 ${db.organizationTitle}`)
  lines.push(`📅 تاریخ گزارش: ${getIsoNowJalaliStamp()}`)
  if (filters.dateFrom || filters.dateTo) {
    lines.push(
      `🔎 بازه زمانی: ${filters.dateFrom ? formatJalaliDisplay(filters.dateFrom) : 'ابتدا'} تا ${
        filters.dateTo ? formatJalaliDisplay(filters.dateTo) : 'امروز'
      }`
    )
  }
  lines.push(`────────────────────`)
  lines.push(`📌 *شاخص‌های کلان:*`)
  lines.push(`• تعداد جلسات برگزارشده: ${toPersianDigits(analytics.totalMeetingsCount)} جلسه`)
  lines.push(
    `• مجموع مدت برگزاری جلسات: ${formatDurationVerbose(analytics.totalMeetingDurationMinutes)}`
  )
  lines.push(
    `• مجموع نفر-ساعت حضور نمایندگان: ${formatDurationVerbose(analytics.totalPersonAttendedMinutes)}`
  )
  lines.push(
    `• میانگین نرخ حضور جلسات: ${toPersianDigits(analytics.overallSessionAttendanceRate)}٪`
  )
  lines.push(``)
  lines.push(`🗂 *عملکرد کارگروه‌های تخصصی:*`)
  for (const wg of analytics.workingGroupStats) {
    lines.push(
      `• ${wg.workingGroup.name}: ${toPersianDigits(wg.meetingsCount)} جلسه | مجموع حضور: ${formatDurationVerbose(
        wg.totalPersonAttendedMinutes
      )} (${toPersianDigits(wg.attendanceRate)}٪)`
    )
  }
  lines.push(``)
  lines.push(`👥 *مجموع ساعات حضور نمایندگان به تفکیک اعضای هیئت امنا:*`)
  for (const bm of analytics.boardMemberStats) {
    lines.push(
      `• نمایندگان ${bm.boardMember.fullName}: ${toPersianDigits(
        bm.totalRepAttendedSessions
      )} نفر-جلسه | ${formatDurationVerbose(bm.totalAttendedMinutes)} (${toPersianDigits(
        bm.sessionAttendanceRate
      )}٪)`
    )
  }
  lines.push(``)
  lines.push(`👤 *خلاصه حضور نمایندگان کارگروه‌ها:*`)
  for (const r of analytics.representativeStats) {
    lines.push(
      `• ${r.representative.fullName} (نماینده ${
        r.boardMember?.fullName || '—'
      }): ${toPersianDigits(r.attendedSessionsCount)} از ${toPersianDigits(
        r.invitedSessionsCount
      )} جلسه | ${formatDurationVerbose(r.totalAttendedMinutes)}`
    )
  }
  return lines.join('\n')
}
