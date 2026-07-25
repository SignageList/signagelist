import yaml from 'js-yaml'

// Canonical dump options — the one place YAML formatting is defined. Every writer
// that emits a whole document uses these so files stay byte-consistent.
const DUMP_OPTIONS: yaml.DumpOptions = {
	lineWidth: -1,
	noRefs: true,
	quotingType: '"',
	forceQuotes: false,
	sortKeys: false,
}

export function loadYaml<T = unknown>(text: string): T {
	return yaml.load(text) as T
}

export function dumpYaml(value: unknown): string {
	return yaml.dump(value, DUMP_OPTIONS)
}

// ── Formatting-preserving text edits ────────────────────────────────────────────
// Some commands add a single field or list item to an existing file and must NOT
// re-dump the whole document (that would drop comments and reflow formatting).
// These operate on the raw text and touch only the target lines.

/**
 * Add `value` to a block sequence under `key` (`  - item` style).
 * Returns the updated text, or null if the value is already present or the block
 * is missing. When `sort` is true the sequence is re-sorted case-insensitively;
 * otherwise the value is appended (preserving existing order).
 */
export function addToSequence(text: string, key: string, value: string, opts: { sort?: boolean } = {}): string | null {
	const blockRe = new RegExp(`^(${key}:\\n)((?: {2}- .+\\n?)+)`, 'm')
	const match = text.match(blockRe)
	if (!match) return null

	const existing = [...match[2].matchAll(/^ {2}- (.+)$/gm)].map((m) => m[1].trim())
	if (existing.includes(value)) return null

	const items = opts.sort
		? [...existing, value].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
		: [...existing, value]

	const rebuilt = `${items.map((p) => `  - ${p}`).join('\n')}\n`
	return text.replace(blockRe, `$1${rebuilt}`)
}

/**
 * Insert a scalar `line` before the first line that starts with one of `anchors`.
 * Returns the updated text, or null if none of the anchors are present.
 */
export function insertLineBefore(text: string, line: string, anchors: string[]): string | null {
	const lines = text.split('\n')
	for (const anchor of anchors) {
		const idx = lines.findIndex((l) => l.startsWith(anchor))
		if (idx !== -1) {
			lines.splice(idx, 0, line)
			return lines.join('\n')
		}
	}
	return null
}
