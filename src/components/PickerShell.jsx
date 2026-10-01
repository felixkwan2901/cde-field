import { CheckCircle2, MapPin, Send } from 'lucide-react'
import Brand from './Brand'

// The frame around the two screens nobody has identified themselves on yet
// (RoleScreen, StaffPickerScreen) — the same page the dashboard's sign-in
// uses (excel-dashboard/site-worker/login-page.js), so the two apps open the
// same way: one real project photo with the company mark and a line about
// what this is, and a solid panel with the thing to do. On a phone the photo
// is a band across the top; on a laptop it is the left half.
//
// The crew in front of the workshop — the photo the company uses as its
// banner, the full 1920px file so it is sharp. Full width in the middle of
// the photo side with black above and below, the top and bottom faded into
// it, exactly as the dashboard's sign-in has it. A CSS background, so a slow
// or unreachable marketing site shows black, never a broken-image icon.
const CREW_PHOTO = 'https://www.cdelectrical.co.nz/wp-content/uploads/2025/08/Team-Shot.jpg'

export default function PickerShell({ eyebrow = 'Field app', pitch, children }) {
  return (
    <div className="app-frame nav-fade picker-scene">
      <aside className="picker-hero" aria-hidden="true">
        <div className="picker-hero__photo" style={{ backgroundImage: `url('${CREW_PHOTO}')` }} />
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
