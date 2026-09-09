// Four jobs, authored as a demo script rather than as realistic filler: each
// one exists to put a different state on screen.
//
//   1. a commercial fit-out mid-flight, several names on it — the main story
//   2. a residential rewire with tasks but nothing started — the "0%" ring
//   3. a new build with no tasks at all — the "not broken down yet" ring,
//      the state most demos never show and the one worth seeing
//   4. a small job finished — so the complete state exists too
//
// Invented sites and invented people. Nothing here is a real Cassidy-Davies
// job, deliberately: this is a public repo and the app has no authentication.
//
// The coordinates are real Christchurch and Rolleston points, so the map has
// honest geography under the made-up addresses. Real jobs cannot appear on
// the map yet: the workbook has no address column anywhere, so there is
// nothing to place. Adding one address per job is what unlocks it.
const t = (id, name, area, pct = null, extra = {}) => ({
  id,
  name,
  area,
  pct,
  na: false,
  updatedBy: null,
  updatedAt: null,
  attachments: [],
  ...extra,
})

const hoursAgo = (n) => new Date(Date.now() - n * 3600 * 1000).toISOString()

export const JOBS = [
  {
    id: '9412',
    jobNumber: '9412',
    jobName: 'Northwood Medical Fit-out',
    client: 'Northwood Property Group',
    type: 'commercial',
    site: {
      address: '48 Wairakei Road, Bryndwr, Christchurch',
      lat: -43.5065,
      lng: 172.5842,
      mapQuery: '48 Wairakei Road, Christchurch',
      gateCode: '4821',
      parking: 'Rear yard off Grahams Road. Do not block the loading bay.',
      hours: 'Site open 6:30am – 5pm, no noisy work before 7am',
    },
    contacts: [
      { role: 'Site foreman', name: 'Dave Rangi', phone: '021 555 0182' },
      { role: 'CDE supervisor', name: 'Tom Price', phone: '027 555 0114' },
      { role: 'Main contractor', name: 'Kerrigan Build', phone: '03 555 0170' },
    ],
    scope: 'Full fit-out of six consult rooms, reception and a plant room. New DB, DALI lighting control throughout, nurse call containment.',
    switchboardLocation: 'Plant room, ground floor, behind the double doors',
    supply: '3-phase, existing 200A main to be re-terminated',
    hazards: ['Live adjacent tenancy — isolate at DB2 only', 'Asbestos register on site office wall', 'Scissor lift in use in reception'],
    inductionRequired: true,
    dates: { start: '2026-08-04', target: '2026-10-17', thisWeek: 'Level 1 fit-off, plant room terminations' },
    assignedStaffIds: ['staff-1', 'staff-2', 'staff-3'],
    tasks: [
      t('site-set-up-temporary-supply', 'Site set-up & temporary supply', 'Whole site', 100, { updatedBy: 'Tom Price', updatedAt: hoursAgo(340) }),
      t('mark-out-set-out-from-drawings', 'Mark-out / set-out from drawings', 'Whole site', 100, { updatedBy: 'Ben Dyer', updatedAt: hoursAgo(300) }),
      t('penetrations-cable-routes', 'Penetrations & cable routes', 'Whole site', 100, { updatedBy: 'Ben Dyer', updatedAt: hoursAgo(220) }),
      t('cable-tray-ducting-conduit', 'Cable tray / ducting / conduit', 'Ceiling space', 75, { updatedBy: 'Jake', updatedAt: hoursAgo(48) }),
      t('rough-in-power', 'Rough-in — power', 'Consult rooms', 75, { updatedBy: 'Ben Dyer', updatedAt: hoursAgo(26) }),
      t('rough-in-lighting', 'Rough-in — lighting', 'Consult rooms', 50, { updatedBy: 'Jake', updatedAt: hoursAgo(26) }),
      t('rough-in-data-comms', 'Rough-in — data / comms', 'Consult rooms', 50, { updatedBy: 'Ben Dyer', updatedAt: hoursAgo(72) }),
      t('switchboard-install-termination', 'Switchboard install & termination', 'Plant room', 25, { updatedBy: 'Tom Price', updatedAt: hoursAgo(3) }),
      t('sub-mains-distribution-boards', 'Sub-mains & distribution boards', 'Plant room', 25, { updatedBy: 'Tom Price', updatedAt: hoursAgo(3) }),
      t('fit-off-outlets-switches', 'Fit-off — outlets & switches', 'Reception'),
      t('fit-off-light-fittings', 'Fit-off — light fittings', 'Reception'),
      t('emergency-exit-lighting', 'Emergency & exit lighting', 'Whole site'),
      t('lighting-control-dali-programming', 'Lighting control / DALI programming', 'Whole site'),
      t('testing-commissioning', 'Testing & commissioning', 'Whole site'),
      t('site-clean-reinstatement', 'Site clean & reinstatement', 'Whole site'),
      t('generator-ups-changeover', 'Generator / UPS / changeover', 'Plant room', null, { na: true }),
    ],
  },
  {
    id: '9455',
    jobNumber: '9455',
    jobName: 'Pinehaven Road Rewire',
    client: 'M & J Tauwhare',
    type: 'residential',
    site: {
      address: '12 Pinehaven Road, Halswell, Christchurch',
      lat: -43.5601,
      lng: 172.5546,
      mapQuery: '12 Pinehaven Road, Christchurch',
      gateCode: 'Key safe by the garage — 2907',
      parking: 'On the street, mind the neighbour’s driveway',
      hours: 'Owners home most days, keep noise down before 8am',
    },
    contacts: [
      { role: 'Homeowner', name: 'Marama Tauwhare', phone: '027 555 0246' },
      { role: 'CDE supervisor', name: 'Tom Price', phone: '027 555 0114' },
    ],
    scope: 'Full rewire of a 1950s three-bedroom, new switchboard, heat pump and HWC circuits, interconnected smokes.',
    switchboardLocation: 'Hallway cupboard, being relocated to the garage',
    supply: 'Single phase, 63A. Overhead to be converted to underground.',
    hazards: ['Old rubber-insulated wiring — treat everything as live', 'Low ceiling space, limited crawl access'],
    inductionRequired: false,
    dates: { start: '2026-09-15', target: '2026-10-10', thisWeek: 'Starts Monday — nothing on site yet' },
    assignedStaffIds: ['staff-1', 'staff-4'],
    tasks: [
      t('site-set-up-temporary-supply', 'Site set-up & temporary supply', 'Whole house'),
      t('penetrations-cable-routes', 'Penetrations & cable routes', 'Whole house'),
      t('rough-in-power', 'Rough-in — power', 'Whole house'),
      t('rough-in-lighting', 'Rough-in — lighting', 'Whole house'),
      t('switchboard-install-termination', 'Switchboard install & termination', 'Garage'),
      t('interconnected-smoke-alarms', 'Interconnected smoke alarms', 'Whole house'),
      t('heat-pump-hrv-connections', 'Heat pump / HRV connections', 'Lounge'),
      t('testing-commissioning', 'Testing & commissioning', 'Whole house'),
    ],
  },
  {
    id: '9470',
    jobNumber: '9470',
    jobName: 'Rolleston Trade Units',
    client: 'Selwyn Commercial',
    type: 'commercial',
    site: {
      address: '7 Jones Road, Rolleston',
      lat: -43.5893,
      lng: 172.3823,
      mapQuery: '7 Jones Road, Rolleston',
      gateCode: 'Site office — sign in with Kerry',
      parking: 'Gravel area at the front',
      hours: '7am – 5pm, Saturdays by arrangement',
    },
    contacts: [
      { role: 'Project manager', name: 'Kerry Bright', phone: '021 555 0399' },
      { role: 'CDE supervisor', name: 'Tom Price', phone: '027 555 0114' },
    ],
    scope: 'Six shell trade units. Scope not broken down yet — pricing still with the client.',
    switchboardLocation: 'To be confirmed',
    supply: 'To be confirmed',
    hazards: ['Active earthworks — high-vis and boots at all times'],
    inductionRequired: true,
    dates: { start: '2026-11-02', target: '2027-02-27', thisWeek: 'Not started' },
    assignedStaffIds: ['staff-1'],
    tasks: [],
  },
  {
    id: '9388',
    jobNumber: '9388',
    jobName: 'Kensington Ave Garage',
    client: 'R Whitfield',
    type: 'residential',
    site: {
      address: '31 Kensington Avenue, Sydenham, Christchurch',
      lat: -43.5497,
      lng: 172.6363,
      mapQuery: '31 Kensington Avenue, Christchurch',
      gateCode: 'Side gate, unlocked',
      parking: 'Driveway',
      hours: 'Any time, owner works nights',
    },
    contacts: [{ role: 'CDE supervisor', name: 'Tom Price', phone: '027 555 0114' }],
    scope: 'Sub-main to a new detached garage, lighting, four outlets and an EV charger.',
    switchboardLocation: 'New sub-board in the garage',
    supply: 'Single phase, sub-main from the house board',
    hazards: [],
    inductionRequired: false,
    dates: { start: '2026-08-25', target: '2026-09-05', thisWeek: 'Complete — awaiting COC' },
    assignedStaffIds: ['staff-1'],
    tasks: [
      t('penetrations-cable-routes', 'Penetrations & cable routes', 'Garage', 100, { updatedBy: 'Andy', updatedAt: hoursAgo(180) }),
      t('rough-in-power', 'Rough-in — power', 'Garage', 100, { updatedBy: 'Andy', updatedAt: hoursAgo(170) }),
      t('exterior-garage-circuits', 'Exterior & garage circuits', 'Garage', 100, { updatedBy: 'Andy', updatedAt: hoursAgo(150) }),
      t('ev-charger', 'EV charger', 'Garage', 100, { updatedBy: 'Andy', updatedAt: hoursAgo(140) }),
      t('testing-commissioning', 'Testing & commissioning', 'Garage', 100, { updatedBy: 'Tom Price', updatedAt: hoursAgo(130) }),
    ],
  },
]
