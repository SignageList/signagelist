import type { Command } from '../lib/command'
import { log } from '../lib/log'
import { loadProducts, readProductText, writeProductText } from '../lib/products'
import { insertLineBefore } from '../lib/yaml'

const TIMEOUT_MS = 5000
const CONCURRENCY = 20
const FEED_PATHS = ['/rss.xml', '/feed/', '/feed.xml', '/atom.xml', '/blog/rss.xml', '/blog/feed/', '/rss']
const INSERT_ANCHORS = ['self_signup:', 'discontinued:', 'categories:']

interface Hit {
	slug: string
	name: string
	url: string
}

async function probe(slug: string, name: string, website: string): Promise<Hit | null> {
	const base = website.endsWith('/') ? website.slice(0, -1) : website
	for (const path of FEED_PATHS) {
		const url = `${base}${path}`
		try {
			const res = await fetch(url, {
				signal: AbortSignal.timeout(TIMEOUT_MS),
				redirect: 'follow',
				headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SignageList RSS checker)' },
			})
			if (res.status === 200) {
				const ct = (res.headers.get('content-type') ?? '').toLowerCase()
				if (ct.includes('xml') || ct.includes('rss') || ct.includes('atom')) return { slug, name, url }
			}
		} catch {
			// timeout, DNS failure, connection error — try next path
		}
	}
	return null
}

export const command: Command = {
	name: 'discover-rss',
	summary: 'Find RSS/Atom feeds for products and (with --write) record rss_feed_url',
	async run(args) {
		const write = args.includes('--write')

		const candidates = loadProducts()
			.filter(({ data }) => data.website && !data.discontinued && !data.rss_feed_url)
			.map(({ slug, data }) => ({ slug, name: data.name, website: data.website }))

		log.info(`Probing ${candidates.length} products across ${FEED_PATHS.length} feed paths…\n`)

		const hits: Hit[] = []
		let checked = 0
		for (let i = 0; i < candidates.length; i += CONCURRENCY) {
			const batch = candidates.slice(i, i + CONCURRENCY)
			for (const hit of await Promise.all(batch.map((c) => probe(c.slug, c.name, c.website)))) {
				if (hit) {
					hits.push(hit)
					log.ok(`${hit.name} — ${hit.url}`)
				}
			}
			checked += batch.length
			process.stderr.write(`  …checked ${checked}/${candidates.length}\n`)
		}

		log.step(`Discovered ${hits.length} feed(s)`)
		if (hits.length === 0 || !write) {
			if (!write && hits.length > 0) log.info('Run with --write to record these as rss_feed_url.')
			return
		}

		let updated = 0
		for (const hit of hits) {
			const { text } = readProductText(hit.slug)
			if (text.includes('rss_feed_url:')) continue
			const next = insertLineBefore(text, `rss_feed_url: ${hit.url}`, INSERT_ANCHORS)
			if (!next) {
				log.fail(`${hit.slug} — no insertion point`)
				continue
			}
			writeProductText(hit.slug, next)
			updated++
		}
		log.done(`${updated} file(s) updated`)
	},
}
