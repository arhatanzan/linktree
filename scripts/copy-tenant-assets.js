import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const tenantId = (process.env.VITE_TENANT_ID || 'arhatest').trim().toLowerCase()
const tenantDirectory = path.join(rootDirectory, 'config', tenantId)
const targetDirectory = path.join(rootDirectory, 'public', 'images')
const imagePattern = /\.(png|jpe?g|gif|webp|svg)$/i
const netlifyUrl = process.env.URL

if (netlifyUrl) {
  const hostname = new URL(netlifyUrl).hostname.toLowerCase()
  const netlifySuffix = '.netlify.app'

  if (hostname.endsWith(netlifySuffix)) {
    const siteName = hostname.slice(0, -netlifySuffix.length)

    if (siteName !== tenantId) {
      throw new Error(
        `Tenant mismatch: VITE_TENANT_ID=${tenantId} requires the Netlify site ${tenantId}.netlify.app, but Netlify reported ${hostname}.`,
      )
    }
  }
}

if (!fs.existsSync(tenantDirectory)) {
  throw new Error(`Unknown tenant: ${tenantId}`)
}

fs.rmSync(targetDirectory, { recursive: true, force: true })
fs.mkdirSync(targetDirectory, { recursive: true })

for (const filename of fs.readdirSync(tenantDirectory)) {
  if (imagePattern.test(filename)) {
    fs.copyFileSync(path.join(tenantDirectory, filename), path.join(targetDirectory, filename))
  }
}