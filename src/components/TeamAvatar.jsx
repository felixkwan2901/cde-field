import { useState } from 'react'
import { teamMember } from '../lib/teamPhotos'
import { initials } from '../lib/format'

// A face beside a name — the same photos the dashboard's Employee KPI page
// uses, from the company's team page. Initials on a plate where there is no
// photo or it fails to load; never a broken image on a phone with no signal.
export default function TeamAvatar({ name, size = 40, className = '' }) {
  const [broken, setBroken] = useState(false)
  const member = teamMember(name)
  const photo = member?.photo && !broken ? member.photo : null
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-2 font-medium ${className}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.32) }}
      aria-hidden="true"
    >
      {photo ? (
        <img src={photo} alt="" width={size} height={size} loading="lazy" decoding="async" className="h-full w-full object-cover object-top" onError={() => setBroken(true)} />
      ) : (
        initials(name)
      )}
    </span>
  )
}
