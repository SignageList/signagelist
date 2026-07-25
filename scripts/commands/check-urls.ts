import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Command } from '../lib/command'
import { log } from '../lib/log'
import { PATHS } from '../lib/paths'
import { loadProducts } from '../lib/products'

const CONCURRENCY = 30
const TIMEOUT_MS = 10_000

type Category = 'ok' | 'blocked' | 'redirect' | 'dead' | 'skip'
interface Result {
	slug: string
	name: string
	url: string
	status: number | null
	category: Category
	detail: string
}

function detectBlocker(status: number, headers: Headers): string | null {
	if (headers.get('cf-ray') || headers.get('server')?.toLowerCase().includes('cloudflare')) return 'Cloudflare'
	if (headers.get('server')?.toLowerCase().includes('ddos-guard')) return 'DDoS-Guard'
	if (headers.get('x-sucuri-id')) return 'Sucuri'
	if (status === 403) return 'Blocked (403)'
	if (status === 429) return 'Rate limited (429)'
	if (status === 503) return 'Blocked (503)'
	return null
}

async function checkUrl(slug: string, name: string, url: string): Promise<Result> {
	const base = { slug, name, url }
	try {
		const res = await fetch(url, {
			method: 'HEAD',
			redirect: 'manual',
			signal: AbortSignal.timeout(TIMEOUT_MS),
			headers: {
				'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36',
				Accept: 'text/html',
			},
		})
		const { status } = res
		if (status >= 301 && status <= 308) {
			return { ...base, status, category: 'redirect', detail: `→ ${res.headers.get('location') ?? ''}` }
		}
		if (status === 200 || status === 201 || status === 202) return { ...base, status, category: 'ok', detail: 'OK' }
		const blocker = detectBlocker(status, res.headers)
		if (blocker) return { ...base, status, category: 'blocked', detail: blocker }
		if (status >= 400) return { ...base, status, category: 'dead', detail: `HTTP ${status}` }
		return { ...base, status, category: 'ok', detail: `HTTP ${status}` }
	} catch (err: unknown) {
		const msg = err instanceof Error ? err.message : String(err)
		const detail =
			msg.includes('timed out') || msg.includes('TimeoutError')
				? 'Timeout'
				: msg.includes('ENOTFOUND') || msg.includes('getaddrinfo')
					? 'DNS failure'
					: msg.includes('ECONNREFUSED')
						? 'Connection refused'
						: msg.includes('certificate') || msg.includes('SSL')
							? 'SSL error'
							: `Error: ${msg.slice(0, 80)}`
		return { ...base, status: null, category: 'dead', detail }
	}
}

export const command: Command = {
	name: 'check-urls',
	summary: 'Check product website URLs for dead links and bot blocks',
	async run() {
		const tasks: { slug: string; name: string; url: string }[] = []
		const skipped: Result[] = []
		for (const { slug, data } of loadProducts()) {
			if (!data.website) {
				skipped.push({ slug, name: data.name, url: '', status: null, category: 'skip', detail: 'No website' })
			} else if (data.discontinued) {
				skipped.push({
					slug,
					name: data.name,
					url: data.website,
					status: null,
					category: 'skip',
					detail: 'Discontinued',
				})
			} else {
				tasks.push({ slug, name: data.name, url: data.website })
			}
		}

		log.info(`Checking ${tasks.length} URLs with concurrency ${CONCURRENCY}…\n`)

		const results: Result[] = []
		let done = 0
		for (let i = 0; i < tasks.length; i += CONCURRENCY) {
			const batch = tasks.slice(i, i + CONCURRENCY)
			results.push(...(await Promise.all(batch.map((t) => checkUrl(t.slug, t.name, t.url)))))
			done += batch.length
			process.stdout.write(`\r${done}/${tasks.length}`)
		}
		console.log('\n')

		const by = (c: Category) => results.filter((r) => r.category === c)
		const ok = by('ok')
		const blocked = by('blocked')
		const redirects = by('redirect')
		const dead = by('dead')

		const pad = (s: string, n: number) => s.slice(0, n).padEnd(n)
		const lines: string[] = ['URL Health Report', `Generated: ${new Date().toISOString()}`]
		lines.push(
			`Checked: ${tasks.length} | OK: ${ok.length} | Blocked: ${blocked.length} | Redirects: ${redirects.length} | Dead: ${dead.length} | Skipped: ${skipped.length}`,
			'',
		)

		const section = (title: string, items: Result[]) => {
			if (!items.length) return
			lines.push('─'.repeat(80), `${title} (${items.length})`, '─'.repeat(80))
			for (const r of items.sort((a, b) => a.name.localeCompare(b.name))) {
				lines.push(
					`${pad(r.status != null ? String(r.status) : '   ', 4)} ${pad(r.name, 35)} ${pad(r.detail, 25)} ${r.url}`,
				)
			}
			lines.push('')
		}
		section('DEAD', dead)
		section('BLOCKED / BOT PROTECTION', blocked)
		section('REDIRECTS', redirects)
		section('OK', ok)
		section('SKIPPED', skipped)

		const out = lines.join('\n')
		const outFile = join(PATHS.root, 'url-report.txt')
		writeFileSync(outFile, out)
		console.log(out)
		log.done(`Saved to ${outFile}`)
	},
}
