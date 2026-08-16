import type { FilterEngine, FilterState } from './filter'

/*
	URL sync for the homepage list. Kept separate from url-sync.ts because the two
	pages start from different defaults: /products/ opens on the CMS category with
	both licence checkboxes ticked, the homepage opens with nothing selected. Here
	only non-default values are written, so an unfiltered homepage keeps a clean URL
	and a shared link carries exactly the filters the user turned on.
*/

/** URL param name paired with the FilterState key it drives. */
const BOOLEAN_PARAMS: Array<[string, keyof FilterState]> = [
	['openSource', 'showOpenSource'],
	['proprietary', 'showProprietary'],
	['free', 'showFreeOnly'],
	['freeTrial', 'showFreeTrialOnly'],
	['freemium', 'showFreemiumOnly'],
	['discontinued', 'showDiscontinuedOnly'],
	['hideDiscontinued', 'hideDiscontinued'],
	['signupIsOpenOnly', 'signupIsOpenOnly'],
]

const LIST_PARAMS: Array<[string, keyof FilterState]> = [
	['platforms', 'selectedPlatforms'],
	['hq', 'selectedHQ'],
]

export interface ParsedHomeUrl {
	state: Partial<FilterState>
	page: number
}

/** Reads a query string into the filter state it encodes. Unknown and malformed params are ignored. */
export function parseHomeUrl(search: string): ParsedHomeUrl {
	const params = new URLSearchParams(search)
	const state: Record<string, unknown> = {}

	const term = params.get('search')
	if (term) state.searchTerm = term

	for (const [param, key] of BOOLEAN_PARAMS) {
		if (params.get(param) === 'true') state[key] = true
	}

	for (const [param, key] of LIST_PARAMS) {
		const values = (params.get(param) || '')
			.split(',')
			.map((value) => value.trim())
			.filter(Boolean)
		if (values.length > 0) state[key] = values
	}

	const page = Number.parseInt(params.get('page') || '', 10)

	return {
		state: state as Partial<FilterState>,
		page: Number.isNaN(page) || page < 1 ? 1 : page,
	}
}

/** Every param this module owns. Anything else in the URL is left alone. */
const OWNED_PARAMS = new Set([
	'search',
	'page',
	...BOOLEAN_PARAMS.map(([param]) => param),
	...LIST_PARAMS.map(([param]) => param),
])

/**
 * Builds the query string for a state, including the leading "?". Returns "" when nothing is filtered.
 * Params from `preserve` that this module does not own are carried through, so filtering does not
 * strip campaign tags off a link someone followed to get here.
 */
export function buildHomeUrl(state: FilterState, page = 1, preserve = ''): string {
	const params = new URLSearchParams()

	for (const [key, value] of new URLSearchParams(preserve)) {
		if (!OWNED_PARAMS.has(key)) params.append(key, value)
	}

	if (state.searchTerm) params.set('search', state.searchTerm)

	for (const [param, key] of BOOLEAN_PARAMS) {
		if (state[key]) params.set(param, 'true')
	}

	for (const [param, key] of LIST_PARAMS) {
		const values = state[key] as string[]
		if (values.length > 0) params.set(param, values.join(','))
	}

	if (page > 1) params.set('page', String(page))

	const query = params.toString()
	return query ? `?${query}` : ''
}

export function initHomeUrlSync(engine: FilterEngine, onRestore?: () => void): void {
	const { state, page } = parseHomeUrl(window.location.search)

	if (Object.keys(state).length > 0) {
		engine.setState(state)
		syncControlsFromState(engine)
		onRestore?.()
	}

	// setState resets to page 1, so the page is restored after it
	if (page > 1) {
		engine.setPage(Math.min(page, engine.getPageInfo().total))
	}

	const listPath = window.location.pathname

	engine.onChange(() => {
		// The product modal swaps the URL for the product's own path while it is open.
		// Leave it alone until it closes, rather than stamping filters onto that URL.
		if (window.location.pathname !== listPath) return
		const query = buildHomeUrl(engine.getState(), engine.getPageInfo().current, window.location.search)
		window.history.replaceState({}, '', `${listPath}${query}`)
	})
}

function syncControlsFromState(engine: FilterEngine): void {
	const state = engine.getState()

	const searchInput = document.querySelector<HTMLInputElement>('#search-input')
	if (searchInput) searchInput.value = state.searchTerm

	for (const cb of document.querySelectorAll<HTMLInputElement>('#hide-discontinued, #hide-discontinued-mobile')) {
		cb.checked = state.hideDiscontinued
	}

	for (const cb of document.querySelectorAll<HTMLInputElement>('[data-platform-checkbox]')) {
		cb.checked = state.selectedPlatforms.includes(cb.dataset.platformCheckbox || '')
	}

	for (const cb of document.querySelectorAll<HTMLInputElement>('[data-hq-checkbox]')) {
		cb.checked = state.selectedHQ.includes(cb.dataset.hqCheckbox || '')
	}
}
