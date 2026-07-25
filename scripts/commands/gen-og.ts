import { existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import sharp from 'sharp'
import type { Command } from '../lib/command'
import { log } from '../lib/log'
import { PATHS } from '../lib/paths'
import { loadProducts } from '../lib/products'

const OG_VERSION = 'v1'
const W = 1200
const H = 630
const TEXT_W = 880

const DIRS = {
	products: join(PATHS.og, 'products'),
	categories: join(PATHS.og, 'categories'),
	platforms: join(PATHS.og, 'platforms'),
	pages: join(PATHS.og, 'pages'),
}

function slugify(str: string): string {
	return str
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '')
}

function wrapText(text: string, charsPerLine: number): string[] {
	const words = text.split(' ')
	const lines: string[] = []
	let current = ''
	for (const word of words) {
		const candidate = current ? `${current} ${word}` : word
		if (candidate.length <= charsPerLine) {
			current = candidate
		} else {
			if (current) lines.push(current)
			current = word
		}
	}
	if (current) lines.push(current)
	return lines
}

function escapeXml(str: string): string {
	return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

async function generateOg(dir: string, slug: string, name: string, description: string): Promise<boolean> {
	const outPath = join(dir, `${OG_VERSION}-${slug}.png`)
	if (existsSync(outPath)) return false

	const titleSizes = [80, 68, 56, 46, 38]
	let titleSize = titleSizes[0]
	let titleLines: string[] = []
	for (const size of titleSizes) {
		titleSize = size
		const charsPerLine = Math.floor(TEXT_W / (size * 0.52))
		const lines = wrapText(name, charsPerLine)
		if (lines.length <= 2) {
			titleLines = lines
			break
		}
		titleLines = lines
	}

	const descSize = 30
	const descLines = wrapText(description, Math.floor(TEXT_W / (descSize * 0.52))).slice(0, 2)

	const titleLineH = titleSize * 1.25
	const descLineH = descSize * 1.5
	const gap = 14

	const totalH = titleLines.length * titleLineH + gap + descLines.length * descLineH
	const startY = (H - totalH) / 2 + titleSize * 0.85
	const lx = 60

	const titleSvg = titleLines
		.map(
			(line, i) =>
				`<text x="${lx}" y="${startY + i * titleLineH}" text-anchor="start"
			font-family="Helvetica Neue, Helvetica, Arial, sans-serif"
			font-weight="700" font-size="${titleSize}" fill="#0a0a0a"
		>${escapeXml(line)}</text>`,
		)
		.join('\n')

	const descY = startY + titleLines.length * titleLineH + gap
	const descSvg = descLines
		.map(
			(line, i) =>
				`<text x="${lx}" y="${descY + i * descLineH}" text-anchor="start"
			font-family="Helvetica Neue, Helvetica, Arial, sans-serif"
			font-weight="400" font-size="${descSize}" fill="#737373"
		>${escapeXml(line)}</text>`,
		)
		.join('\n')

	const urlSvg = `<text x="${lx}" y="${H - 85}" text-anchor="start"
		font-family="Helvetica Neue, Helvetica, Arial, sans-serif"
		font-weight="400" font-size="26" fill="#a3a3a3"
	>signagelist.org</text>`

	const taglineSvg = `<text x="${W - lx}" y="85" text-anchor="end"
		font-family="Helvetica Neue, Helvetica, Arial, sans-serif"
		font-weight="400" font-size="20" fill="#a3a3a3"
	>Open directory of digital signage products</text>`

	const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
${titleSvg}
${descSvg}
${urlSvg}
${taglineSvg}
</svg>`

	await sharp(PATHS.ogBackground)
		.resize(W, H)
		.composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
		.png()
		.toFile(outPath)

	log.ok(outPath)
	return true
}

export const command: Command = {
	name: 'gen-og',
	summary: 'Generate missing Open Graph images for products, taxonomies, and pages',
	async run() {
		for (const dir of Object.values(DIRS)) mkdirSync(dir, { recursive: true })

		let generated = 0
		const gen = async (dir: string, slug: string, name: string, description: string) => {
			if (await generateOg(dir, slug, name, description)) generated++
		}

		const products = loadProducts().map((p) => p.data)

		for (const p of products) {
			await gen(DIRS.products, p.slug, p.name, p.description)
		}

		const categoryCount: Record<string, number> = {}
		const platformCount: Record<string, number> = {}
		for (const p of products) {
			for (const c of p.categories) categoryCount[c] = (categoryCount[c] ?? 0) + 1
			for (const pl of p.platforms) platformCount[pl] = (platformCount[pl] ?? 0) + 1
		}

		for (const [name, count] of Object.entries(categoryCount)) {
			await gen(
				DIRS.categories,
				`category-${slugify(name)}`,
				name,
				`Browse and compare ${count}+ digital signage products in the ${name} category.`,
			)
		}
		await gen(
			DIRS.pages,
			'page-categories',
			'Categories',
			`Browse ${Object.keys(categoryCount).length} digital signage software categories — compare CMS, content providers, and more.`,
		)

		for (const [name, count] of Object.entries(platformCount)) {
			await gen(
				DIRS.platforms,
				`platform-${slugify(name)}`,
				name,
				`Browse ${count}+ digital signage products with native support for ${name}.`,
			)
		}
		await gen(
			DIRS.pages,
			'page-platforms',
			'Platforms',
			'Browse digital signage software by supported platform — Android, Windows, ChromeOS, BrightSign, and more.',
		)

		await gen(
			DIRS.pages,
			'page-about',
			'About SignageList',
			`The open, vendor-neutral directory of ${products.length}+ digital signage software products. No ads, no bias.`,
		)
		await gen(
			DIRS.pages,
			'page-free',
			'Free & Freemium Digital Signage',
			'Browse digital signage software with no upfront cost — open source, freemium, and free-to-use products.',
		)
		await gen(
			DIRS.pages,
			'page-news',
			'Industry News',
			'Latest updates from digital signage companies and industry publications.',
		)

		log.done(`Done — ${generated} generated, existing images skipped`)
	},
}
