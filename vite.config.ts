import fs from 'node:fs'
import path from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import type { Plugin } from 'vite'

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')))
    req.on('error', reject)
  })
}

function sendJson(res: ServerResponse, status: number, payload: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(payload))
}

function localFileStoragePlugin(): Plugin {
  const rootDir = process.cwd()
  const dataDir = path.join(rootDir, 'data')
  const backupsDir = path.join(rootDir, 'backups')
  const dbFilePath = path.join(dataDir, 'local-db.json')

  const ensureDirs = () => {
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
    if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true })
  }

  const handler = async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const url = req.url || ''
    if (!url.startsWith('/api/')) {
      next()
      return
    }

    try {
      ensureDirs()

      if (url === '/api/db' && req.method === 'GET') {
        if (!fs.existsSync(dbFilePath)) {
          sendJson(res, 200, { exists: false, path: 'data/local-db.json' })
          return
        }
        const raw = fs.readFileSync(dbFilePath, 'utf-8')
        const stat = fs.statSync(dbFilePath)
        sendJson(res, 200, {
          exists: true,
          path: 'data/local-db.json',
          updatedAt: stat.mtime.toISOString(),
          sizeBytes: stat.size,
          data: JSON.parse(raw),
        })
        return
      }

      if (url === '/api/db' && req.method === 'POST') {
        const body = await readBody(req)
        const parsed = JSON.parse(body)
        fs.writeFileSync(dbFilePath, JSON.stringify(parsed, null, 2), 'utf-8')
        const stat = fs.statSync(dbFilePath)
        sendJson(res, 200, {
          ok: true,
          path: 'data/local-db.json',
          updatedAt: stat.mtime.toISOString(),
          sizeBytes: stat.size,
        })
        return
      }

      if (url === '/api/backups' && req.method === 'GET') {
        const files = fs
          .readdirSync(backupsDir)
          .filter((f) => f.endsWith('.json'))
          .map((fileName) => {
            const full = path.join(backupsDir, fileName)
            const stat = fs.statSync(full)
            let summary = { meetings: 0, representatives: 0, boardMembers: 0, label: '' }
            try {
              const json = JSON.parse(fs.readFileSync(full, 'utf-8'))
              summary = {
                meetings: Array.isArray(json.meetings) ? json.meetings.length : 0,
                representatives: Array.isArray(json.representatives) ? json.representatives.length : 0,
                boardMembers: Array.isArray(json.boardMembers) ? json.boardMembers.length : 0,
                label: typeof json.backupLabel === 'string' ? json.backupLabel : '',
              }
            } catch {
              // ignore malformed file summary
            }
            return {
              fileName,
              sizeBytes: stat.size,
              createdAt: stat.mtime.toISOString(),
              ...summary,
            }
          })
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

        sendJson(res, 200, { files })
        return
      }

      if (url === '/api/backups' && req.method === 'POST') {
        const body = await readBody(req)
        const parsed = JSON.parse(body)
        const safeTag = String(parsed.fileTag || 'snapshot')
          .replace(/[^a-zA-Z0-9\u0600-\u06FF_-]/g, '-')
          .slice(0, 48)
        const stamp = new Date().toISOString().replace(/[:.]/g, '-')
        const fileName = `namayandegan-${safeTag}-${stamp}.json`
        const payload = {
          ...parsed.data,
          backupLabel: parsed.label || safeTag,
          exportedAt: new Date().toISOString(),
        }
        fs.writeFileSync(path.join(backupsDir, fileName), JSON.stringify(payload, null, 2), 'utf-8')
        sendJson(res, 200, { ok: true, fileName })
        return
      }

      if (url.startsWith('/api/backups/') && req.method === 'GET') {
        const rawName = decodeURIComponent(url.slice('/api/backups/'.length))
        const safeName = path.basename(rawName)
        const target = path.join(backupsDir, safeName)
        if (!fs.existsSync(target)) {
          sendJson(res, 404, { error: 'فایل پشتیبان یافت نشد.' })
          return
        }
        const data = JSON.parse(fs.readFileSync(target, 'utf-8'))
        sendJson(res, 200, { fileName: safeName, data })
        return
      }

      if (url.startsWith('/api/backups/') && req.method === 'DELETE') {
        const rawName = decodeURIComponent(url.slice('/api/backups/'.length))
        const safeName = path.basename(rawName)
        const target = path.join(backupsDir, safeName)
        if (fs.existsSync(target)) {
          fs.unlinkSync(target)
        }
        sendJson(res, 200, { ok: true })
        return
      }

      sendJson(res, 404, { error: 'مسیر API یافت نشد.' })
    } catch (err) {
      sendJson(res, 500, {
        error: err instanceof Error ? err.message : 'خطای سرور محلی در پردازش فایل',
      })
    }
  }

  return {
    name: 'local-file-storage-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        void handler(req, res, next)
      })
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        void handler(req, res, next)
      })
    },
  }
}

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), localFileStoragePlugin()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    allowedHosts: true,
  },
})
