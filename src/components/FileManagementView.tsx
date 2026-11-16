import {
  AlertTriangle,
  ArchiveRestore,
  CheckCircle2,
  Database,
  Download,
  FileJson,
  FileSpreadsheet,
  FileText,
  FolderSync,
  HardDriveDownload,
  RefreshCw,
  Save,
  Trash2,
  Upload,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { createBlankDatabase, createInitialSeedDatabase } from '../data/seedData'
import type { AppDatabase } from '../types/domain'
import {
  type LocalFileHandle,
  type ServerBackupFileMeta,
  createServerNamedBackup,
  deleteServerBackup,
  downloadDatabaseJsonFile,
  listServerBackups,
  mergeDatabases,
  parseUploadedJsonFile,
  restoreFromServerBackup,
  saveWithNativeFilePicker,
} from '../utils/fileStorage'
import { toPersianDigits } from '../utils/jalali'

interface FileManagementViewProps {
  db: AppDatabase
  diskConnected: boolean
  connectedFileHandle: LocalFileHandle | null
  onConnectedFileHandleChange: (h: LocalFileHandle | null) => void
  onReplaceDb: (next: AppDatabase, toastMsg: string) => void
  onExportPdf: () => void
  onExportExcel: () => void
}

export function FileManagementView({
  db,
  diskConnected,
  connectedFileHandle,
  onConnectedFileHandleChange,
  onReplaceDb,
  onExportPdf,
  onExportExcel,
}: FileManagementViewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)
  const [previewDb, setPreviewDb] = useState<AppDatabase | null>(null)
  const [previewFileName, setPreviewFileName] = useState('')
  const [importError, setImportError] = useState('')

  const [serverBackups, setServerBackups] = useState<ServerBackupFileMeta[]>([])
  const [backupLabel, setBackupLabel] = useState('')
  const [loadingBackups, setLoadingBackups] = useState(false)
  const [confirmResetMode, setConfirmResetMode] = useState<'none' | 'meetings' | 'all' | 'seed'>(
    'none'
  )

  const refreshServerBackups = async () => {
    if (!diskConnected) return
    setLoadingBackups(true)
    const files = await listServerBackups()
    setServerBackups(files)
    setLoadingBackups(false)
  }

  useEffect(() => {
    void refreshServerBackups()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diskConnected])

  const handleSelectedFile = async (file: File) => {
    setImportError('')
    try {
      const parsed = await parseUploadedJsonFile(file)
      setPreviewDb(parsed)
      setPreviewFileName(file.name)
    } catch (err) {
      setPreviewDb(null)
      setImportError(err instanceof Error ? err.message : 'خطا در خواندن فایل پشتیبان')
    }
  }

  const handleApplyPreview = (mode: 'replace' | 'merge') => {
    if (!previewDb) return
    if (mode === 'replace') {
      onReplaceDb(previewDb, `اطلاعات از فایل «${previewFileName}» با موفقیت بازیابی و جایگزین شد.`)
    } else {
      const merged = mergeDatabases(db, previewDb)
      onReplaceDb(merged, `اطلاعات فایل «${previewFileName}» با موفقیت با داده‌های فعلی ادغام شد.`)
    }
    setPreviewDb(null)
    setPreviewFileName('')
  }

  const handleDirectSavePicker = async () => {
    const res = await saveWithNativeFilePicker(db, connectedFileHandle)
    if (res.saved) {
      if (res.handle) {
        onConnectedFileHandleChange(res.handle)
      }
    }
  }

  const handleCreateServerSnapshot = async () => {
    const res = await createServerNamedBackup(
      db,
      backupLabel.trim() || `نسخه پشتیبان (${db.meetings.length} جلسه)`
    )
    if (res.ok) {
      setBackupLabel('')
      await refreshServerBackups()
    }
  }

  const handleRestoreServerFile = async (fileName: string) => {
    try {
      const restored = await restoreFromServerBackup(fileName)
      onReplaceDb(restored, `نسخه پشتیبان محلی «${fileName}» بازیابی گردید.`)
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'خطا در بازیابی فایل سرور محلی')
    }
  }

  return (
    <div className="space-y-5">
      {/* Status Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-emerald-200 bg-gradient-to-l from-emerald-50 via-white to-slate-50 p-5 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm">
            <Database className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900">
              مرکز ذخیره فایلی، بازیابی فایلی و صدور خروجی‌های رسمی
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">
              تمامی اطلاعات سامانه به‌صورت ۱۰۰٪ لوکال ذخیره می‌شود. می‌توانید در هر لحظه کل پایگاه‌داده را در قالب فایل استاندارد{' '}
              <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-emerald-800">
                .json
              </code>{' '}
              روی رایانه یا فلش‌مموری ذخیره کرده و در هر زمان یا سیستم دیگری عیناً بازیابی نمایید.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-100/80 px-3 py-1 font-bold text-emerald-800">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {diskConnected
              ? 'ذخیره خودکار دیسک محلی (data/local-db.json) فعال است'
              : 'ذخیره خودکار مرورگر فعال است'}
          </span>
          {connectedFileHandle && (
            <span className="text-[11px] font-semibold text-indigo-700">
              فایل متصل سیستم: {connectedFileHandle.name}
            </span>
          )}
        </div>
      </div>

      {/* Primary Two Columns: Save to File & Restore from File */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Card 1: Save to File (ذخیره فایلی) */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <HardDriveDownload className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  ۱. ذخیره فایلی اطلاعات (پشتیبان‌گیری کامل)
                </h3>
                <p className="text-xs text-slate-500">
                  شامل کارگروه‌ها، اعضای هیئت امنا، نمایندگان و ریز تمام جلسات
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2.5 rounded-2xl bg-slate-50 p-3.5 text-center text-xs tabular-fa">
              <div>
                <span className="block text-[11px] text-slate-400">اعضای هیئت امنا</span>
                <span className="mt-0.5 block text-base font-black text-slate-900">
                  {toPersianDigits(db.boardMembers.length)}
                </span>
              </div>
              <div className="border-x border-slate-200">
                <span className="block text-[11px] text-slate-400">نمایندگان کارگروه‌ها</span>
                <span className="mt-0.5 block text-base font-black text-slate-900">
                  {toPersianDigits(db.representatives.length)}
                </span>
              </div>
              <div>
                <span className="block text-[11px] text-slate-400">جلسات ثبت‌شده</span>
                <span className="mt-0.5 block text-base font-black text-emerald-700">
                  {toPersianDigits(db.meetings.length)}
                </span>
              </div>
            </div>

            <div className="mt-4 space-y-2.5">
              <button
                type="button"
                onClick={() => downloadDatabaseJsonFile(db)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-xs font-extrabold text-white shadow-sm shadow-emerald-600/20 transition hover:bg-emerald-700"
              >
                <Download className="h-4 w-4" />
                دانلود و ذخیره فایل پشتیبان (.json) روی سیستم
              </button>

              <button
                type="button"
                onClick={handleDirectSavePicker}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-xs font-bold text-indigo-700 transition hover:bg-indigo-100"
              >
                <FolderSync className="h-4 w-4" />
                {connectedFileHandle
                  ? `ذخیره آنی در فایل متصل (${connectedFileHandle.name})`
                  : 'انتخاب مسیر دلخواه و ذخیره فایلی مستقیم'}
              </button>
            </div>
          </div>

          <div className="mt-5 border-t border-slate-100 pt-4">
            <span className="mb-2 block text-xs font-bold text-slate-600">
              خروجی‌های رسمی مدیریتی و چاپی:
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={onExportPdf}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-100"
              >
                <FileText className="h-4 w-4" />
                صدور گزارش PDF
              </button>
              <button
                type="button"
                onClick={onExportExcel}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100"
              >
                <FileSpreadsheet className="h-4 w-4" />
                صدور فایل اکسل (.xlsx)
              </button>
            </div>
          </div>
        </div>

        {/* Card 2: Restore from File (بازیابی فایلی) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <ArchiveRestore className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">
                ۲. بازیابی فایلی اطلاعات (بارگذاری فایل پشتیبان)
              </h3>
              <p className="text-xs text-slate-500">
                فایل JSON ذخیره‌شده قبلی را بکشید و رها کنید یا از روی سیستم انتخاب نمایید
              </p>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void handleSelectedFile(f)
              e.target.value = ''
            }}
            className="hidden"
          />

          <div
            onDragOver={(e) => {
              e.preventDefault()
              setDragActive(true)
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragActive(false)
              const f = e.dataTransfer.files?.[0]
              if (f) void handleSelectedFile(f)
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`mt-4 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-7 text-center transition ${
              dragActive
                ? 'border-emerald-500 bg-emerald-50'
                : 'border-slate-300 bg-slate-50/70 hover:border-emerald-400 hover:bg-emerald-50/30'
            }`}
          >
            <Upload className="h-8 w-8 text-emerald-600" />
            <p className="mt-2.5 text-xs font-extrabold text-slate-800">
              برای انتخاب فایل پشتیبان (.json) کلیک کنید یا فایل را اینجا رها کنید
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              پشتیبانی از جایگزینی کامل یا ادغام هوشمند بدون حذف اطلاعات فعلی
            </p>
          </div>

          {importError && (
            <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-700">
              {importError}
            </div>
          )}

          {previewDb && (
            <div className="mt-4 rounded-2xl border-2 border-emerald-300 bg-emerald-50/60 p-4">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-900">
                  <FileJson className="h-4 w-4 text-emerald-600" />
                  پیش‌نمایش فایل آماده بازیابی: {previewFileName}
                </span>
                <button
                  type="button"
                  onClick={() => setPreviewDb(null)}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800"
                >
                  انصراف
                </button>
              </div>
              <p className="mt-2 text-xs text-slate-700 tabular-fa">
                محتوای فایل: <strong>{toPersianDigits(previewDb.meetings.length)}</strong> جلسه،{' '}
                <strong>{toPersianDigits(previewDb.representatives.length)}</strong> نماینده و{' '}
                <strong>{toPersianDigits(previewDb.boardMembers.length)}</strong> عضو هیئت امنا
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleApplyPreview('replace')}
                  className="flex-1 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-extrabold text-white hover:bg-emerald-700"
                >
                  جایگزینی کامل اطلاعات با این فایل
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreview('merge')}
                  className="flex-1 rounded-xl border border-emerald-600 bg-white px-3.5 py-2 text-xs font-extrabold text-emerald-700 hover:bg-emerald-50"
                >
                  ادغام با اطلاعات فعلی
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Server Local Disk Snapshots (backups/*.json) */}
      {diskConnected && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-black text-slate-900">
                آرشیو فایل‌های پشتیبان روی دیسک محلی پروژه (پوشه backups/)
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                ایجاد نقطه بازیابی نام‌گذاری‌شده مستقیماً روی پوشه محلی سرور و بازیابی تک‌کلیکی
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={backupLabel}
                onChange={(e) => setBackupLabel(e.target.value)}
                placeholder="عنوان نسخه پشتیبان (مثلاً پایان آبان ۱۴۰۵)..."
                className="w-64 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCreateServerSnapshot}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-slate-800"
              >
                <Save className="h-3.5 w-3.5" />
                ذخیره نسخه در پوشه محلی
              </button>
              <button
                type="button"
                onClick={refreshServerBackups}
                className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-100"
                title="بازخوانی فهرست فایل‌ها"
              >
                <RefreshCw className={`h-4 w-4 ${loadingBackups ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {serverBackups.length > 0 ? (
            <div className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-100">
              {serverBackups.map((item) => (
                <div
                  key={item.fileName}
                  className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-xs hover:bg-slate-50"
                >
                  <div>
                    <span className="font-bold text-slate-900">
                      {item.label || item.fileName}
                    </span>
                    <span className="mr-2 font-mono text-[11px] text-slate-400">
                      ({item.fileName})
                    </span>
                    <div className="mt-0.5 text-[11px] text-slate-500 tabular-fa">
                      {toPersianDigits(item.meetings)} جلسه •{' '}
                      {toPersianDigits(item.representatives)} نماینده •{' '}
                      {toPersianDigits(item.boardMembers)} عضو هیئت امنا
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void handleRestoreServerFile(item.fileName)}
                      className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 font-bold text-emerald-700 hover:bg-emerald-100"
                    >
                      بازیابی این فایل
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await deleteServerBackup(item.fileName)
                        await refreshServerBackups()
                      }}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                      title="حذف فایل پشتیبان"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-xs text-slate-400">
              هنوز فایل آرشیوی در پوشه backups/ ایجاد نشده است (فایل اصلی data/local-db.json به‌صورت خودکار به‌روز است).
            </p>
          )}
        </div>
      )}

      {/* Data Reset / Sample Data Management */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <div>
              <h3 className="text-sm font-black text-slate-900">
                مدیریت داده‌های نمونه و پاکسازی جهت شروع ثبت واقعی
              </h3>
              <p className="text-xs text-slate-500">
                می‌توانید جلسات نمونه را پاک کنید و ثبت جلسات واقعی سازمان خود را آغاز نمایید.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setConfirmResetMode('meetings')}
              className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2 text-xs font-bold text-amber-800 hover:bg-amber-100"
            >
              پاک کردن جلسات (حفظ اسامی و کارگروه‌ها)
            </button>
            <button
              type="button"
              onClick={() => setConfirmResetMode('all')}
              className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100"
            >
              شروع کاملاً خام (فقط ۴ کارگروه)
            </button>
            <button
              type="button"
              onClick={() => setConfirmResetMode('seed')}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
            >
              بازگردانی داده‌های نمونه اولیه
            </button>
          </div>
        </div>

        {confirmResetMode !== 'none' && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 p-3.5 text-xs">
            <span className="font-bold text-amber-900">
              {confirmResetMode === 'meetings' &&
                'آیا از حذف تمام جلسات فعلی اطمینان دارید؟ (اسامی اعضا و کارگروه‌ها حفظ می‌شوند)'}
              {confirmResetMode === 'all' &&
                'آیا از پاکسازی کامل جلسات، نمایندگان و اعضای هیئت امنا اطمینان دارید؟'}
              {confirmResetMode === 'seed' &&
                'آیا مایل به بارگذاری مجدد داده‌های نمونه اولیه هستید؟'}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (confirmResetMode === 'meetings') {
                    onReplaceDb(
                      createBlankDatabase(true, db),
                      'تمام جلسات پاک شدند؛ سامانه آماده ثبت جلسات جدید شماست.'
                    )
                  } else if (confirmResetMode === 'all') {
                    onReplaceDb(
                      createBlankDatabase(false, db),
                      'پایگاه‌داده خام با ۴ کارگروه تخصصی آماده شد.'
                    )
                  } else if (confirmResetMode === 'seed') {
                    onReplaceDb(createInitialSeedDatabase(), 'داده‌های نمونه اولیه بارگذاری شدند.')
                  }
                  setConfirmResetMode('none')
                }}
                className="rounded-lg bg-slate-900 px-3.5 py-1.5 font-extrabold text-white"
              >
                بله، انجام شود
              </button>
              <button
                type="button"
                onClick={() => setConfirmResetMode('none')}
                className="rounded-lg bg-white px-3 py-1.5 font-bold text-slate-700"
              >
                انصراف
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
