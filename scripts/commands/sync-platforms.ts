import type { Command } from '../lib/command'
import { log } from '../lib/log'
import { loadProducts, readProductText, writeProductText } from '../lib/products'
import { addToSequence } from '../lib/yaml'

const ANDROID = 'Android'
const FIRE_OS = 'Fire OS'

// Android and Fire OS are effectively the same runtime target: any product that
// lists one should list the other. This keeps that pair symmetric across all files.
export const command: Command = {
	name: 'sync-platforms',
	summary: 'Ensure Android ↔ Fire OS platform symmetry across products',
	run(args) {
		const write = args.includes('--write')
		let changed = 0

		for (const { slug, data } of loadProducts()) {
			const hasAndroid = data.platforms.includes(ANDROID)
			const hasFireOs = data.platforms.includes(FIRE_OS)
			if (hasAndroid === hasFireOs) continue

			const missing = hasAndroid ? FIRE_OS : ANDROID
			const { text } = readProductText(slug)
			const updated = addToSequence(text, 'platforms', missing, { sort: true })
			if (!updated) continue

			changed++
			if (write) {
				writeProductText(slug, updated)
				log.ok(`${slug} — added "${missing}"`)
			} else {
				log.info(`  would add "${missing}" to ${slug}`)
			}
		}

		log.done(write ? `${changed} file(s) updated` : `${changed} file(s) would change (run with --write to apply)`)
	},
}
