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
const HERO_PHOTO = 'https://www.cdelectrical.co.nz/wp-content/uploads/2025/08/Koawa-Studio-Long.png'

export default function PickerShell({ eyebrow = 'Field app', pitch, children }) {
  return (
    <div className="app-frame nav-fade picker-scene">
      <aside className="picker-hero" style={{ backgroundImage: `url('${HERO_PHOTO}')` }} aria-hidden="true">
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
        <div className="mx-auto w-full max-w-md px-5 py-7">{children}</div>
        <div className="safe-bottom" />
      </main>
    </div>
  )
}
