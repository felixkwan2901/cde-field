// The field app, served from Cloudflare.
//
// Two jobs: hand out the built app, and answer /api/app-data against the same
// KV namespace the dashboard uses, so a percentage tapped on a phone is the
// same record the office sees.
//
// There is deliberately NO login here, and that is not an oversight. This app
// runs on eighteen personal phones belonging to electricians who have no
// accounts, and it is used one-handed in a ceiling space. Putting a password
// in front of that would stop it being used at all. What the app records is
// how far a job has got and who moved it — worth keeping off the open web, but
// not worth a password prompt on a ladder.
//
// So the protection here is surface, not authentication:
//
//   - reads are limited to the three key shapes this app actually uses
//   - WRITES ARE LIMITED TO field:<job> AND NOTHING ELSE
//
// That second line is the point of moving off the old upload Worker. That one
// is open to anyone with the address and accepts writes to every key the
// dashboard uses, including the override blobs and the planning records. From
// here, the worst a stranger with the URL can do is change a percentage on a
// job. They cannot touch the workbook, the claim calculator or the roster,
// because there is no code path from this Worker to any of them.
//
// Bindings: ASSETS (the built app), APP_DATA (KV).

// Reads. Mirrors the allowlist in src/lib/workerClient.js.
const READABLE = /^field:[A-Za-z0-9]{1,20}$|^fieldTasks:(commercial|residential)$|^planning:(staff-roster|field-jobs)$/

// Writes. Narrower on purpose: the app only ever writes progress records, and
// the roster and task templates are the dashboard's to own. A bug here that
// widened reads would be a nuisance; one that widened writes would let a phone
// overwrite the office's planning data.
const WRITABLE = /^field:[A-Za-z0-9]{1,20}$/

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  })

async function handleAppData(request, env) {
  const url = new URL(request.url)

  if (request.method === 'GET') {
    const key = url.searchParams.get('key') ?? ''
    if (!READABLE.test(key)) return json({ ok: false, error: 'bad_key' }, 400)
    const value = await env.APP_DATA.get(key)
    return json({ ok: true, value })
  }

  if (request.method === 'POST') {
    const body = await request.json().catch(() => null)
    if (!body) return json({ ok: false, error: 'bad_request' }, 400)
    const { key, value } = body
    if (!WRITABLE.test(key ?? '')) return json({ ok: false, error: 'bad_key' }, 400)
    // A progress record is a few hundred bytes. The cap is here so a bug or a
    // bored stranger cannot fill the namespace one write at a time.
    if (typeof value !== 'string' || value.length > 100_000) {
      return json({ ok: false, error: 'bad_value' }, 400)
    }
    await env.APP_DATA.put(key, value)
    return json({ ok: true })
  }

  return json({ ok: false, error: 'method_not_allowed' }, 405)
}

export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname

    if (path === '/api/app-data') return handleAppData(request, env)
    if (path.startsWith('/api/')) return json({ ok: false, error: 'not_found' }, 404)

    return env.ASSETS.fetch(request)
  },
}
