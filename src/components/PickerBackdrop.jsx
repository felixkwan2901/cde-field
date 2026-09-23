// The dimmed collage of the company's own project photos behind the two
// screens where nobody has identified themselves yet (RoleScreen,
// StaffPickerScreen) — the same treatment as the dashboard's sign-in page
// (excel-dashboard/site-worker/login-page.js), for the same reason: this is
// the first thing anyone sees, on either app, and a flat colour said nothing
// about whose app it was.
//
// Hotlinked, not copied in, and deliberately CSS background-image on plain
// divs rather than <img> tags: if cdelectrical.co.nz is ever slow or down,
// a failed background-image shows nothing and the dark scrim behind it
// still reads fine — a failed <img> is a broken-image icon sitting behind
// the name someone is trying to tap.
const PROJECT_PHOTOS = [
  'https://www.cdelectrical.co.nz/wp-content/uploads/2025/08/Koawa-Studio-Long.png',
  'https://www.cdelectrical.co.nz/wp-content/uploads/2024/12/IMG_6354-1536x1152.jpg',
  'https://www.cdelectrical.co.nz/wp-content/uploads/2024/12/AquaPro-1536x1104.jpg',
  'https://www.cdelectrical.co.nz/wp-content/uploads/2024/11/uploads1715202201060-6bgnn2aulol-c76a6241ef84e850120e165b75daabcb1-360-Montreal-Street-21-scaled-1-1536x1025.jpg',
  'https://www.cdelectrical.co.nz/wp-content/uploads/2024/12/IMG_5047-1536x1092.jpg',
  'https://www.cdelectrical.co.nz/wp-content/uploads/2025/04/Stairs.png',
]

export default function PickerBackdrop() {
  return (
    <div className="picker-backdrop" aria-hidden="true">
      <div className="picker-backdrop__grid">
        {PROJECT_PHOTOS.map((url) => (
          <div key={url} style={{ backgroundImage: `url('${url}')` }} />
        ))}
      </div>
      <div className="picker-backdrop__scrim" />
    </div>
  )
}
