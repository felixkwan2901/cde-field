// Who is on this site, and when someone was last here.
//
// A job sitting at 40% that nobody has visited for three days looks
// identical, in this app, to one being worked on this morning. The
// percentage answers "how much" and nothing answers "is anyone there" —
// which is the question the office actually rings up to ask.
//
// THE RULE THAT MAKES THIS SAFE TO BUILD: no durations, ever. Not here, not
// on a screen, not derived later. "On site since 8:12" is a presence
// signal; "on site 6h 12m" is a timesheet, and the moment this app produces
// one it is competing with the hours in the workbook — two sources for one
// number, which is worse than one source and a gap. It also changes what the
// app is to the person holding the phone: a tool for recording your work
// becomes a tool for recording your whereabouts, and that is the kind of
// thing a crew stops using without ever saying why.
//
// So: arrival times and last-seen, never a total. If a total is ever wanted,
// that is a conversation with the crew first and a build second.

// Visits are appends — the same shape as notes, and for the same reason.
// An arrival stamped at 07:40 is still true when it lands at 11:00 from a
// basement, whatever anyone else has done since, so nothing here needs a
// staleness check.

/**
 * Who is currently on site, newest arrival first, and who was here last.
 * Pass the raw visits array off the record; it may be undefined.
 */
export function presence(visits) {
  const sorted = [...(visits ?? [])]
    .filter((v) => v?.at && v?.by)
    .sort((a, b) => new Date(a.at) - new Date(b.at))

  // Last action per person wins: someone who arrived, left and came back is
  // on site, and someone who arrived twice without leaving is on site once.
  const latest = new Map()
  for (const v of sorted) latest.set(v.by, v)

  const onSite = [...latest.values()]
    .filter((v) => v.action === 'arrived')
    .sort((a, b) => new Date(b.at) - new Date(a.at))

  return {
    onSite,
    // The most recent visit of any kind, used only when nobody is there now.
    last: sorted.length ? sorted[sorted.length - 1] : null,
    everVisited: sorted.length > 0,
  }
}

/** Whether THIS person's next tap should say arrive or leave. */
export function isOnSite(visits, name) {
  return presence(visits).onSite.some((v) => v.by === name)
}

// Local wall-clock time, which is what a phone on a site is for. Deliberately
// the arrival time and not an elapsed count — see the rule at the top.
export function arrivalTime(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleTimeString('en-NZ', { hour: 'numeric', minute: '2-digit' })
}
