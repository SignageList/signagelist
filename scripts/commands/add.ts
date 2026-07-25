import { existsSync } from 'node:fs'
import { join } from 'node:path'
import * as readline from 'node:readline/promises'
import type { Command } from '../lib/command'
import { log } from '../lib/log'
import { PATHS } from '../lib/paths'
import { saveProduct } from '../lib/products'

function template(slug: string) {
	return {
		name: '',
		slug,
		description: '',
		website: '',
		year_founded: null,
		headquarters: [],
		open_source: false,
		rss_feed_url: null,
		self_signup: false,
		discontinued: false,
		categories: [],
		platforms: [],
		models: [
			{
				delivery: 'cloud',
				free_trial: false,
				pricing_available: false,
				has_freemium: false,
				pricing: [
					{ name: '', payment_model: 'subscription', billing_basis: 'per_device', monthly: null, yearly: null },
				],
			},
		],
		stats: {},
		notes: [],
		features: [],
		integrations: [],
		target_audience: [],
		deployment_options: [],
		support_channels: [],
		languages: [],
		screenshots: [],
		last_verified: null,
	}
}

export const command: Command = {
	name: 'add',
	summary: 'Scaffold a new product YAML file interactively',
	async run() {
		const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
		try {
			const slug = (await rl.question('Product slug (URL-safe ID, e.g. "my-product"): ')).trim()
			if (!slug) {
				log.fail('Slug is required')
				return
			}

			const file = join(PATHS.products, `${slug}.yaml`)
			if (existsSync(file)) {
				const overwrite = await rl.question(`Product "${slug}" already exists. Overwrite? (y/N): `)
				if (overwrite.toLowerCase() !== 'y') {
					log.info('Cancelled.')
					return
				}
			}

			saveProduct(file, template(slug))
			log.done(`Created ${file}`)
			log.info('Fill in the details, then run "bun run check" to validate.')
		} finally {
			rl.close()
		}
	},
}
