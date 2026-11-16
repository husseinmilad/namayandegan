import {
  ArchiveRestore,
  BarChart3,
  Building2,
  CalendarRange,
  CheckCircle2,
  Database,
  Download,
  FileSpreadsheet,
  FileText,
  HardDrive,
  LayoutDashboard,
  Loader2,
  Menu,
  Plus,
  Share2,
  Users,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { AnalyticsBreakdownView } from './components/AnalyticsBreakdownView'
import { DashboardView } from './components/DashboardView'
import { DirectoryManagementView } from './components/DirectoryManagementView'
import { FileManagementView } from './components/FileManagementView'
import { MeetingModal } from './components/MeetingModal'
import { MeetingsView } from './components/MeetingsView'
import { PrintablePdfReport } from './components/PrintablePdfReport'
import { ShareModal } from './components/ShareModal'
import { createInitialSeedDatabase } from './data/seedData'
import {
  DEFAULT_FILTERS,
  type ActiveTab,
  type AppDatabase,
  type DashboardFilters,
  type MeetingSession,
} from './types/domain'
import { computeAnalytics } from './utils/analytics'
import {
  exportAnalyticsToExcel,
  exportElementToPng,
  exportReportPagesToPdf,
} from './utils/exporters'
import {
  type LocalFileHandle,
  clearShareUrlHash,
  downloadDatabaseJsonFile,
  loadInitialDatabase,
  parseUploadedJsonFile,
  saveToBrowserStorage,
  saveToServerDisk,
} from './utils/fileStorage'
import { formatJalaliLong, getTodayJalali, toPersianDigits } from './utils/jalali'

export function App() {
  const [db, setDb] = useState<AppDatabase>(() => createInitialSeedDatabase())
  const [loading, setLoading] = useState(true)
  const [diskConnected, setDiskConnected] = useState(false)
  const [isSharedSnapshot, setIsSharedSnapshot] = useState(false)
  const [connectedFileHandle, setConnectedFileHandle] = useState<LocalFileHandle | null>(null)

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [filters, setFilters] = useState<DashboardFilters>(DEFAULT_FILTERS)

  // Meeting Modal State
  const [meetingModalOpen, setMeetingModalOpen] = useState(false)
  const [editingMeeting, setEditingMeeting] = useState<MeetingSession | null>(null)
  const [presetWgId, setPresetWgId] = useState<string | undefined>(undefined)
  const [presetJalaliDate, setPresetJalaliDate] = useState<string | undefined>(undefined)

  // Share & Export State
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [exportingPdf, setExportingPdf] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const quickRestoreInputRef = useRef<HTMLInputElement>(null)
  const pdfReportContainerRef = useRef<HTMLDivElement>(null)
  const dashboardCaptureRef = useRef<HTMLDivElement>(null)

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
  }

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 4200)
    return () => clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    let mounted = true
    void loadInitialDatabase().then((res) => {
      if (!mounted) return
      setDb(res.db)
      setDiskConnected(res.diskConnected)
      setIsSharedSnapshot(res.isSharedSnapshot)
      setLoading(false)
    })
    return () => {
      mounted = false
    }
  }, [])

  const persistDatabase = (nextDb: AppDatabase) => {
    const stamped: AppDatabase = {
      ...nextDb,
      lastUpdated: new Date().toISOString(),
    }
    setDb(stamped)
    if (!isSharedSnapshot) {
      saveToBrowserStorage(stamped)
      void saveToServerDisk(stamped).then((ok) => {
        if (ok) setDiskConnected(true)
      })
    }
  }

  const handleUpdateDb = (updater: (prev: AppDatabase) => AppDatabase, toastMsg?: string) => {
    const next = updater(db)
    persistDatabase(next)
    if (toastMsg) showToast(toastMsg)
  }

  const handleReplaceDb = (next: AppDatabase, toastMsg: string) => {
    setIsSharedSnapshot(false)
    clearShareUrlHash()
    const stamped = { ...next, lastUpdated: new Date().toISOString() }
    setDb(stamped)
    saveToBrowserStorage(stamped)
    void saveToServerDisk(stamped).then((ok) => {
      if (ok) setDiskConnected(true)
    })
    showToast(toastMsg)
  }

  const analytics = useMemo(() => computeAnalytics(db, filters), [db, filters])

  const handleOpenNewMeeting = (wgId?: string, jDate?: string) => {
    setEditingMeeting(null)
    setPresetWgId(wgId)
    setPresetJalaliDate(jDate)
    setMeetingModalOpen(true)
  }

  const handleOpenEditMeeting = (m: MeetingSession) => {
    setEditingMeeting(m)
    setPresetWgId(undefined)
    setPresetJalaliDate(undefined)
    setMeetingModalOpen(true)
  }

  const handleSaveMeeting = (saved: MeetingSession) => {
    const exists = db.meetings.some((m) => m.id === saved.id)
    handleUpdateDb(
      (prev) => ({
        ...prev,
        meetings: exists
          ? prev.meetings.map((m) => (m.id === saved.id ? saved : m))
          : [saved, ...prev.meetings],
      }),
      exists ? 'اطلاعات جلسه و ساعات حضور به‌روزرسانی شد.' : 'جلسه جدید با موفقیت ثبت و محاسبه شد.'
    )
    setMeetingModalOpen(false)
  }

  const handleDeleteMeeting = (id: string) => {
    handleUpdateDb(
      (prev) => ({
        ...prev,
        meetings: prev.meetings.filter((m) => m.id !== id),
      }),
      'جلسه مورد نظر حذف گردید.'
    )
  }

  const handleQuickFileSave = () => {
    const fileName = downloadDatabaseJsonFile(db)
    showToast(`فایل پشتیبان «${fileName}» با موفقیت ذخیره شد.`)
  }

  const handleQuickFileRestore = async (file: File) => {
    try {
      const parsed = await parseUploadedJsonFile(file)
      handleReplaceDb(parsed, `فایل «${file.name}» با موفقیت بازیابی گردید.`)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'خطا در بازیابی فایل انتخابی', 'error')
    }
  }

  const handleExportExcel = () => {
    try {
      const name = exportAnalyticsToExcel(db, analytics, filters)
      showToast(`فایل اکسل «${name}» با موفقیت تولید و دانلود شد.`)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'خطا در صدور فایل اکسل', 'error')
    }
  }

  const handleExportPdf = async () => {
    if (!pdfReportContainerRef.current || exportingPdf) return
    setExportingPdf(true)
    try {
      const name = await exportReportPagesToPdf(pdfReportContainerRef.current)
      showToast(`فایل پی‌دی‌اف «${name}» با موفقیت تولید و دانلود شد.`)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'خطا در تولید گزارش PDF', 'error')
    } finally {
      setExportingPdf(false)
    }
  }

  const handleDownloadPngSnapshot = async () => {
    if (!dashboardCaptureRef.current) {
      setActiveTab('dashboard')
      await new Promise((r) => setTimeout(r, 250))
    }
    if (dashboardCaptureRef.current) {
      const name = await exportElementToPng(dashboardCaptureRef.current)
      showToast(`تصویر گرافیکی «${name}» دانلود شد.`)
    }
  }

  const navItems: Array<{
    id: ActiveTab
    label: string
    badge?: string
    icon: React.ComponentType<{ className?: string }>
  }> = [
    { id: 'dashboard', label: 'داشبورد مدیریتی', icon: LayoutDashboard },
    {
      id: 'meetings',
      label: 'ثبت جلسات و تقویم شمسی',
      badge: toPersianDigits(db.meetings.length),
      icon: CalendarRange,
    },
    {
      id: 'analytics',
      label: 'گزارش تفکیکی اعضا و نمایندگان',
      icon: BarChart3,
    },
    {
      id: 'directory',
      label: 'ساختار هیئت امنا و کارگروه‌ها',
      badge: toPersianDigits(db.representatives.length),
      icon: Users,
    },
    {
      id: 'files',
      label: 'ذخیره و بازیابی فایلی',
      icon: Database,
    },
  ]

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3 text-slate-600">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <span className="text-sm font-bold">در حال بارگذاری سامانه مدیریت نمایندگان هیئت امنا...</span>
        </div>
      </div>
    )
  }

  return (
    <div dir="rtl" className="flex min-h-screen bg-slate-100/70 text-slate-900">
      {/* Hidden Quick File Input for Header Restore */}
      <input
        ref={quickRestoreInputRef}
        type="file"
        accept=".json,application/json"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) void handleQuickFileRestore(f)
          e.target.value = ''
        }}
        className="hidden"
      />

      {/* Desktop Right Sidebar */}
      <aside className="no-print sticky top-0 hidden h-screen w-72 shrink-0 flex-col border-l border-slate-200/90 bg-white lg:flex">
        {/* Brand Header */}
        <div className="border-b border-slate-100 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-slate-900 text-white shadow-md shadow-emerald-900/15">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-sm font-black text-slate-900">هیئت امنا و کارگروه‌ها</h2>
              <p className="truncate text-[11px] font-medium text-slate-500">
                سامانه لوکال پایش حضور نمایندگان
              </p>
            </div>
          </div>
        </div>

        {/* Primary CTA */}
        <div className="px-4 pt-4 pb-2">
          <button
            type="button"
            onClick={() => handleOpenNewMeeting()}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-xs font-extrabold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            ثبت جلسه جدید کارگروه
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = activeTab === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex w-full items-center justify-between rounded-2xl px-3.5 py-3 text-xs font-bold transition ${
                  active
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`h-4 w-4 ${active ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold tabular-fa ${
                      active ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Sidebar Local File Storage Footer */}
        <div className="border-t border-slate-100 bg-slate-50/70 p-4">
          <div className="mb-2.5 flex items-center gap-2 text-[11px] font-bold text-slate-700">
            <HardDrive className="h-3.5 w-3.5 text-emerald-600" />
            <span>
              {diskConnected ? 'ذخیره‌ساز لوکال دیسک فعال' : 'ذخیره‌ساز لوکال مرورگر فعال'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleQuickFileSave}
              className="inline-flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-[11px] font-extrabold text-slate-700 shadow-2xs transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800"
            >
              <Download className="h-3.5 w-3.5 text-emerald-600" />
              ذخیره فایلی
            </button>
            <button
              type="button"
              onClick={() => quickRestoreInputRef.current?.click()}
              className="inline-flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-[11px] font-extrabold text-slate-700 shadow-2xs transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-800"
            >
              <ArchiveRestore className="h-3.5 w-3.5 text-amber-600" />
              بازیابی فایلی
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer Navigation */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="relative z-10 flex w-72 flex-col bg-white p-4 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-sm font-black text-slate-900">منوی سامانه نمایندگان</span>
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-1.5">
              {navItems.map((item) => {
                const Icon = item.icon
                const active = activeTab === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.id)
                      setMobileNavOpen(false)
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3.5 py-3 text-xs font-bold ${
                      active ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && <span className="text-[11px]">{item.badge}</span>}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Sticky Header */}
        <header className="no-print sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 px-4 py-3 backdrop-blur-md sm:px-6">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileNavOpen(true)}
                className="rounded-xl border border-slate-200 p-2 text-slate-700 lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-slate-800 sm:text-sm">
                    امروز: {formatJalaliLong(getTodayJalali())}
                  </span>
                  <span className="hidden rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 sm:inline-block">
                    تقویم رسمی شمسی
                  </span>
                </div>
              </div>
            </div>

            {/* Global Quick Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleQuickFileSave}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800"
                title="ذخیره پایگاه‌داده در فایل JSON"
              >
                <Download className="h-3.5 w-3.5 text-emerald-600" />
                <span className="hidden sm:inline">ذخیره فایلی</span>
              </button>

              <button
                type="button"
                onClick={() => quickRestoreInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-800"
                title="بازیابی پایگاه‌داده از فایل JSON"
              >
                <ArchiveRestore className="h-3.5 w-3.5 text-amber-600" />
                <span className="hidden sm:inline">بازیابی فایلی</span>
              </button>

              <button
                type="button"
                disabled={exportingPdf}
                onClick={() => void handleExportPdf()}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60"
              >
                {exportingPdf ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <FileText className="h-3.5 w-3.5" />
                )}
                <span>PDF</span>
              </button>

              <button
                type="button"
                onClick={handleExportExcel}
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                <span>اکسل</span>
              </button>

              <button
                type="button"
                onClick={() => setShareModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-700 transition hover:bg-sky-100"
              >
                <Share2 className="h-3.5 w-3.5" />
                <span className="hidden md:inline">اشتراک‌گذاری</span>
              </button>
            </div>
          </div>
        </header>

        {/* Shared Snapshot Banner if opened via #share=... */}
        {isSharedSnapshot && (
          <div className="bg-indigo-600 px-4 py-2.5 text-white">
            <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-bold">
                شما در حال مشاهده نسخه اشتراک‌گذاری‌شده داشبورد مدیریتی هستید.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handleReplaceDb(db, 'داده‌های گزارش اشتراکی در حافظه محلی شما ذخیره شد.')
                  }
                  className="rounded-lg bg-white px-3 py-1 font-extrabold text-indigo-700 hover:bg-indigo-50"
                >
                  ذخیره دائمی در سامانه من
                </button>
                <button
                  type="button"
                  onClick={() => {
                    clearShareUrlHash()
                    window.location.reload()
                  }}
                  className="rounded-lg border border-white/30 px-2.5 py-1 font-semibold text-white hover:bg-white/10"
                >
                  خروج از نمای اشتراکی
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Workspace Container */}
        <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6">
          {activeTab === 'dashboard' && (
            <DashboardView
              db={db}
              analytics={analytics}
              filters={filters}
              onFiltersChange={setFilters}
              onOpenNewMeeting={(wgId) => handleOpenNewMeeting(wgId)}
              onEditMeeting={handleOpenEditMeeting}
              onNavigateTab={setActiveTab}
              onExportPdf={() => void handleExportPdf()}
              onExportExcel={handleExportExcel}
              onOpenShare={() => setShareModalOpen(true)}
              dashboardCaptureRef={dashboardCaptureRef}
            />
          )}

          {activeTab === 'meetings' && (
            <MeetingsView
              db={db}
              analytics={analytics}
              filters={filters}
              onFiltersChange={setFilters}
              onOpenNewMeeting={handleOpenNewMeeting}
              onEditMeeting={handleOpenEditMeeting}
              onDeleteMeeting={handleDeleteMeeting}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsBreakdownView
              db={db}
              analytics={analytics}
              filters={filters}
              onFiltersChange={setFilters}
              onExportPdf={() => void handleExportPdf()}
              onExportExcel={handleExportExcel}
            />
          )}

          {activeTab === 'directory' && (
            <DirectoryManagementView db={db} onUpdateDb={handleUpdateDb} />
          )}

          {activeTab === 'files' && (
            <FileManagementView
              db={db}
              diskConnected={diskConnected}
              connectedFileHandle={connectedFileHandle}
              onConnectedFileHandleChange={setConnectedFileHandle}
              onReplaceDb={handleReplaceDb}
              onExportPdf={() => void handleExportPdf()}
              onExportExcel={handleExportExcel}
            />
          )}
        </main>
      </div>

      {/* Add / Edit Meeting Modal */}
      <MeetingModal
        open={meetingModalOpen}
        db={db}
        editingMeeting={editingMeeting}
        defaultWorkingGroupId={presetWgId}
        defaultJalaliDate={presetJalaliDate}
        onClose={() => setMeetingModalOpen(false)}
        onSave={handleSaveMeeting}
      />

      {/* Share Executive Dashboard Modal */}
      <ShareModal
        open={shareModalOpen}
        db={db}
        analytics={analytics}
        filters={filters}
        onClose={() => setShareModalOpen(false)}
        onDownloadPngSnapshot={handleDownloadPngSnapshot}
      />

      {/* Off-screen Paginated A4 Persian PDF Report */}
      <PrintablePdfReport
        db={db}
        analytics={analytics}
        filters={filters}
        containerRef={pdfReportContainerRef}
      />

      {/* Floating Toast Feedback */}
      {toast && (
        <div className="fixed bottom-5 left-5 z-50 flex max-w-md items-center gap-2.5 rounded-2xl border px-4 py-3 text-xs font-extrabold shadow-xl transition-all bg-slate-900 border-slate-700 text-white">
          <CheckCircle2
            className={`h-4 w-4 shrink-0 ${
              toast.type === 'error' ? 'text-rose-400' : 'text-emerald-400'
            }`}
          />
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  )
}

export default App
