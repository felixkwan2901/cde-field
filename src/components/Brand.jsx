import mark from '../assets/logo-mark.png'

// The company mark, on a plate.
//
// The mark is white and green on transparency, which is fine on the
// dashboard because that app is dark. Here the default theme is light and
// the white half of it would simply not be there, so it sits on a fixed
// dark tile — the same thing an app icon does, and the reason an app icon
// has a background at all.
export default function Brand({ size = 56 }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-lg bg-plate"
      style={{ width: size, height: size }}
    >
      <img
        src={mark}
        alt=""
        aria-hidden="true"
        width={Math.round(size * 0.62)}
        height={Math.round(size * 0.62)}
        className="object-contain"
      />
    </span>
  )
}
