// The site details the office types into the dashboard, read live.
//
// These used to be baked into planning:field-jobs by the dashboard's publish
// script, which meant typing a phone number changed nothing on site until
// somebody remembered to run a command. Nobody remembered. So the app reads
// the office's own blob directly and applies it here, and a number typed at
// a desk is on the crew's phone the next time they open the app.
//
// The publish script no longer writes any of these fields. That is
// deliberate and it matters: two places writing the same field is how a
// cleared phone number comes back from a stale publish.
//
// WHAT THIS FILE IS A COPY OF. The field list lives in the dashboard
// (src/lib/jobDetails.js there) because that is where the columns are. The
// key names below are the contract between the two repos, and both sides
// have tests asserting this exact shape, so a rename that breaks the pair
// fails a test rather than quietly emptying a screen.
export const JOB_DETAILS_KEY = 'planning:job-details'

// Hazards are one dashboard column because that is what a table can offer,
// but the Safety screen lists them one per row — so a semicolon or a new
// line splits them. Not a comma: "Live switchboard, isolated Tuesday" is one
// hazard, and breaking it in two would show a crew the words "isolated
// Tuesday" with no subject.
export function splitHazards(value) {
  return String(value ?? '')
    .split(/[;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

// One job's typed details, in the shape buildJob already reads.
export function toFieldJob(detail) {
  const get = (key) => String(detail?.[key] ?? '').trim()
  const out = {}

  const site = {}
  if (get('gateCode')) site.gateCode = get('gateCode')
  if (get('parking')) site.parking = get('parking')
  if (get('hours')) site.hours = get('hours')
  if (Object.keys(site).length) out.site = site

  // One contact, because one column can only hold one — but the shape is a
  // list and stays a list, so a second contact later needs no change here.
  // The role defaults rather than being left blank: the screen labels the row
  // "<role> · <name>", and an empty role reads as a rendering fault.
  if (get('contactName') || get('contactPhone') || get('contactEmail')) {
    out.contacts = [
      {
        role: get('contactRole') || 'Site contact',
        name: get('contactName'),
        phone: get('contactPhone'),
        ...(get('contactEmail') ? { email: get('contactEmail') } : {}),
      },
    ]
  }

  const hazards = splitHazards(get('hazards'))
  if (hazards.length) out.hazards = hazards
  if (get('induction')) out.inductionRequired = get('induction')
  if (get('switchboard')) out.switchboardLocation = get('switchboard')
  if (get('supply')) out.supply = get('supply')

  return out
}

// Fields the office owns outright through the details blob. Listed so they
// can be cleared as well as set: an entry published before this change may
// still carry a contact, and without stripping it first a number deleted in
// the dashboard would keep ringing on site for ever.
const OFFICE_OWNED = ['contacts', 'hazards', 'inductionRequired', 'switchboardLocation', 'supply']

// Kept from whatever published the job, because the details blob does not
// hold them: the address and description come from the Jobs export, and the
// coordinates from nowhere yet.
const PUBLISHED_SITE_KEYS = ['address', 'mapQuery', 'lat', 'lng']

// Apply the office's details over the published list.
//
// Overwrite, not merge, for everything in OFFICE_OWNED — clearing a field in
// the dashboard has to clear it on site, and a merge would leave a number the
// office believes it deleted still on a crew's phone. `site` is the one
// exception, because the published half of it (the address) and the typed
// half (the gate code) have different owners.
export function applyJobDetails(list, details) {
  if (!Array.isArray(list)) return []
  return list.map((entry) => {
    const detail = toFieldJob(details?.[String(entry?.jobNumber)])
    const { site: detailSite, ...rest } = detail

    const site = {}
    for (const key of PUBLISHED_SITE_KEYS) {
      if (entry?.site?.[key] !== undefined && entry.site[key] !== '') site[key] = entry.site[key]
    }
    Object.assign(site, detailSite ?? {})

    const next = { ...entry }
    for (const key of OFFICE_OWNED) delete next[key]
    return { ...next, ...(Object.keys(site).length ? { site } : {}), ...rest }
  })
}
