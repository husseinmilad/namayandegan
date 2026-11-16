import { Check, Copy, ImageDown, Link2, MessageSquareShare, Share2, X } from 'lucide-react'
import { useState } from 'react'
import type { AppDatabase, DashboardFilters } from '../types/domain'
import type { AnalyticsResult } from '../utils/analytics'
import { buildExecutiveShareText } from '../utils/exporters'
import { encodeDatabaseShareLink } from '../utils/fileStorage'

interface ShareModalProps {
  open: boolean
  db: AppDatabase
  analytics: AnalyticsResult
  filters: DashboardFilters
  onClose: () => void
  onDownloadPngSnapshot: () => Promise<void>
}

export function ShareModal({
  open,
  db,
  analytics,
  filters,
  onClose,
  onDownloadPngSnapshot,
}: ShareModalProps) {
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedText, setCopiedText] = useState(false)
  const [downloadingImg, setDownloadingImg] = useState(false)

  if (!open) return null

  const shareLink = encodeDatabaseShareLink(db)
  const shareText = buildExecutiveShareText(db, analytics, filters)

  const copyToClipboard = async (text: string, type: 'link' | 'text') => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    if (type === 'link') {
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2500)
    } else {
      setCopiedText(true)
      setTimeout(() => setCopiedText(false), 2500)
    }
  }

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: db.organizationTitle,
          text: shareText,
          url: shareLink,
        })
      } catch {
        // user cancelled share dialog
      }
    } else {
      await copyToClipboard(shareText, 'text')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4 backdrop-blur-xs">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
              <Share2 className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">
                اشتراک‌گذاری داشبورد و گزارش مدیریتی هیئت امنا
              </h2>
              <p className="text-xs text-slate-500">
                ارسال لینک تعاملی داشبورد، متن خلاصه مدیریتی یا تصویر گرافیکی گزارش
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-200/70 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-6">
          {/* Option 1: Smart Shareable Snapshot Link */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex items-center gap-2 text-xs font-extrabold text-slate-800">
              <Link2 className="h-4 w-4 text-indigo-600" />
              <span>۱. لینک هوشمند اشتراک‌گذاری مستقیم داشبورد (بدون نیاز به سرور)</span>
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
              این لینک حاوی تصویر فشرده‌شده داده‌های گزارش است؛ گیرنده با باز کردن آن، کل داشبورد و جداول را مشاهده می‌کند.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <input
                dir="ltr"
                readOnly
                value={shareLink}
                className="flex-1 truncate rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-600 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => void copyToClipboard(shareLink, 'link')}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-extrabold text-white transition hover:bg-indigo-700"
              >
                {copiedLink ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copiedLink ? 'کپی شد!' : 'کپی لینک'}
              </button>
            </div>
          </div>

          {/* Option 2: Executive Text Report for Messengers / Email */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-extrabold text-slate-800">
                <MessageSquareShare className="h-4 w-4 text-emerald-600" />
                <span>۲. متن رسمی گزارش مدیریتی (مناسب ایتا، بله، واتساپ، تلگرام و ایمیل)</span>
              </div>
              <button
                type="button"
                onClick={() => void copyToClipboard(shareText, 'text')}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-extrabold text-white transition hover:bg-emerald-700"
              >
                {copiedText ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedText ? 'متن گزارش کپی شد!' : 'کپی متن گزارش'}
              </button>
            </div>
            <textarea
              readOnly
              rows={8}
              value={shareText}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-6 text-slate-700 focus:outline-none"
            />
          </div>

          {/* Option 3: High-Res Infographic Image + System Share */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              disabled={downloadingImg}
              onClick={async () => {
                setDownloadingImg(true)
                try {
                  await onDownloadPngSnapshot()
                } finally {
                  setDownloadingImg(false)
                }
              }}
              className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-900 px-4 py-3 text-xs font-extrabold text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
              <ImageDown className="h-4 w-4 text-emerald-400" />
              {downloadingImg ? 'در حال تولید تصویر...' : 'دانلود تصویر گرافیکی داشبورد (PNG)'}
            </button>

            <button
              type="button"
              onClick={() => void handleNativeShare()}
              className="flex items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-xs font-extrabold text-sky-800 transition hover:bg-sky-100"
            >
              <Share2 className="h-4 w-4" />
              ارسال مستقیم با منوی اشتراک سیستم
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
