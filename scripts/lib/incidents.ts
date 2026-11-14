import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { z } from 'zod'
import { PATHS } from './paths'
import { loadYaml } from './yaml'

export const INCIDENT_TYPES = [
	'hijack',
	'ransomware',
	'malware',
	'vulnerability',
	'research',
	'breach',
	'insider',
	'outage',
] as const

export const INCIDENT_SECTORS = [
	'airport',
	'rail',
	'transit',
	'road sign',
	'billboard',
	'retail',
	'restaurant',
	'stadium',
	'education',
	'healthcare',
	'hospitality',
	'government',
	'corporate',
	'vendor',
	'other',
] as const

const IncidentSourceSchema = z
	.object({
		url: z.string().url(),
		publisher: z.string().optional(),
		title: z.string().optional(),
	})
	.strict()

export const IncidentSchema = z
	.object({
		// YYYY, YYYY-MM or YYYY-MM-DD, as precise as the sources allow
		date: z.string().regex(/^\d{4}(-\d{2}(-\d{2})?)?$/),
		title: z.string().min(10).max(120),
		location: z.string(),
		country: z.string(),
		sector: z.enum(INCIDENT_SECTORS),
		type: z.enum(INCIDENT_TYPES),
		summary: z.string().min(40),
		products: z.array(z.string()).default([]),
		cve: z.array(z.string().regex(/^CVE-\d{4}-\d{4,}$/)).default([]),
		// Slugs of SignageList products the incident concerns
		related_products: z.array(z.string()).default([]),
		sources: z.array(IncidentSourceSchema).min(1),
	})
	.strict()

export type Incident = z.infer<typeof IncidentSchema>

export const INCIDENTS_DIR = join(PATHS.root, 'data', 'incidents')

export interface ParsedIncident {
	slug: string
	data?: Incident
	issues: string[]
}

/** Parse and validate every incident file, collecting issues instead of throwing. */
export function parseAllIncidents(productSlugs: Set<string>): ParsedIncident[] {
	return readdirSync(INCIDENTS_DIR)
		.filter((f) => f.endsWith('.yaml'))
		.sort()
		.map((f) => {
			const slug = f.replace(/\.yaml$/, '')
			let raw: unknown
			try {
				raw = loadYaml(readFileSync(join(INCIDENTS_DIR, f), 'utf-8'))
			} catch (err) {
				return { slug, issues: [`YAML parse error: ${err instanceof Error ? err.message : String(err)}`] }
			}
			const result = IncidentSchema.safeParse(raw)
			if (!result.success) {
				return { slug, issues: result.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`) }
			}
			const issues = result.data.related_products
				.filter((p) => !productSlugs.has(p))
				.map((p) => `related_products: unknown product "${p}"`)
			if (!slug.startsWith(result.data.date.slice(0, 7))) {
				issues.push(`filename should start with the date "${result.data.date.slice(0, 7)}"`)
			}
			return { slug, data: result.data, issues }
		})
}
