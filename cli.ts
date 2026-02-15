#!/usr/bin/env bun
import { spawn } from 'node:child_process'

const commands: Record<string, string> = {
	add: 'scripts/add-product.ts',
	check: 'scripts/check.ts',
}

function printHelp(): void {
	console.log('Usage: bun run cli.ts <command>\n\nAvailable commands:')
	for (const cmd of Object.keys(commands)) {
		console.log(`  ${cmd}`)
	}
}

const [, , cmd, ...args] = process.argv

if (!cmd || cmd === 'help' || cmd === '--help' || cmd === '-h') {
	printHelp()
	process.exit(0)
}

if (!commands[cmd]) {
	console.error(`Unknown command: ${cmd}\n`)
	printHelp()
	process.exit(1)
}

const child = spawn('bun', ['run', commands[cmd], ...args], { stdio: 'inherit' })
child.on('exit', (code: number | null) => process.exit(code ?? 0))
