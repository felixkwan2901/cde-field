// Shaped to match what already lives in the dashboard's KV under
// planning:staff-roster ({ id, name, hours }), so listStaff() can read the
// real roster with a plain .map and no adapter. Used only when that read
// fails — a demo that dies because the office wifi dropped is a bad demo.
export const STAFF = [
  { id: 'staff-1', name: 'Ben Dyer' },
  { id: 'staff-2', name: 'Jake' },
  { id: 'staff-3', name: 'Tom Price' },
  { id: 'staff-4', name: 'Andy' },
  { id: 'staff-5', name: 'Hayden' },
  { id: 'staff-6', name: 'Regan' },
]
