// The bottom tab bar, and the single clearest signal that this is an app
// rather than a site. It is also a claim about the information: these are
// the places you can be, they are all one tap away, and none of them is
// "inside" another. Anything that is genuinely inside something — a job,
// a task — is pushed on top and hides the bar, which is why the back
// chevron and the tabs never appear together.
export default function TabBar({ tabs, current, onSelect }) {
  return (
    <nav className="tabbar" role="tablist" aria-label="Sections">
      {tabs.map(({ key, label, icon: Icon }) => {
        const selected = key === current
        return (
          <button
            key={key}
            role="tab"
            aria-selected={selected}
            aria-label={label}
            onClick={() => onSelect(key)}
            className="tabbar__item"
          >
            <Icon
              size={23}
              className="tabbar__icon"
              strokeWidth={selected ? 2.4 : 1.9}
              aria-hidden="true"
            />
            {label}
          </button>
        )
      })}
    </nav>
  )
}
