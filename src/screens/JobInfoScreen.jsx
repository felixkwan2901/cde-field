// Read-only, ordered by what you need standing at a gate rather than by what
// a database would list first: how to get in, who to ring, what the work is,
// what will hurt you, when it's due.
function Section({ title, children }) {
  return (
    <section className="mb-5">
      <h2 className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-[color:var(--text-muted)]">
        {title}
      </h2>
      <div className="overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-1)]">
        {children}
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
      <span className="block text-[12px] text-[color:var(--text-muted)]">{label}</span>
      <span className={`block text-[15px] ${mono ? 'font-mono text-[20px]' : ''}`}>{value}</span>
    </>
  )
  return href ? (
    <a
      href={href}
      className="tap block border-b border-[color:var(--border)] px-4 py-3 last:border-b-0 text-[color:var(--brand-orange)]"
    >
      {body}
    </a>
  ) : (
    <div className="border-b border-[color:var(--border)] px-4 py-3 last:border-b-0">{body}</div>
  )
}

export default function JobInfoScreen({ job }) {
  return (
    <>
      <Section title="Getting in">
        <Field
          label="Site address"
          value={job.site.address}
          href={`https://maps.google.com/?q=${encodeURIComponent(job.site.mapQuery)}`}
        />
        <Field label="Gate / key" value={job.site.gateCode} mono />
        <Field label="Parking" value={job.site.parking} />
        <Field label="Site hours" value={job.site.hours} />
      </Section>

      <Section title="Who to call">
        {job.contacts.map((c) => (
          <Field
            key={c.role}
            label={`${c.role} · ${c.name}`}
            value={c.phone}
            href={`tel:${c.phone.replace(/\s/g, '')}`}
          />
        ))}
      </Section>

      <Section title="The work">
        <Field label="Scope" value={job.scope} />
        <Field label="Switchboard" value={job.switchboardLocation} />
        <Field label="Supply" value={job.supply} />
      </Section>

      {(job.hazards.length > 0 || job.inductionRequired) && (
        <Section title="Safety">
          {job.inductionRequired && <Field label="Induction" value="Required before you start" />}
          {job.hazards.map((h, i) => (
            <Field key={i} label={`Hazard ${i + 1}`} value={h} />
          ))}
        </Section>
      )}

      <Section title="Dates">
        <Field label="Started" value={job.dates.start} />
        <Field label="Target finish" value={job.dates.target} />
        <Field label="This week" value={job.dates.thisWeek} />
      </Section>
    </>
  )
}
