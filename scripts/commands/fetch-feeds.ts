import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { XMLParser } from 'fast-xml-parser'
import type { Command } from '../lib/command'
import { log } from '../lib/log'
import { PATHS } from '../lib/paths'
import { loadProducts } from '../lib/products'

const TIMEOUT_MS = 8000
const CONCURRENCY = 15
const MAX_ITEMS_PRODUCT = 10
const MAX_ITEMS_INDUSTRY = 15

const INDUSTRY_FEEDS = [
	{ slug: 'sixteennine', name: 'Sixteen:Nine', url: 'https://feeds2.feedburner.com/Sixteennine-TheDigitalSignageBlog' },
	{ slug: 'dailydooh', name: 'DailyDOOH', url: 'http://www.dailydooh.com/feed' },
]

interface FeedItem {
	title: string
	link: string
	date: string
	description: string
}
interface FeedCache {
	source: string
	fetched_at: string
	items: FeedItem[]
}

const xmlParser = new XMLParser({
	ignoreAttributes: false,
	attributeNamePrefix: '-',
	textNodeName: '#text',
	isArray: (tagName) => tagName === 'item' || tagName === 'entry',
})

function plainify(html: string): string {
	return html
		.replace(/<[^>]*>/g, ' ')
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&nbsp;/g, ' ')
		.replace(/\s+/g, ' ')
		.trim()
}

function truncate(str: string, max: number): string {
	return str.length <= max ? str : `${str.slice(0, max - 1)}…`
}

function parseDate(raw: unknown): string {
	if (!raw) return ''
	try {
		const d = new Date(typeof raw === 'string' ? raw : String(raw))
		if (!Number.isNaN(d.getTime())) return d.toISOString()
	} catch {}
	return ''
}

function getText(val: unknown): string {
	if (!val) return ''
	if (typeof val === 'string') return val
	if (typeof val === 'object' && val !== null) {
		const obj = val as Record<string, unknown>
		if ('#text' in obj) return String(obj['#text'])
	}
	return String(val)
}

function getLink(val: unknown): string {
	if (!val) return ''
	if (typeof val === 'string') return val
	if (Array.isArray(val)) {
		for (const item of val) {
			const link = getLink(item)
			if (link) return link
		}
		return ''
	}
	if (typeof val === 'object' && val !== null) {
		const obj = val as Record<string, unknown>
		if (obj['-href']) return String(obj['-href'])
		if (obj['#text']) return String(obj['#text'])
	}
	return ''
}

function parseFeed(xml: string, maxItems: number): FeedItem[] | null {
	let parsed: Record<string, unknown>
	try {
		parsed = xmlParser.parse(xml) as Record<string, unknown>
	} catch {
		return null
	}

	let rawItems: unknown[] = []
	const rss = parsed.rss as Record<string, unknown> | undefined
	if (rss?.channel) {
		const items = (rss.channel as Record<string, unknown>).item
		rawItems = Array.isArray(items) ? items : items ? [items] : []
	}
	const feed = parsed.feed as Record<string, unknown> | undefined
	if (feed) {
		const entries = feed.entry
		rawItems = Array.isArray(entries) ? entries : entries ? [entries] : []
	}

	const items: FeedItem[] = []
	for (const raw of rawItems.slice(0, maxItems)) {
		const r = raw as Record<string, unknown>
		const title = getText(r.title)
		if (!title) continue
		const link = getLink(r.link) || getText(r.guid) || ''
		const date = parseDate(r.pubDate ?? r.published ?? r.updated)
		const rawDesc = r.description ?? r.summary ?? r['content:encoded'] ?? r.content
		const description = rawDesc ? truncate(plainify(getText(rawDesc)), 200) : ''
		items.push({ title, link, date, description })
	}
	return items
}

async function fetchFeed(url: string, maxItems: number): Promise<FeedItem[] | null> {
	try {
		const res = await fetch(url, {
			signal: AbortSignal.timeout(TIMEOUT_MS),
			redirect: 'follow',
			headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SignageList/1.0 feed fetcher)' },
		})
		if (!res.ok) return null
		return parseFeed(await res.text(), maxItems)
	} catch {
		return null
	}
}

function loadCache(path: string): FeedItem[] {
	if (!existsSync(path)) return []
	try {
		return (JSON.parse(readFileSync(path, 'utf-8')) as FeedCache).items ?? []
	} catch {
		return []
	}
}

function mergeItems(existing: FeedItem[], fresh: FeedItem[]): FeedItem[] {
	const seen = new Set(existing.map((i) => i.link || i.title))
	const merged = [...existing]
	for (const item of fresh) {
		const key = item.link || item.title
		if (!seen.has(key)) {
			seen.add(key)
			merged.push(item)
		}
	}
	return merged.sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0))
}

export const command: Command = {
	name: 'fetch-feeds',
	summary: 'Fetch and cache product + industry RSS feeds into data/feeds',
	async run() {
		mkdirSync(PATHS.feedsProducts, { recursive: true })
		mkdirSync(PATHS.feedsIndustry, { recursive: true })
		const now = new Date().toISOString()

		log.step('Fetching industry feeds')
		for (const feed of INDUSTRY_FEEDS) {
			const outPath = join(PATHS.feedsIndustry, `${feed.slug}.json`)
			const fresh = await fetchFeed(feed.url, MAX_ITEMS_INDUSTRY)
			if (fresh && fresh.length > 0) {
				const items = mergeItems(loadCache(outPath), fresh)
				writeFileSync(outPath, JSON.stringify({ source: feed.name, fetched_at: now, items }, null, 2))
				log.ok(`${feed.name}: ${items.length} total (${fresh.length} fetched)`)
			} else {
				log.warn(`${feed.name} — keeping existing cache`)
			}
		}

		const products = loadProducts()
			.map((p) => p.data)
			.filter((p) => p.rss_feed_url && !p.discontinued)

		log.step(`Fetching ${products.length} product feeds`)
		let ok = 0
		let fail = 0
		for (let i = 0; i < products.length; i += CONCURRENCY) {
			const batch = products.slice(i, i + CONCURRENCY)
			await Promise.all(
				batch.map(async (product) => {
					const outPath = join(PATHS.feedsProducts, `${product.slug}.json`)
					const fresh = await fetchFeed(product.rss_feed_url as string, MAX_ITEMS_PRODUCT)
					if (fresh && fresh.length > 0) {
						const items = mergeItems(loadCache(outPath), fresh)
						writeFileSync(outPath, JSON.stringify({ source: product.name, fetched_at: now, items }, null, 2))
						ok++
					} else {
						if (fresh === null) log.fail(product.slug)
						fail++
					}
				}),
			)
			process.stderr.write(`  progress: ${Math.min(i + CONCURRENCY, products.length)}/${products.length}\n`)
		}

		log.done(`Products: ${ok} fetched, ${fail} failed/empty. Industry: ${INDUSTRY_FEEDS.length}.`)
	},
}
