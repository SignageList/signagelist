// Minimal, consistent console output shared by every command. Keeping this in one
// place means all commands report progress the same way instead of each inventing
// its own [OK]/[FAIL]/✓ conventions.

export const log = {
	info: (msg: string) => console.log(msg),
	ok: (msg: string) => console.log(`  ok    ${msg}`),
	skip: (msg: string) => console.log(`  skip  ${msg}`),
	warn: (msg: string) => console.warn(`  warn  ${msg}`),
	fail: (msg: string) => console.error(`  fail  ${msg}`),
	step: (msg: string) => console.log(`\n${msg}`),
	done: (msg: string) => console.log(`\n${msg}`),
}
