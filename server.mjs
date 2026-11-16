import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distDir = path.join(__dirname, 'dist')
const dataDir = path.join(__dirname, 'data')
const backupsDir = path.join(__dirname, 'backups')
const dbFilePath = path.join(dataDir, 'local-db.json')
const PORT = Number(process.env.PORT || 4173)

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true })

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (c) => chunks.push(c))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')))
    req.on('error', reject)
  })
}

function sendJson(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(payload))
}

const server = http.createServer(async (req, res) => {
  const url = (req.url || '/').split('?')[0]

  if (url.startsWith('/api/')) {
    try {
      if (url === '/api/db' && req.method === 'GET') {
        if (!fs.existsSync(dbFilePath)) {
          return sendJson(res, 200, { exists: false, path: 'data/local-db.json' })
        }
        const stat = fs.statSync(dbFilePath)
        const data = JSON.parse(fs.readFileSync(dbFilePath, 'utf-8'))
        return sendJson(res, 200, {
          exists: true,
          path: 'data/local-db.json',
          updatedAt: stat.mtime.toISOString(),
          sizeBytes: stat.size,
          data,
        })
      }

      if (url === '/api/db' && req.method === 'POST') {
        const body = JSON.parse(await readBody(req))
        fs.writeFileSync(dbFilePath, JSON.stringify(body, null, 2), 'utf-8')
        const stat = fs.statSync(dbFilePath)
        return sendJson(res, 200, {
          ok: true,
          path: 'data/local-db.json',
          updatedAt: stat.mtime.toISOString(),
          sizeBytes: stat.size,
        })
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
            } catch {}
            return { fileName, sizeBytes: stat.size, createdAt: stat.mtime.toISOString(), ...summary }
          })
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        return sendJson(res, 200, { files })
      }

      if (url === '/api/backups' && req.method === 'POST') {
        const parsed = JSON.parse(await readBody(req))
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
        return sendJson(res, 200, { ok: true, fileName })
      }

      if (url.startsWith('/api/backups/') && req.method === 'GET') {
        const safeName = path.basename(decodeURIComponent(url.slice('/api/backups/'.length)))
        const target = path.join(backupsDir, safeName)
        if (!fs.existsSync(target)) return sendJson(res, 404, { error: 'فایل یافت نشد.' })
        return sendJson(res, 200, { fileName: safeName, data: JSON.parse(fs.readFileSync(target, 'utf-8')) })
      }

      if (url.startsWith('/api/backups/') && req.method === 'DELETE') {
        const safeName = path.basename(decodeURIComponent(url.slice('/api/backups/'.length)))
        const target = path.join(backupsDir, safeName)
        if (fs.existsSync(target)) fs.unlinkSync(target)
        return sendJson(res, 200, { ok: true })
      }

      return sendJson(res, 404, { error: 'Not found' })
    } catch (e) {
      return sendJson(res, 500, { error: e instanceof Error ? e.message : 'Server error' })
    }
  }

  let filePath = path.join(distDir, url === '/' ? 'index.html' : url)
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(distDir, 'index.html')
  }
  if (!fs.existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
    return res.end('ابتدا دستور npm run build را اجرا کنید.')
  }
  const ext = path.extname(filePath)
  res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' })
  fs.createReadStream(filePath).pipe(res)
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Namayandegan Local App running on http://0.0.0.0:${PORT}`)
})
