import { describe, expect, test } from 'bun:test'
import type { FilterState } from '../assets/ts/filter'
import { buildHomeUrl, parseHomeUrl } from '../assets/ts/home-url-sync'

/** Homepage defaults: nothing selected. initHomePage() clears category and both licence flags. */
function homeState(overrides: Partial<FilterState> = {}): FilterState {
	return {
		category: '',
		searchTerm: '',
		showOpenSource: false,
		showProprietary: false,
		showDiscontinuedOnly: false,
		hideDiscontinued: false,
		showFreeTrialOnly: false,
		showFreemiumOnly: false,
		showFreeOnly: false,
		selectedPlatforms: [],
		selectedHQ: [],
		selectedCompliance: [],
		selectedAuthentication: [],
		signupIsOpenOnly: false,
		...overrides,
	}
}

describe('parseHomeUrl', () => {
	test('returns an empty state for a bare URL', () => {
		const { state, page } = parseHomeUrl('')
		expect(state).toEqual({})
		expect(page).toBe(1)
	})

	test('reads the search term', () => {
		expect(parseHomeUrl('?search=kiosk').state).toEqual({ searchTerm: 'kiosk' })
	})

	test('ignores an empty search term', () => {
		expect(parseHomeUrl('?search=').state).toEqual({})
	})

	test('reads every boolean filter', () => {
		const query =
			'?openSource=true&proprietary=true&free=true&freeTrial=true&freemium=true&discontinued=true&hideDiscontinued=true&signupIsOpenOnly=true'
		expect(parseHomeUrl(query).state).toEqual({
			showOpenSource: true,
			showProprietary: true,
			showFreeOnly: true,
			showFreeTrialOnly: true,
			showFreemiumOnly: true,
			showDiscontinuedOnly: true,
			hideDiscontinued: true,
			signupIsOpenOnly: true,
		})
	})

	test('only "true" enables a boolean, so a stale false is not applied as a filter', () => {
		expect(parseHomeUrl('?openSource=false&free=1&freeTrial=yes').state).toEqual({})
	})

	test('splits list filters on commas', () => {
		expect(parseHomeUrl('?platforms=Android,Tizen&hq=usa,germany').state).toEqual({
			selectedPlatforms: ['Android', 'Tizen'],
			selectedHQ: ['usa', 'germany'],
		})
	})

	test('trims blanks out of list filters', () => {
		expect(parseHomeUrl('?platforms=Android,,%20Tizen%20,').state).toEqual({
			selectedPlatforms: ['Android', 'Tizen'],
		})
	})

	test('drops a list param that holds nothing usable', () => {
		expect(parseHomeUrl('?platforms=,,&hq=').state).toEqual({})
	})

	test('decodes platform names containing spaces', () => {
		expect(parseHomeUrl('?platforms=Web+Browser,Fire+OS').state).toEqual({
			selectedPlatforms: ['Web Browser', 'Fire OS'],
		})
	})

	test('reads the page number', () => {
		expect(parseHomeUrl('?page=3').page).toBe(3)
	})

	test('falls back to page 1 when the page is missing or unusable', () => {
		expect(parseHomeUrl('').page).toBe(1)
		expect(parseHomeUrl('?page=0').page).toBe(1)
		expect(parseHomeUrl('?page=-2').page).toBe(1)
		expect(parseHomeUrl('?page=abc').page).toBe(1)
	})

	test('ignores params it does not own', () => {
		expect(parseHomeUrl('?utm_source=newsletter&ref=twitter').state).toEqual({})
	})
})

describe('buildHomeUrl', () => {
	test('writes nothing for an unfiltered homepage', () => {
		expect(buildHomeUrl(homeState())).toBe('')
	})

	test('writes only the filters that are on', () => {
		expect(buildHomeUrl(homeState({ showOpenSource: true }))).toBe('?openSource=true')
	})

	test('omits booleans that are off', () => {
		const url = buildHomeUrl(homeState({ showFreeOnly: true, showProprietary: false }))
		expect(url).toBe('?free=true')
	})

	test('writes the search term', () => {
		expect(buildHomeUrl(homeState({ searchTerm: 'menu board' }))).toBe('?search=menu+board')
	})

	test('joins list filters with commas', () => {
		const url = buildHomeUrl(homeState({ selectedPlatforms: ['Android', 'Tizen'] }))
		expect(url).toBe('?platforms=Android%2CTizen')
	})

	test('omits empty list filters', () => {
		expect(buildHomeUrl(homeState({ selectedPlatforms: [], selectedHQ: [] }))).toBe('')
	})

	test('writes the page only past the first', () => {
		expect(buildHomeUrl(homeState(), 1)).toBe('')
		expect(buildHomeUrl(homeState(), 2)).toBe('?page=2')
	})

	test('ignores state the homepage has no control for', () => {
		const url = buildHomeUrl(homeState({ category: 'CMS', selectedCompliance: ['soc2'] }))
		expect(url).toBe('')
	})

	test('carries through params it does not own', () => {
		const url = buildHomeUrl(homeState({ showOpenSource: true }), 1, '?utm_source=newsletter')
		expect(url).toBe('?utm_source=newsletter&openSource=true')
	})

	test('keeps foreign params even when no filter is active', () => {
		expect(buildHomeUrl(homeState(), 1, '?utm_source=newsletter')).toBe('?utm_source=newsletter')
	})

	test('replaces stale values of params it owns rather than duplicating them', () => {
		const url = buildHomeUrl(homeState({ showFreeOnly: true }), 1, '?openSource=true&free=true&page=7')
		expect(url).toBe('?free=true')
	})

	test('combines filters into one shareable query', () => {
		const url = buildHomeUrl(
			homeState({
				searchTerm: 'menu',
				showOpenSource: true,
				selectedPlatforms: ['Android'],
				selectedHQ: ['usa'],
			}),
			2,
		)
		expect(url).toBe('?search=menu&openSource=true&platforms=Android&hq=usa&page=2')
	})
})

describe('round trip', () => {
	const cases: Array<[string, FilterState]> = [
		['unfiltered', homeState()],
		['search only', homeState({ searchTerm: 'digital menu' })],
		[
			'every boolean on',
			homeState({
				showOpenSource: true,
				showProprietary: true,
				showFreeOnly: true,
				showFreeTrialOnly: true,
				showFreemiumOnly: true,
				showDiscontinuedOnly: true,
				hideDiscontinued: true,
				signupIsOpenOnly: true,
			}),
		],
		['lists with spaces', homeState({ selectedPlatforms: ['Web Browser', 'Fire OS'], selectedHQ: ['united states'] })],
		['mixed', homeState({ searchTerm: 'pi', showFreeOnly: true, selectedPlatforms: ['Raspberry Pi'] })],
	]

	for (const [name, state] of cases) {
		test(`survives build then parse: ${name}`, () => {
			const parsed = parseHomeUrl(buildHomeUrl(state))
			expect(homeState(parsed.state)).toEqual(state)
		})
	}

	test('keeps the page across a round trip', () => {
		const state = homeState({ showOpenSource: true })
		const parsed = parseHomeUrl(buildHomeUrl(state, 4))
		expect(parsed.page).toBe(4)
	})
})
