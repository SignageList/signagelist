import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { PATHS } from './paths'
import { type Product, ProductSchema } from './schema'
import { dumpYaml, loadYaml } from './yaml'

export interface LoadedProduct {
	/** Canonical slug, taken from the filename. */
	slug: string
	/** Absolute path to the YAML file. */
	file: string
	/** Parsed and schema-validated product data. */
	data: Product
}

export interface ParsedProduct {
	slug: string
	file: string
	data?: Product
	/** Empty when the file parses and validates cleanly. */
	issues: string[]
}

export class ProductError extends Error {
	constructor(message: string) {
		super(message)
		this.name = 'ProductError'
	}
}

/** Every product file as `{ slug, file }`, sorted by slug. */
export function productFiles(): { slug: string; file: string }[] {
	return readdirSync(PATHS.products)
		.filter((f) => f.endsWith('.yaml'))
		.sort()
		.map((f) => ({ slug: f.replace(/\.yaml$/, ''), file: join(PATHS.products, f) }))
}

/**
 * Parse and validate every product file. Never throws — collects per-file issues
 * so callers can report them all at once. This is the primitive behind both
 * `check` (reports issues) and `loadProducts` (fails on issues).
 */
export function parseAllProducts(): ParsedProduct[] {
	return productFiles().map(({ slug, file }) => {
		let raw: unknown
		try {
			raw = loadYaml(readFileSync(file, 'utf-8'))
		} catch (err) {
			return { slug, file, issues: [`YAML parse error: ${err instanceof Error ? err.message : String(err)}`] }
		}

		const result = ProductSchema.safeParse(raw)
		if (!result.success) {
			return { slug, file, issues: result.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`) }
		}

		const issues: string[] = []
		if (result.data.slug !== slug) {
			issues.push(`slug "${result.data.slug}" does not match filename "${slug}"`)
		}
		return { slug, file, data: result.data, issues }
	})
}

/**
 * Load all products as validated, typed data. Throws `ProductError` listing every
 * problem if any file is invalid. This is the single entry point read-only commands
 * use, so they all operate on the same guaranteed-valid view of the data.
 */
export function loadProducts(): LoadedProduct[] {
	const parsed = parseAllProducts()
	const broken = parsed.filter((p) => p.issues.length > 0)

	if (broken.length > 0) {
		const detail = broken.map((p) => `  ${p.slug}.yaml\n${p.issues.map((i) => `    - ${i}`).join('\n')}`).join('\n')
		throw new ProductError(
			`${broken.length} product file(s) failed validation:\n${detail}\n\nRun "bun run check" for the full report.`,
		)
	}

	return parsed.map((p) => ({ slug: p.slug, file: p.file, data: p.data as Product }))
}

/** Read the raw text of a product file, for formatting-preserving edits. */
export function readProductText(slug: string): { file: string; text: string } {
	const file = join(PATHS.products, `${slug}.yaml`)
	return { file, text: readFileSync(file, 'utf-8') }
}

/** Overwrite a product file with raw text. */
export function writeProductText(slug: string, text: string): void {
	writeFileSync(join(PATHS.products, `${slug}.yaml`), text, 'utf-8')
}

/** Write a full product object using the canonical YAML formatting. */
export function saveProduct(file: string, data: unknown): void {
	writeFileSync(file, dumpYaml(data), 'utf-8')
}
