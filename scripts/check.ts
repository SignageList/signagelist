#!/usr/bin/env bun

/**
 * Validates all YAML product files against the normalized Zod schema.
 */

import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import * as yaml from 'js-yaml'
import { ProductSchema } from './lib/schema'

const productsDir = join(import.meta.dir, '..', 'data', 'products')

const yamlFiles = readdirSync(productsDir).filter((f) => f.endsWith('.yaml'))

console.log(`Validating ${yamlFiles.length} YAML product files...\n`)

let valid = 0
let invalid = 0

for (const file of yamlFiles) {
	const slug = file.replace('.yaml', '')
	const filePath = join(productsDir, file)

	try {
		const raw = yaml.load(readFileSync(filePath, 'utf-8'))
		const result = ProductSchema.safeParse(raw)

		if (result.success) {
			// Verify slug matches filename
			if (result.data.slug !== slug) {
				console.error(`MISMATCH ${file}: slug "${result.data.slug}" does not match filename "${slug}"`)
				invalid++
			} else {
				valid++
			}
		} else {
			console.error(`INVALID ${file}:`)
			for (const issue of result.error.issues) {
				console.error(`  - ${issue.path.join('.')}: ${issue.message}`)
			}
			invalid++
		}
	} catch (err) {
		console.error(`ERROR ${file}: ${err}`)
		invalid++
	}
}

console.log(`\nResults: ${valid} valid, ${invalid} invalid out of ${yamlFiles.length} files`)

if (invalid > 0) {
	process.exit(1)
}
