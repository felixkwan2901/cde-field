// A task's state, as one word. Kept out of the component file because it is
// logic rather than markup — and because a module that exports both loses
// fast refresh.
export function taskState(task) {
  if (task.na) return 'na'
  if (task.pct === 100) return 'done'
  if (typeof task.pct === 'number' && task.pct > 0) return 'doing'
  return 'todo'
}
