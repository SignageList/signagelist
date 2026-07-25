import type { Command } from '../lib/command'
import { log } from '../lib/log'
import { loadProducts, parseAllProducts, readProductText, writeProductText } from '../lib/products'
import { addToSequence } from '../lib/yaml'

const PLATFORM = 'Amazon Signage'
const PARTNERS_URL = 'https://signage.amazon.com/cms-partners'

function normalize(s: string): string {
	return s.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function normalizeSpaced(s: string): string {
	return s
		.toLowerCase()
		.replace(/[^a-z0-9 ]/g, '')
		.replace(/\s+/g, ' ')
		.trim()
}

function containsWordSequence(haystack: string[], needle: string[]): boolean {
	for (let i = 0; i <= haystack.length - needle.length; i++) {
		if (needle.every((w, j) => w === haystack[i + j])) return true
	}
	return false
}

export const command: Command = {
	name: 'sync-amazon',
	summary: 'Tag products listed as Amazon Signage CMS partners with the platform',
	async run(args) {
		const write = args.includes('--write')

		log.info(`Fetching ${PARTNERS_URL}...`)
		const res = await fetch(PARTNERS_URL, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SignageList/1.0)' } })
		if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${PARTNERS_URL}`)
		const html = await res.text()

		const partnerNames: string[] = []
		for (const m of html.matchAll(/cms_partner_card-text-wrap[\s\S]*?<h3[^>]*>([^<]+)<\/h3>/gi)) {
			const text = m[1].trim()
			if (text.length >= 2) partnerNames.push(text)
		}
		log.info(`Found ${partnerNames.length} partner name candidates\n`)

		let matched = 0
		let updated = 0
		const matchedPartnerNames = new Set<string>()

		for (const { slug, data } of loadProducts()) {
			const normProduct = normalize(data.name)
			if (normProduct.length < 3) continue

			const matchedPartner = partnerNames.find((p) => {
				const np = normalize(p)
				if (np.length < 3) return false
				if (np === normProduct) return true
				const spPartner = normalizeSpaced(p).split(' ')
				const spProduct = normalizeSpaced(data.name).split(' ')
				const shorter = spPartner.length <= spProduct.length ? spPartner : spProduct
				const longer = spPartner.length <= spProduct.length ? spProduct : spPartner
				return shorter.length >= 1 && shorter.length / longer.length >= 0.5 && containsWordSequence(longer, shorter)
			})
			if (!matchedPartner) continue

			matched++
			matchedPartnerNames.add(matchedPartner)

			if (data.platforms.includes(PLATFORM)) {
				log.skip(`${data.name} — already tagged`)
				continue
			}

			const { text } = readProductText(slug)
			const next = addToSequence(text, 'platforms', PLATFORM, { sort: true })
			if (!next) continue

			if (write) {
				writeProductText(slug, next)
				log.ok(`${data.name} ← "${matchedPartner}"`)
			} else {
				log.info(`  would tag ${data.name} ← "${matchedPartner}"`)
			}
			updated++
		}

		const unmatched = [...new Set(partnerNames.filter((p) => !matchedPartnerNames.has(p)))].sort()

		log.step('Summary')
		log.info(`  Partners found : ${partnerNames.length}`)
		log.info(`  Products matched: ${matched}`)
		log.info(`  ${write ? 'Files updated  ' : 'Would update   '}: ${updated}`)
		log.info(`  Partners with no match: ${unmatched.length}`)

		if (write && updated > 0) {
			const broken = parseAllProducts().filter((p) => p.issues.length > 0)
			if (broken.length > 0) {
				log.fail(`${broken.length} file(s) now fail validation — run "bun run check"`)
				process.exit(1)
			}
		}
	},
}
