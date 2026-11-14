import type { Command } from '../lib/command'
import { parseAllIncidents } from '../lib/incidents'
import { log } from '../lib/log'
import { parseAllProducts } from '../lib/products'

export const command: Command = {
	name: 'check',
	summary: 'Validate all product and incident YAML files against their schemas',
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

		const incidents = parseAllIncidents(new Set(parsed.map((p) => p.slug)))
		log.info(`\nValidating ${incidents.length} incident files...\n`)
		let invalidIncidents = 0
		for (const i of incidents) {
			if (i.issues.length === 0) continue
			invalidIncidents++
			log.fail(`incidents/${i.slug}.yaml`)
			for (const issue of i.issues) log.info(`      - ${issue}`)
		}
		log.done(
			`Results: ${incidents.length - invalidIncidents} valid, ${invalidIncidents} invalid out of ${incidents.length} files`,
		)

		if (invalid > 0 || invalidIncidents > 0) process.exit(1)
	},
}
