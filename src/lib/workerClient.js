// The only way this app talks to the server, and deliberately the smallest
// possible surface onto it.
//
// The dashboard's client knows every route on this Worker — /upload,
// /replace, /archive-job, the override blobs. None of that is copied here.
// This app runs on eighteen personal phones from a public bundle, so it can
// build exactly three kinds of key and reach exactly one endpoint. That is
// not enforcement — the Worker is open to anyone with the address either way
// — but it means there is no code path from a phone to the workbook, and
// it's a much smaller thing to review.
// Build-time switch, because the same source builds two sites:
//
//   GitHub Pages (kwanfelix.me) — no VITE_API_BASE, so this stays the public
//     upload Worker and that copy behaves exactly as it always has.
//   Cloudflare (cd-field)       — built with VITE_API_BASE=/api, so calls go
//     to the same origin, where site-worker/index.js answers them against KV
//     directly and accepts writes to field:<job> and nothing else.
//
// Defaulting to the old URL is deliberate: a build that forgets the variable
// degrades to the current behaviour rather than to an app that cannot reach
// its data at all.
const WORKER = import.meta.env.VITE_API_BASE ?? 'https://cde-data-upload.fkw24.workers.dev'

// Same path on both: the old Worker serves it at the root of its own origin,
// the new one under /api, and the base carries that difference.
const DATA_PATH = '/app-data'

// Mirrors the Worker's own allowlist. Checked here too so a typo fails as an
// obvious error in development rather than a 400 nobody reads.
const ALLOWED = /^field:[A-Za-z0-9]{1,20}$|^fieldTasks:(commercial|residential)$|^planning:staff-roster$/

export async function readKey(key) {
  if (!ALLOWED.test(key)) throw new Error(`Refusing to read an unexpected key: ${key}`)
  const res = await fetch(`${WORKER}${DATA_PATH}?key=${encodeURIComponent(key)}`, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Read failed (${res.status})`)
  const { value } = await res.json()
  if (!value) return null
  // Values are stored double-encoded: the KV value is a JSON string
  // containing JSON. A parse failure means someone wrote something odd, not
  // that the key is empty, so it throws rather than returning null.
  return JSON.parse(value)
}

export async function writeKey(key, value) {
  if (!ALLOWED.test(key)) throw new Error(`Refusing to write an unexpected key: ${key}`)
  const res = await fetch(`${WORKER}${DATA_PATH}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, value: JSON.stringify(value) }),
  })
  if (!res.ok) throw new Error(`Write failed (${res.status})`)
  return true
}
