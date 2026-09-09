// Placeholder shell. The screens (staff picker, today, job tasks, task
// detail, job info) land next — this exists so the deploy pipeline can be
// proved end to end before there is anything to break.
export default function App() {
  return (
    <main className="safe-top safe-bottom mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="text-[22px] font-semibold">CDE Field</h1>
      <p className="text-[15px] text-[color:var(--text-secondary)]">
        On-site task progress for Cassidy-Davies electricians.
      </p>
      <p className="mt-2 rounded-xl bg-[color:var(--surface-2)] px-4 py-3 text-[13px] text-[color:var(--text-muted)]">
        Prototype — nothing here is real yet.
      </p>
    </main>
  )
}
