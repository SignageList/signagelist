import { z } from 'zod'

const ProductCategorySchema = z.enum(['CMS', 'Content provider', 'Computer vision'])

const DeliverySchema = z.enum(['cloud', 'on-premise', 'hybrid', 'self-hosted'])

const PaymentModelSchema = z.enum(['subscription', 'one-time', 'pay-as-you-go', 'free'])

const BillingBasisSchema = z.enum(['per_device', 'per_user', 'per_location', 'flat_rate'])

const PricingSchema = z.object({
	name: z.string(),
	payment_model: PaymentModelSchema,
	billing_basis: BillingBasisSchema,
	monthly: z.number().nullable(),
	yearly: z.number().nullable(),
	price: z.number().nullable().optional(),
	included_screens: z.number().int().nullable().default(null),
	overage_per_screen: z.number().nullable().default(null),
	max_screens: z.number().int().nullable().default(null),
})

const ModelSchema = z.object({
	delivery: DeliverySchema,
	free_trial: z.boolean(),
	pricing_available: z.boolean(),
	has_freemium: z.boolean(),
	pricing: z.array(PricingSchema),
})

const ScreensStatSchema = z.object({
	total: z.number(),
	source: z.string(),
	date: z.string(),
})

const StatsSchema = z
	.object({
		screens: ScreensStatSchema.optional(),
	})
	.default({})

/*
	Third-party review sites. `url` is the product's page on that site; the rating and
	review count are a snapshot, so `retrieved` records when they were read. Ratings go
	stale, and a figure with no date on it is worse than no figure.
*/
const ReviewSourceSchema = z.object({
	url: z.string().url(),
	rating: z.number().min(0).max(5).nullable().default(null),
	review_count: z.number().int().nonnegative().nullable().default(null),
	retrieved: z.string().nullable().default(null),
})

const ReviewsSchema = z
	.object({
		g2: ReviewSourceSchema.optional(),
		capterra: ReviewSourceSchema.optional(),
		gartner: ReviewSourceSchema.optional(),
	})
	.default({})

// Keep in sync with data/compliance.yaml, which holds labels and display order.
export const COMPLIANCE_KEYS = [
	'soc2',
	'soc1',
	'soc3',
	'iso27001',
	'iso27017',
	'iso27018',
	'iso27701',
	'iso42001',
	'iso9001',
	'iso14001',
	'iso22301',
	'hipaa',
	'gdpr',
	'ccpa',
	'pci_dss',
	'fedramp',
	'stateramp',
	'cmmc',
	'cyber_essentials',
	'cyber_essentials_plus',
	'csa_star',
	'tisax',
	'ens',
	'cra',
	'vpat',
	'section_508',
	'wcag',
] as const

// certified: an audited certificate or attestation is held (SOC reports, ISO certificates, Cyber Essentials, ...)
// compliant: the vendor declares compliance with a law or framework that has no certificate (GDPR, HIPAA, CCPA, ...)
// in_progress: the vendor says an audit or programme is under way
// not_held: the vendor explicitly says it does not hold it
export const CLAIM_STATUSES = ['certified', 'compliant', 'in_progress', 'not_held'] as const

const ComplianceClaimSchema = z
	.object({
		status: z.enum(CLAIM_STATUSES),
		// Free text qualifier: "Type II", "BAA offered", "Held by parent company Navori"
		detail: z.string().optional(),
		// Vendor page that states the claim
		source: z.string().url(),
		// When the source was last checked, YYYY-MM
		checked: z
			.string()
			.regex(/^\d{4}-\d{2}$/)
			.optional(),
	})
	.strict()

const ComplianceSchema = z.partialRecord(z.enum(COMPLIANCE_KEYS), ComplianceClaimSchema).default({})

const ProductSchema = z
	.object({
		// Identity
		name: z.string(),
		slug: z.string(),
		description: z.string(),
		website: z.string().url(),
		year_founded: z.number().nullable(),
		headquarters: z.array(z.string()),
		open_source: z.boolean(),
		license: z.string().nullable().default(null),
		source_code_url: z.string().url().nullable().default(null),
		rss_feed_url: z.string().url().nullable().default(null),
		has_api: z.boolean().default(false),
		developer_portal_url: z.string().url().nullable().default(null),
		has_docs: z.boolean().default(false),
		docs_url: z.string().url().nullable().default(null),
		has_cli: z.boolean().default(false),
		has_mcp: z.boolean().default(false),
		has_sso: z.boolean().default(false),
		has_saml: z.boolean().default(false),
		self_signup: z.boolean(),
		discontinued: z.boolean(),
		// Taxonomies
		categories: z.array(ProductCategorySchema),
		platforms: z.array(z.string()),

		// Pricing
		models: z.array(ModelSchema),

		// Stats
		stats: StatsSchema,

		// Compliance
		compliance: ComplianceSchema,

		// Third-party reviews
		reviews: ReviewsSchema,

		// Notes
		notes: z.array(z.string()).default([]),

		// Future G2-like fields
		features: z.array(z.string()).default([]),
		integrations: z.array(z.string()).default([]),
		target_audience: z.array(z.string()).default([]),
		deployment_options: z.array(z.string()).default([]),
		support_channels: z.array(z.string()).default([]),
		languages: z.array(z.string()).default([]),
		screenshots: z.array(z.string()).default([]),
		last_verified: z.string().nullable().default(null),
	})
	.refine((data) => !data.has_docs || data.docs_url !== null, {
		message: 'docs_url is required when has_docs is true',
		path: ['docs_url'],
	})

export { ProductSchema, ProductCategorySchema, ModelSchema, PricingSchema, ReviewsSchema, ReviewSourceSchema }

export type Product = z.infer<typeof ProductSchema>
export type ProductCategory = z.infer<typeof ProductCategorySchema>
export type Model = z.infer<typeof ModelSchema>
export type Pricing = z.infer<typeof PricingSchema>
export type Reviews = z.infer<typeof ReviewsSchema>
export type ReviewSource = z.infer<typeof ReviewSourceSchema>
