import { Printer } from 'lucide-react'
import { crewActivity, lastTouched } from '../lib/crewActivity'
import { jobProgress } from '../lib/progress'
import { relativeTime } from '../lib/format'

// Something to put on the table at a meeting: progress by job, activity by
// worker, dated, on one page.
//
// Prints. The app is a phone app, but a manager reads this at a desk, and a
// meeting still runs on paper more often than anyone admits — see the print
// rules in index.css, which drop the app chrome and force the whole thing to
// black on white regardless of the theme.
export default function ReportScreen({ jobs, roster }) {
  const crew = crewActivity(jobs, roster)
  const ordered = [...jobs].sort((a, b) => (lastTouched(b) ?? 0) - (lastTouched(a) ?? 0))
  const printedAt = new Date()

  return (
    <div className="report">
      <div className="mb-6 flex items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-medium">Field progress report</h2>
          <p className="text-xs text-ink-2">
            {printedAt.toLocaleDateString('en-NZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="tap pressable no-print flex shrink-0 items-center gap-2 rounded-sm bg-surface-2 px-4 text-xs"
        >
          <Printer size={16} aria-hidden="true" />
          Print
        </button>
      </div>

      <h3 className="report-heading">Progress by job</h3>
      <table className="report-table">
        <thead>
          <tr>
            <th>Job</th>
            <th className="num">Progress</th>
            <th className="num">Tasks</th>
            <th>Last update</th>
          </tr>
        </thead>
        <tbody>
          {ordered.map((job) => {
            const p = jobProgress(job.tasks)
            const touched = lastTouched(job)
            return (
              <tr key={job.id}>
                <td>
                  <span className="text-ink-2">{job.jobNumber}</span> {job.jobName}
                </td>
                <td className="num">{p.state === 'no-data' ? '—' : `${p.percent}%`}</td>
                <td className="num">
                  {p.state === 'no-data' ? 'none' : `${p.started}/${p.total}`}
                </td>
                <td>
                  {touched ? relativeTime(new Date(touched).toISOString()) : 'Nothing recorded'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <h3 className="report-heading">Activity by worker</h3>
      <table className="report-table">
        <thead>
          <tr>
            <th>Name</th>
            <th className="num">Updates</th>
            <th className="num">Jobs</th>
            <th>Last recorded</th>
          </tr>
        </thead>
        <tbody>
          {crew.map((person) => (
            <tr key={person.name}>
              <td>
                {person.name}
                {person.offRoster && (
                  <span className="text-ink-2"> (not on roster)</span>
                )}
              </td>
              <td className="num">{person.updates || '—'}</td>
              <td className="num">{person.jobs.length || '—'}</td>
              <td>
                {person.last
                  ? `${person.last.task} · ${relativeTime(new Date(person.last.at).toISOString())}`
                  : 'No activity'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="mt-6 text-xs leading-relaxed text-ink-2">
        Percentages are what the crew recorded on site — an unweighted average across each
        job&apos;s tasks, excluding any marked not applicable. They are not a claim percentage
        and are not used in any financial figure.
      </p>
    </div>
  )
}
