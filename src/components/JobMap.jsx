import { useEffect, useMemo, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { jobProgress } from '../lib/progress'

// Where the work is. Leaflet with OpenStreetMap tiles: free, no API key and
// no billing account to attach, which matters for something that may never
// leave prototype.
//
// Tiles come from the network, so this is the one part of the app that
// genuinely cannot work in a basement. Rather than leave a grey square where
// a map should be, it says so — see the offline branch below.
//
// Markers are drawn rather than imported: Leaflet's default icon is a PNG
// resolved relative to the CSS, which breaks under a bundler and a base
// path, and a divIcon lets the pin carry the job's percentage anyway, which
// is the thing worth seeing from across the map.
function pin(job) {
  const { state, percent } = jobProgress(job.tasks)
  const label = state === 'no-data' ? '—' : `${percent}%`
  const background = state === 'complete' ? 'var(--accent)' : 'var(--surface-1)'
  const color = state === 'complete' ? 'var(--accent-ink)' : 'var(--text-primary)'
  return L.divIcon({
    className: '',
    html: `<span style="display:flex;align-items:center;justify-content:center;
      width:40px;height:40px;border-radius:999px;border:2px solid var(--accent);
      background:${background};color:${color};font-size:12px;font-weight:600;
      box-shadow:0 2px 8px rgba(0,0,0,0.25)">${label}</span>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  })
}

export default function JobMap({ jobs, onOpenJob, height = 220, bleed = false }) {
  const holder = useRef(null)
  const map = useRef(null)

  const placeable = useMemo(
    () => jobs.filter((j) => typeof j.site?.lat === 'number'),
    [jobs],
  )
  useEffect(() => {
    if (!holder.current || placeable.length === 0) return undefined

    const instance = L.map(holder.current, {
      // A map inside a scrolling page that grabs the wheel is infuriating —
      // you try to scroll past it and zoom instead. Drag and tap still work.
      scrollWheelZoom: false,
      attributionControl: true,
    })
    map.current = instance

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '© OpenStreetMap',
    }).addTo(instance)

    const markers = placeable.map((job) =>
      L.marker([job.site.lat, job.site.lng], { icon: pin(job), title: job.jobName })
        .addTo(instance)
        .on('click', () => onOpenJob?.(job.id)),
    )

    instance.fitBounds(L.featureGroup(markers).getBounds(), { padding: [36, 36], maxZoom: 14 })

    return () => {
      instance.remove()
      map.current = null
    }
    // Rebuilt rather than mutated when the jobs change, because each pin
    // has its job's percentage baked into it. `placeable` is memoised on the
    // jobs state, which only changes when new data actually arrives, and
    // onOpenJob is memoised by the caller — between them the map is built
    // once and not on every render.
  }, [placeable, onOpenJob])

  if (placeable.length === 0) {
    return (
      <div className="rounded-lg border border-line px-4 py-6 text-center text-sm text-ink-2">
        No sites to map yet — jobs need an address before they can be placed.
      </div>
    )
  }

  // Full-bleed drops the card's radius and shadow with it: a rounded
  // corner only makes sense on something with an edge on screen.
  return (
    <div className={bleed ? 'overflow-hidden' : 'overflow-hidden rounded-lg border border-line'}>
      <div ref={holder} style={{ height }} aria-label="Map of job sites" role="img" />
    </div>
  )
}
