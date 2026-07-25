import { join } from 'node:path'

// scripts/lib/paths.ts → repo root is two levels up. Using absolute paths keeps
// every command working regardless of the directory the CLI is invoked from.
const root = join(import.meta.dir, '..', '..')

export const PATHS = {
	root,
	products: join(root, 'data', 'products'),
	feeds: join(root, 'data', 'feeds'),
	feedsProducts: join(root, 'data', 'feeds', 'products'),
	feedsIndustry: join(root, 'data', 'feeds', 'industry'),
	content: join(root, 'content'),
	og: join(root, 'static', 'assets', 'og'),
	ogBackground: join(root, 'static', 'og-bg.png'),
}
