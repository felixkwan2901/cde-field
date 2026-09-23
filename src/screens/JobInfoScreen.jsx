import { Fragment, useState } from 'react'
import JobMap from '../components/JobMap'
// Read-only, ordered by what you need standing at a gate rather than by what
// a database would list first: how to get in, who to ring, what the work is,
// what will hurt you, when it's due.
// The heading is dropped when this section is the whole screen: the nav bar
// is already showing its name, and printing it again immediately underneath
// is the same thing said twice.
function Section({ title, empty, children }) {
  return (
    <section className="mb-6">
      {title && (
        <h2 className="mb-2 text-xs font-medium text-ink-2">{title}</h2>
      )}
      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        {/* Every Field renders nothing for a blank value, so a section with
            nothing in it used to be an empty bordered card — a thin grey line
            and no words. Someone tapping "Who to call" and getting that
            cannot tell whether the app is broken, still loading, or simply
            has no number for this job. Say which, and say who can fix it. */}
        {empty ? (
          <div className="px-4 py-6">
            <p className="text-sm text-ink-2">{empty}</p>
            <p className="mt-1 text-xs text-ink-2">
              The office adds this on the dashboard.
            </p>
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  )
}

// Label above value rather than beside it. The dashboard's two-column row is
// right at a desk and breaks at 375px, where a street address wraps into the
// column next to it.
function Field({ label, value, href, mono = false }) {
  if (!value) return null
  const body = (
    <>
      <span className="block text-xs text-ink-2">{label}</span>
      <span className={`block text-sm ${mono ? 'font-mono text-lg' : ''}`}>{value}</span>
    </>
  )
  return href ? (
    <a
      href={href}
      className="tap block border-b border-line px-4 py-4 last:border-b-0 text-accent"
    >
      {body}
    </a>
  ) : (
    <div className="border-b border-line px-4 py-4 last:border-b-0">{body}</div>
  )
}

// A single value the person on site can set, saved when they leave the box.
//
// Saved on blur rather than per keystroke: every save is a read-modify-write
// of the job's whole record, and one per character would both hammer the
// Worker and let a slow round trip overwrite later text with earlier.
//
// Uncontrolled with a `key` of the stored value, so a change from anywhere
// else remounts it with fresh text instead of an effect fighting whoever is
// typing.
function EditableField({ label, value, placeholder, credit, onSave, saving }) {
  return (
    <div className="border-b border-line px-4 py-4 last:border-b-0">
      <label className="block text-xs text-ink-2" htmlFor={`site-${label}`}>
        {label}
      </label>
      <input
        id={`site-${label}`}
        key={value}
        type="text"
        defaultValue={value}
        placeholder={placeholder}
        disabled={saving}
        enterKeyHint="done"
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur()
          if (e.key === 'Escape') {
            e.currentTarget.value = value
            e.currentTarget.blur()
          }
        }}
        onBlur={(e) => {
          const next = e.target.value.trim()
          if (next !== value) onSave(next)
        }}
        className="mt-1 w-full bg-transparent text-sm outline-none placeholder:text-ink-2 disabled:opacity-40"
      />
      {/* Who said so. Without it, a value typed by the sparky who was there
          on Monday is indistinguishable from one the office guessed at, and
          the whole reason to let people edit this on site is that one of
          those is worth more than the other. */}
      {credit && <p className="mt-1 text-xs text-ink-2">{credit}</p>}
    </div>
  )
}

// Adding a hazard. Its own little form rather than a row that turns into an
// input, because this is the one thing on the screen somebody might be doing
// with a glove on and half an eye on a live board.
function AddHazard({ onAdd, saving }) {
  const [text, setText] = useState('')
  const ready = text.trim().length > 0

  function submit(event) {
    event.preventDefault()
    if (!ready) return
    onAdd(text.trim())
    setText('')
  }

  return (
    <form onSubmit={submit} className="border-t border-line px-4 py-3">
      {/* Labelled, unlike the rows above it. Without this the form was an
          unexplained box under the hazard list, and on a job with no hazards
          it was an unexplained box under nothing at all — there was no word
          anywhere on the screen saying it took a hazard. */}
      <label htmlFor="add-hazard" className="block text-xs text-ink-2">
        Found a hazard? Add it here
      </label>
      <div className="mt-1 flex items-center gap-2">
        <input
          id="add-hazard"
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 140))}
          placeholder="e.g. Live board, isolate at DB2 only"
          enterKeyHint="done"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-2"
        />
        <button
          type="submit"
          disabled={!ready || saving}
          className="tap pressable shrink-0 rounded-sm bg-accent px-3 text-sm font-medium text-accent-ink disabled:opacity-40"
        >
          Add
        </button>
      </div>
      {/* No sign-in on this app, so anyone with the link reads this. Said on
          the screen rather than only in a README, because a hazard note is
          exactly where somebody would write a client's name. */}
      <p className="mt-2 text-xs leading-relaxed text-ink-2">
        Everyone on this job sees these. Keep client details out of them.
      </p>
    </form>
  )
}

// One screen, six doors. `section` picks which part of it to show: the
// folders on the job screen open straight into the one you asked for, rather
// than dropping you at the top of a five-section scroll and leaving you to
// find the phone numbers. Rendering them from one component rather than
// splitting into five files keeps the field definitions in a single place —
// the sections differ in what they list, not in how they behave.
export default function JobInfoScreen({
  job,
  section,
  onSetSiteField,
  onAddHazard,
  onRemoveHazard,
  saving = false,
}) {
  const show = (key) => !section || section === key

  // Who last set one of the on-site fields, as a line to print under it.
  const credit = (field) => {
    const entry = job.siteInfo?.[field]
    return entry?.by ? `Added on site by ${entry.by}` : null
  }

  // Worked out here rather than inside Section, because only the caller knows
  // which fields that section was going to render. A contact counts as
  // nothing at all unless it carries a way of reaching someone: a row with a
  // name and no number is a card with nobody to ring on it.
  const noAccess = !job.site.address && !job.site.gateCode && !job.site.parking && !job.site.hours
  const noContacts = !job.contacts.some((c) => c.name || c.phone || c.email)

  return (
    <>
      {show('access') && (
      <Section
        title={section ? null : 'Getting in'}
        empty={noAccess ? 'No address or access details for this job yet.' : null}
      >
        {/* A preview, not a replacement for the tap-through link below — this
            answers "roughly where" without leaving the app; turn-by-turn
            still needs the real Maps app. Guarded on lat existing rather than
            on `noAccess` above, which is about the text fields: an address
            that failed to geocode (see the Map tab's "Not on the map" list)
            still gets its text rows here, just no preview.
            `bleed` drops JobMap's own card/border so it sits flush as the
            first thing in this Section's own rounded card, rather than a
            card inside a card. No `onOpenJob` — there is nowhere to navigate
            to, we are already on this job. */}
        {typeof job.site?.lat === 'number' && <JobMap jobs={[job]} height={160} bleed />}
        {/* mapQuery is a tidied search string for the few sites whose postal
            address does not find the gate. Nothing sets it today, and without
            the fallback this linked to ?q=undefined — a live link that opens
            Maps on nothing, which is worse than no link at all. */}
        <Field
          label="Site address"
          value={job.site.address}
          href={
            job.site.address
              ? `https://maps.google.com/?q=${encodeURIComponent(job.site.mapQuery || job.site.address)}`
              : undefined
          }
        />
        <Field label="Gate / key" value={job.site.gateCode} mono />
        <Field label="Parking" value={job.site.parking} />
        <Field label="Site hours" value={job.site.hours} />
      </Section>
      )}

      {show('contacts') && (
      <Section
        title={section ? null : 'Who to call'}
        empty={noContacts ? 'No contact recorded for this job yet.' : null}
      >
        {job.contacts.map((c, i) => (
          <Fragment key={c.role ?? i}>
            {/* Phone and email are separate rows rather than one row with two
                links: this is tapped one-handed on a site, and two targets
                inside one row is how you ring someone when you meant to
                email them. Either may be absent — Field renders nothing for
                a blank value, so a contact with only an email still shows,
                which the old single-row version did not. */}
            <Field
              label={`${c.role} · ${c.name}`}
              value={c.phone}
              href={c.phone ? `tel:${c.phone.replace(/\s/g, '')}` : undefined}
            />
            <Field
              label={c.phone ? 'Email' : `${c.role} · ${c.name}`}
              value={c.email}
              href={c.email ? `mailto:${c.email}` : undefined}
            />
          </Fragment>
        ))}
      </Section>
      )}

      {/* No empty state on this one any more, unlike Getting in and Who to
          call: the boxes are here to be typed into, and replacing them with
          "nothing recorded yet" would hide the only way to record it. The
          placeholders say the same thing and can be acted on. */}
      {show('work') && (
      <Section title={section ? null : 'The work'}>
        {/* Scope stays read-only. It comes out of the Jobs export with the
            address and is overwritten on every import, so anything typed
            over it here would vanish without warning. */}
        <Field label="Scope" value={job.scope} />
        <EditableField
          label="Switchboard"
          value={job.switchboardLocation ?? ''}
          placeholder="e.g. Plant room, level 1"
          credit={credit('switchboard')}
          onSave={(value) => onSetSiteField?.('switchboard', value)}
          saving={saving}
        />
        <EditableField
          label="Supply"
          value={job.supply ?? ''}
          placeholder="e.g. 3 phase, 100A"
          credit={credit('supply')}
          onSave={(value) => onSetSiteField?.('supply', value)}
          saving={saving}
        />
      </Section>
      )}

      {/* Shown even with nothing in it. Hiding the section meant tapping
          Safety and landing on a screen with no Safety heading anywhere on
          it, which reads as "no hazards here" — a claim this app is in no
          position to make about a site it holds no information on. Now it is
          also where a hazard gets added, so there is something to do here
          even on a job nobody has recorded anything against. */}
      {show('safety') && (
        <Section title={section ? null : 'Safety'}>
          {/* A string, not a flag: what the office types is "site office, ask
              for Dave", and the old fixed sentence would have thrown that
              away and shown "Required before you start" instead — true, but
              not the part you needed. `true` still renders the sentence, so
              an older record does not come through blank. */}
          <EditableField
            label="Induction / sign in"
            value={
              typeof job.inductionRequired === 'string'
                ? job.inductionRequired
                : job.inductionRequired
                  ? 'Required before you start'
                  : ''
            }
            placeholder="e.g. Site office, ask for Dave"
            credit={credit('induction')}
            onSave={(value) => onSetSiteField?.('induction', value)}
            saving={saving}
          />
          {job.hazards.map((h, i) => (
            <div
              key={h.id ?? `office-${i}`}
              className="flex items-start gap-2 border-b border-line px-4 py-4 last:border-b-0"
            >
              <div className="min-w-0 flex-1">
                <span className="block text-xs text-ink-2">Hazard {i + 1}</span>
                <span className="block text-sm">{h.text}</span>
                {h.source === 'site' && h.by && (
                  <span className="mt-1 block text-xs text-ink-2">Found on site by {h.by}</span>
                )}
              </div>
              {/* Only what was added here can be removed here. An office
                  hazard is deleted where it was written — a hazard is the one
                  thing in this app worth making slightly harder to lose. */}
              {h.source === 'site' && h.id && (
                <button
                  type="button"
                  onClick={() => onRemoveHazard?.(h.id)}
                  disabled={saving}
                  aria-label={`Remove hazard: ${h.text}`}
                  className="tap shrink-0 px-2 text-xs text-ink-2 disabled:opacity-40"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          {onAddHazard && <AddHazard onAdd={onAddHazard} saving={saving} />}
        </Section>
      )}

      {/* Dates sit with the work rather than in a folder of their own: "what
          is this job and when is it due" is one question. */}
      {/* Hidden when empty rather than given an empty state, unlike Safety
          above: a missing Dates card claims nothing, while a missing Safety
          card would read as "no hazards". Without this, a job with no dates
          put a second empty card directly under the first. */}
      {show('work') && (job.dates.start || job.dates.target || job.dates.thisWeek) && (
      <Section title="Dates">
        <Field label="Started" value={job.dates.start} />
        <Field label="Target finish" value={job.dates.target} />
        <Field label="This week" value={job.dates.thisWeek} />
      </Section>
      )}
    </>
  )
}
