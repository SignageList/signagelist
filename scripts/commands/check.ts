import type { Command } from '../lib/command'
import { log } from '../lib/log'
import { parseAllProducts } from '../lib/products'

export const command: Command = {
	name: 'check',
	summary: 'Validate all product YAML files against the schema',
	run() {
		const parsed = parseAllProducts()
		log.info(`Validating ${parsed.length} product files...\n`)

		let invalid = 0
		for (const p of parsed) {
			if (p.issues.length === 0) continue
			invalid++
			log.fail(`${p.slug}.yaml`)
			for (const issue of p.issues) log.info(`      - ${issue}`)
		}

		const valid = parsed.length - invalid
		log.done(`Results: ${valid} valid, ${invalid} invalid out of ${parsed.length} files`)

		if (invalid > 0) process.exit(1)
	},
}
