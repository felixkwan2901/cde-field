import { Fragment } from 'react'
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

// One screen, six doors. `section` picks which part of it to show: the
// folders on the job screen open straight into the one you asked for, rather
// than dropping you at the top of a five-section scroll and leaving you to
// find the phone numbers. Rendering them from one component rather than
// splitting into five files keeps the field definitions in a single place —
// the sections differ in what they list, not in how they behave.
export default function JobInfoScreen({ job, section }) {
  const show = (key) => !section || section === key

  // Worked out here rather than inside Section, because only the caller knows
  // which fields that section was going to render. A contact counts as
  // nothing at all unless it carries a way of reaching someone: a row with a
  // name and no number is a card with nobody to ring on it.
  const noAccess = !job.site.address && !job.site.gateCode && !job.site.parking && !job.site.hours
  const noContacts = !job.contacts.some((c) => c.name || c.phone || c.email)
  const noWork = !job.scope && !job.switchboardLocation && !job.supply
  const noSafety = job.hazards.length === 0 && !job.inductionRequired

  return (
    <>
      {show('access') && (
      <Section
        title={section ? null : 'Getting in'}
        empty={noAccess ? 'No address or access details for this job yet.' : null}
      >
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

      {show('work') && (
      <Section
        title={section ? null : 'The work'}
        empty={noWork ? 'Nothing recorded about the work on this job yet.' : null}
      >
        <Field label="Scope" value={job.scope} />
        <Field label="Switchboard" value={job.switchboardLocation} />
        <Field label="Supply" value={job.supply} />
      </Section>
      )}

      {/* Shown even with nothing in it. Hiding the section meant tapping
          Safety and landing on a screen with no Safety heading anywhere on
          it, which reads as "no hazards here" — a claim this app is in no
          position to make about a site it holds no information on. */}
      {show('safety') && (
        <Section
          title={section ? null : 'Safety'}
          empty={noSafety ? 'No hazards or induction recorded for this job yet.' : null}
        >
          {/* A string, not a flag: what the office types is "site office, ask
              for Dave", and the old fixed sentence would have thrown that
              away and shown "Required before you start" instead — true, but
              not the part you needed. `true` still renders the sentence, so
              an older record does not come through blank. */}
          {job.inductionRequired && (
            <Field
              label="Induction"
              value={
                typeof job.inductionRequired === 'string'
                  ? job.inductionRequired
                  : 'Required before you start'
              }
            />
          )}
          {job.hazards.map((h, i) => (
            <Field key={i} label={`Hazard ${i + 1}`} value={h} />
          ))}
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
