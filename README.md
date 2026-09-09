# CDE Field

On-site task progress for Cassidy-Davies electricians. A phone web app
(installable PWA) where the crew pick their name, see their jobs, and set a
percentage against each install task. Those percentages write through to the
same Cloudflare KV store the operations dashboard reads, so the office sees
field progress on the job page.

Sibling of [excel-dashboard](https://github.com/felixkwan2901/excel-dashboard)
— same stack, same design tokens, same Worker.

Live at https://www.kwanfelix.me/cde-field/

## This is a prototype

Only the progress write-through is real. The job list, the site details and
the sign-in are fixtures, and the camera is faked — "Add photo" inserts a
bundled sample image.

**It has no authentication.** Picking a name is attribution, not a login:
anyone with the URL can post progress as anyone, and the Worker behind it is
open to anyone who has its address. That is true of the dashboard today too.
Do not treat the name against a percentage as evidence of who did what, and
keep client details out of the note field. Fixing this properly means
Cloudflare Access in front of the Worker — free up to 50 users — not a
password box on this app.

## Running it

    npm install
    npm run dev

    npm run build         # for GitHub Pages, at /cde-field/
    APP_BASE=/ npm run build   # for a domain of its own, or a local static server
    npm test              # the progress maths

## How it stores things

Everything goes through `POST/GET https://cde-data-upload.fkw24.workers.dev/app-data`,
which is a plain KV read/write — no GitHub round trip, so a tick lands in
about a second.

| Key | Holds |
|---|---|
| `field:<jobNumber>` | one record per job: a percentage per task, with who set it and when |
| `fieldTasks:commercial` / `fieldTasks:residential` | the task catalogues — labels live here, not in the app |
| `planning:staff-roster` | read-only here; the crew list the name picker shows |

One record per job, not per job per worker: percent-complete of a physical
task is a property of the building, not of who is looking at it. Attribution
lives inside the record, per task.

Task ids are immutable slugs (`rough-in-power`). Rewording a label is fine;
changing or recycling an id silently re-points every percentage already
recorded against it. Removing a task means `archived: true`, not deletion, so
historical records still have something to show.

## Conventions worth knowing before editing

- **Light theme by default, and it does not follow the OS.** A dark UI in
  direct sun is unreadable. Dark is available as an explicit choice for
  ceiling spaces and night work.
- **Minimum 56px tap targets, list rows 72–96px.** 44pt assumes a bare
  fingertip; a glove spreads the contact patch and shifts its centre.
- **No drag gestures, no hover, no `title=` tooltips.** On touch a `title` is
  invisible, so every icon carries a visible label or is decorative.
- **`src/lib/dataSource.js` is the only file that may import from
  `src/mocks/`.** No `if (USE_MOCKS)` branches in components — that is how a
  prototype becomes unshippable. Swapping to real data is four function
  bodies.
- Fixtures live in `src/mocks/`, not `public/`: in `public/` they 404 the
  first time `APP_BASE` changes, and the offline story would need the network
  to show mocked data.

## Known limits

- iOS Safari has no Background Sync, so the offline queue flushes while the
  app is open, not in the background. The honest instruction to the crew is
  "open it for a few seconds when you get signal".
- iOS can evict storage in an installed PWA after about a week of non-use,
  which would silently empty a queue holding unsent progress.
- localStorage and IndexedDB are shared with the dashboard, since both are
  served from the same origin. Keys here are prefixed to avoid collisions.
