#!/usr/bin/env bun
import { command as add } from './commands/add'
import { command as check } from './commands/check'
import { command as checkUrls } from './commands/check-urls'
import { command as discoverRss } from './commands/discover-rss'
import { command as fetchFeeds } from './commands/fetch-feeds'
import { command as genOg } from './commands/gen-og'
import { command as genTerms } from './commands/gen-terms'
import { command as syncAmazon } from './commands/sync-amazon'
import { command as syncPlatforms } from './commands/sync-platforms'
import type { Command } from './lib/command'
import { ProductError } from './lib/products'

const commands: Command[] = [check, add, genOg, genTerms, syncPlatforms, syncAmazon, discoverRss, fetchFeeds, checkUrls]

const registry = new Map(commands.map((c) => [c.name, c]))

function printHelp(): void {
	console.log('SignageList data CLI\n\nUsage: bun run cli <command> [options]\n\nCommands:')
	const width = Math.max(...commands.map((c) => c.name.length))
	for (const c of commands) console.log(`  ${c.name.padEnd(width)}  ${c.summary}`)
	console.log(
		'\nMutating commands (sync-platforms, sync-amazon, discover-rss) are dry-run by default; pass --write to apply.',
	)
}

const [cmd, ...args] = process.argv.slice(2)

if (!cmd || cmd === 'help' || cmd === '--help' || cmd === '-h') {
	printHelp()
	process.exit(0)
}

const command = registry.get(cmd)
if (!command) {
	console.error(`Unknown command: ${cmd}\n`)
	printHelp()
	process.exit(1)
}

try {
	await command.run(args)
} catch (err) {
	if (err instanceof ProductError) {
		console.error(`\n${err.message}`)
		process.exit(1)
	}
	throw err
}
