import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Command } from '../lib/command'
import { log } from '../lib/log'
import { PATHS } from '../lib/paths'
import { loadProducts } from '../lib/products'

// Hugo's slugification: lowercase, spaces → hyphens, strip non-alphanumeric.
function slugify(str: string): string {
	return str
		.toLowerCase()
		.replace(/\s+/g, '-')
		.replace(/[^a-z0-9-]/g, '')
}

function frontmatter(title: string, type: 'category' | 'platform'): string {
	const noun = type === 'category' ? 'category' : 'platform'
	return `---
title: "${title}"
seo_title: "Best ${title} Digital Signage Software"
description: "Compare and explore digital signage products in the ${title} ${noun}. Find the right solution for your needs."
---
`
}

function ensureTermFile(taxonomy: string, title: string, type: 'category' | 'platform'): boolean {
	const file = join(PATHS.content, taxonomy, slugify(title), '_index.md')
	if (existsSync(file)) return false
	mkdirSync(join(PATHS.content, taxonomy, slugify(title)), { recursive: true })
	writeFileSync(file, frontmatter(title, type))
	return true
}

export const command: Command = {
	name: 'gen-terms',
	summary: 'Create missing taxonomy term pages for categories and platforms',
	run() {
		const categories = new Set<string>()
		const platforms = new Set<string>()
		for (const { data } of loadProducts()) {
			for (const c of data.categories) categories.add(c)
			for (const p of data.platforms) platforms.add(p)
		}

		let created = 0

		log.step(`Categories (${categories.size} found):`)
		for (const c of [...categories].sort()) {
			if (ensureTermFile('categories', c, 'category')) {
				created++
				log.ok(`content/categories/${slugify(c)}/_index.md`)
			}
		}

		log.step(`Platforms (${platforms.size} found):`)
		for (const p of [...platforms].sort()) {
			if (ensureTermFile('platforms', p, 'platform')) {
				created++
				log.ok(`content/platforms/${slugify(p)}/_index.md`)
			}
		}

		log.done(`${created} file(s) created.`)
	},
}
