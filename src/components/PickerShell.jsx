import { CheckCircle2, MapPin, Send } from 'lucide-react'
import Brand from './Brand'

// The frame around the two screens nobody has identified themselves on yet
// (RoleScreen, StaffPickerScreen) — the same page the dashboard's sign-in
// uses (excel-dashboard/site-worker/login-page.js), so the two apps open the
// same way: one real project photo with the company mark and a line about
// what this is, and a solid panel with the thing to do. On a phone the photo
// is a band across the top; on a laptop it is the left half.
//
// One photo, not a tiled wall: six dimmed thumbnails read as wallpaper, and
// the seams between them were the first thing the eye found. Hotlinked as a
// CSS background so that if cdelectrical.co.nz is slow or down the panel's
// own dark fill shows and nothing is broken.
// Six of Cassidy-Davies' own jobs (cdelectrical.co.nz/projects), tiled across
// the photo side — the collage the owner preferred, inside the split layout.
// Hotlinked as CSS backgrounds: a slow or unreachable marketing site shows a
// dark tile, never a broken-image icon.
const PROJECT_PHOTOS = [
  'https://www.cdelectrical.co.nz/wp-content/uploads/2025/08/1.png',
  'https://www.cdelectrical.co.nz/wp-content/uploads/2024/12/IMG_6354-1536x1152.jpg',
  'https://www.cdelectrical.co.nz/wp-content/uploads/2024/12/AquaPro-1536x1104.jpg',
  'https://www.cdelectrical.co.nz/wp-content/uploads/2024/11/uploads1715202201060-6bgnn2aulol-c76a6241ef84e850120e165b75daabcb1-360-Montreal-Street-21-scaled-1-1536x1025.jpg',
  'https://www.cdelectrical.co.nz/wp-content/uploads/2024/12/IMG_5047-1536x1092.jpg',
  'https://www.cdelectrical.co.nz/wp-content/uploads/2025/04/Stairs.png',
]

export default function PickerShell({ eyebrow = 'Field app', pitch, children }) {
  return (
    <div className="app-frame nav-fade picker-scene">
      <aside className="picker-hero" aria-hidden="true">
        <div className="picker-hero__grid">
          {PROJECT_PHOTOS.map((url) => <div key={url} style={{ backgroundImage: `url('${url}')` }} />)}
        </div>
        <div className="picker-hero__wash" />
        <div className="picker-hero__brand safe-top">
          <Brand size={44} />
          <span className="min-w-0">
            <span className="block truncate text-md font-medium leading-tight">Cassidy-Davies</span>
            <span className="block truncate text-xs leading-tight text-ink-2">Electrical</span>
          </span>
        </div>
        <div className="picker-hero__pitch">
          <p className="picker-hero__eyebrow">{eyebrow}</p>
          <p className="picker-hero__line">{pitch}</p>
        </div>
      </aside>
      <main className="picker-panel app-scroll">
        <div className="mx-auto w-full max-w-md px-5 py-7">
          {children}
          {/* What the app is for, in three lines — the panel was a bare list
              of two cards on a laptop, and said nothing about what came next. */}
          <ul className="picker-features">
            <li><MapPin size={18} aria-hidden="true" /><span>Your jobs for today, with the address and who to call</span></li>
            <li><CheckCircle2 size={18} aria-hidden="true" /><span>Tap a percentage against each task — two seconds, gloves on</span></li>
            <li><Send size={18} aria-hidden="true" /><span>The office sees it on the job page the moment you tap</span></li>
          </ul>
        </div>
        <div className="safe-bottom" />
      </main>
    </div>
  )
}
