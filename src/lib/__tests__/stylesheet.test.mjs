import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const css = readFileSync(new URL('../../index.css', import.meta.url), 'utf8')

// Strip comments first: this rule has now been broken twice by an edit that
// cut into the middle of the comment explaining it, leaving the example
// `button { color: inherit }` behind as a live rule.
const code = css.replace(/\/\*[\s\S]*?\*\//g, '')

/** The character depth of `{` nesting at each index, so "is this inside a
 *  block" is answerable without a real parser. */
function depthAt(source, index) {
  let d = 0
  for (let i = 0; i < index; i++) {
    if (source[i] === '{') d++
    else if (source[i] === '}') d--
  }
  return d
}

test('element resets are inside a layer, never bare', () => {
  // An unlayered rule beats every layered one regardless of specificity, so
  // a bare `button { color: inherit }` silently overrides Tailwind's own
  // utilities — the visible symptom was the selected percentage chip
  // rendering near-black on its dark green fill.
  for (const m of code.matchAll(/(^|[};])\s*(button|input|a|select|textarea)\s*[,{]/g)) {
    const at = m.index + m[0].indexOf(m[2])
    assert.ok(
      depthAt(code, at) > 0,
      `bare "${m[2]}" rule at index ${at} is outside @layer; wrap it in @layer base`,
    )
  }
})

test('no colour is hardcoded outside the token blocks and print rules', () => {
  const beforePrint = code.split('@media print')[0]
  const afterTokens = beforePrint.slice(beforePrint.lastIndexOf("color-scheme: dark;"))
  const stray = [...afterTokens.matchAll(/#[0-9a-fA-F]{3,8}\b/g)].map((m) => m[0])
  assert.deepEqual(stray, [], `hardcoded colour outside the token layer: ${stray.join(', ')}`)
})
