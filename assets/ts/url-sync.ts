import type { FilterEngine } from './filter'

export function initUrlSync(engine: FilterEngine): void {
	// Load state from URL on init
	const params = new URLSearchParams(window.location.search)

	const initial: Record<string, unknown> = {}

	if (params.has('category')) {
		initial.category = params.get('category')!
	}
	if (params.has('search')) {
		initial.searchTerm = params.get('search')!
		const input = document.querySelector<HTMLInputElement>('#search-input')
		if (input) input.value = initial.searchTerm as string
	}
	if (params.has('openSource')) {
		initial.showOpenSource = params.get('openSource') === 'true'
	}
	if (params.has('proprietary')) {
		initial.showProprietary = params.get('proprietary') === 'true'
	}
	if (params.has('platforms')) {
		initial.selectedPlatforms = params.get('platforms')!.split(',').filter(Boolean)
	}
	if (params.has('compliance')) {
		initial.selectedCompliance = params.get('compliance')!.split(',').filter(Boolean)
	}
	if (params.has('authentication')) {
		initial.selectedAuthentication = params.get('authentication')!.split(',').filter(Boolean)
	}
	if (params.has('signupIsOpenOnly')) {
		initial.signupIsOpenOnly = params.get('signupIsOpenOnly') === 'true'
	}

	if (Object.keys(initial).length > 0) {
		engine.setState(initial)
	}

	// Restore page from URL (after setState which resets to page 1)
	if (params.has('page')) {
		const page = Number.parseInt(params.get('page')!, 10)
		if (page > 1) {
			engine.setPage(page)
		}
	}

	// Sync UI controls from loaded state
	syncUIFromState(engine)

	// Write state back to URL on every change
	engine.onChange(() => {
		const state = engine.getState()
		const pageInfo = engine.getPageInfo()
		const urlParams = new URLSearchParams()

		urlParams.set('category', state.category)
		if (state.searchTerm) {
			urlParams.set('search', state.searchTerm)
		}
		urlParams.set('openSource', String(state.showOpenSource))
		urlParams.set('proprietary', String(state.showProprietary))
		urlParams.set('signupIsOpenOnly', String(state.signupIsOpenOnly))
		if (state.selectedPlatforms.length > 0) {
			urlParams.set('platforms', state.selectedPlatforms.join(','))
		}
		if (state.selectedCompliance.length > 0) {
			urlParams.set('compliance', state.selectedCompliance.join(','))
		}
		if (state.selectedAuthentication.length > 0) {
			urlParams.set('authentication', state.selectedAuthentication.join(','))
		}
		if (pageInfo.current > 1) {
			urlParams.set('page', String(pageInfo.current))
		}

		const newUrl = `${window.location.pathname}?${urlParams.toString()}`
		window.history.replaceState({}, '', newUrl)
	})
}

function syncUIFromState(engine: FilterEngine): void {
	const state = engine.getState()

	// Sync category buttons
	const catBtns = document.querySelectorAll<HTMLButtonElement>('[data-category-btn]')
	for (const btn of catBtns) {
		const isActive = btn.dataset.categoryBtn === state.category
		btn.classList.toggle('bg-primary-600', isActive)
		btn.classList.toggle('text-white', isActive)
		btn.classList.toggle('bg-white', !isActive)
		btn.classList.toggle('text-neutral-600', !isActive)
		btn.classList.toggle('ring-1', !isActive)
		btn.classList.toggle('ring-neutral-200', !isActive)
	}

	// Sync open source / proprietary checkboxes (desktop + mobile)
	const osCheckbox = document.querySelector<HTMLInputElement>('#filter-open-source')
	const propCheckbox = document.querySelector<HTMLInputElement>('#filter-proprietary')
	const osMobileCheckbox = document.querySelector<HTMLInputElement>('#filter-open-source-mobile')
	const propMobileCheckbox = document.querySelector<HTMLInputElement>('#filter-proprietary-mobile')
	if (osCheckbox) osCheckbox.checked = state.showOpenSource
	if (propCheckbox) propCheckbox.checked = state.showProprietary
	if (osMobileCheckbox) osMobileCheckbox.checked = state.showOpenSource
	if (propMobileCheckbox) propMobileCheckbox.checked = state.showProprietary

	// Sync signup toggle (desktop + mobile)
	const signupCheckbox = document.querySelector<HTMLInputElement>('#filter-signup')
	const signupMobileCheckbox = document.querySelector<HTMLInputElement>('#filter-signup-mobile')
	if (signupCheckbox) signupCheckbox.checked = state.signupIsOpenOnly
	if (signupMobileCheckbox) signupMobileCheckbox.checked = state.signupIsOpenOnly

	// Sync platform checkboxes
	const platformCheckboxes = document.querySelectorAll<HTMLInputElement>('[data-platform-checkbox]')
	for (const cb of platformCheckboxes) {
		cb.checked = state.selectedPlatforms.includes(cb.dataset.platformCheckbox || '')
	}

	// Sync compliance checkboxes
	const complianceCheckboxes = document.querySelectorAll<HTMLInputElement>('[data-compliance-checkbox]')
	for (const cb of complianceCheckboxes) {
		cb.checked = state.selectedCompliance.includes(cb.dataset.complianceCheckbox || '')
	}

	// Sync authentication checkboxes
	const authenticationCheckboxes = document.querySelectorAll<HTMLInputElement>('[data-authentication-checkbox]')
	for (const cb of authenticationCheckboxes) {
		cb.checked = state.selectedAuthentication.includes(cb.dataset.authenticationCheckbox || '')
	}
}
