import sharp from 'sharp'
import { readdirSync, readFileSync, existsSync, mkdirSync } from 'node:fs'
import yaml from 'js-yaml'

const OG_VERSION = 'v1'
const BG_PATH = 'static/og-bg.png'
const OUT_DIR = 'static/assets/og'
const DIRS = {
	products: `${OUT_DIR}/products`,
	categories: `${OUT_DIR}/categories`,
	platforms: `${OUT_DIR}/platforms`,
	pages: `${OUT_DIR}/pages`,
}

const W = 1200
const H = 630
const TEXT_W = 880

function slugify(str: string): string {
	return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
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

async function generateOg(dir: string, slug: string, name: string, description: string): Promise<'generated' | 'skipped'> {
	const outPath = `${dir}/${OG_VERSION}-${slug}.png`

	if (existsSync(outPath)) {
		return 'skipped'
	}

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

	const titleSvg = titleLines.map((line, i) =>
		`<text x="${lx}" y="${startY + i * titleLineH}" text-anchor="start"
			font-family="Helvetica Neue, Helvetica, Arial, sans-serif"
			font-weight="700" font-size="${titleSize}" fill="#0a0a0a"
		>${escapeXml(line)}</text>`
	).join('\n')

	const descY = startY + titleLines.length * titleLineH + gap
	const descSvg = descLines.map((line, i) =>
		`<text x="${lx}" y="${descY + i * descLineH}" text-anchor="start"
			font-family="Helvetica Neue, Helvetica, Arial, sans-serif"
			font-weight="400" font-size="${descSize}" fill="#737373"
		>${escapeXml(line)}</text>`
	).join('\n')

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

	await sharp(BG_PATH)
		.resize(W, H)
		.composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
		.png()
		.toFile(outPath)

	console.log(`generated  ${outPath}`)
	return 'generated'
}

// ── Setup ─────────────────────────────────────────────────────────────────────
for (const dir of Object.values(DIRS)) mkdirSync(dir, { recursive: true })

let generated = 0
let skipped = 0

async function run(dir: string, slug: string, name: string, description: string) {
	const result = await generateOg(dir, slug, name, description)
	result === 'generated' ? generated++ : skipped++
}

// ── Products ──────────────────────────────────────────────────────────────────
type Product = { name?: string; slug?: string; description?: string; categories?: string[]; platforms?: string[] }

const productFiles = readdirSync('data/products').filter((f) => f.endsWith('.yaml'))
const products: Product[] = []

for (const file of productFiles) {
	const raw = readFileSync(`data/products/${file}`, 'utf8')
	const product = yaml.load(raw) as Product
	products.push(product)
	const slug = product.slug ?? file.replace('.yaml', '')
	await run(DIRS.products, slug, product.name ?? slug, product.description ?? '')
}

// ── Taxonomy counts ───────────────────────────────────────────────────────────
const categoryCount: Record<string, number> = {}
const platformCount: Record<string, number> = {}

for (const p of products) {
	for (const c of p.categories ?? []) categoryCount[c] = (categoryCount[c] ?? 0) + 1
	for (const pl of p.platforms ?? []) platformCount[pl] = (platformCount[pl] ?? 0) + 1
}

// ── Categories ────────────────────────────────────────────────────────────────
for (const [name, count] of Object.entries(categoryCount)) {
	await run(
		DIRS.categories,
		`category-${slugify(name)}`,
		name,
		`Browse and compare ${count}+ digital signage products in the ${name} category.`,
	)
}

// Categories index
await run(
	DIRS.pages,
	'page-categories',
	'Categories',
	`Browse ${Object.keys(categoryCount).length} digital signage software categories — compare CMS, content providers, and more.`,
)

// ── Platforms ─────────────────────────────────────────────────────────────────
for (const [name, count] of Object.entries(platformCount)) {
	await run(
		DIRS.platforms,
		`platform-${slugify(name)}`,
		name,
		`Browse ${count}+ digital signage products with native support for ${name}.`,
	)
}

// Platforms index
await run(
	DIRS.pages,
	'page-platforms',
	'Platforms',
	`Browse digital signage software by supported platform — Android, Windows, ChromeOS, BrightSign, and more.`,
)

// ── Static pages ──────────────────────────────────────────────────────────────
await run(
	DIRS.pages,
	'page-about',
	'About SignageList',
	`The open, vendor-neutral directory of ${products.length}+ digital signage software products. No ads, no bias.`,
)

await run(
	DIRS.pages,
	'page-free',
	'Free & Freemium Digital Signage',
	'Browse digital signage software with no upfront cost — open source, freemium, and free-to-use products.',
)

await run(
	DIRS.pages,
	'page-news',
	'Industry News',
	'Latest updates from digital signage companies and industry publications.',
)

console.log(`\nDone — ${generated} generated, ${skipped} skipped`)
