import { FilterEngine } from './filter'
import { initPlatformDropdown } from './platform-dropdown'
import { initSearch } from './search'
import { initSort } from './sort'
import { initUrlSync } from './url-sync'

document.addEventListener('DOMContentLoaded', () => {
	const table = document.querySelector<HTMLTableElement>('#product-table')
	if (!table) return

	const engine = new FilterEngine(table)

	// Category buttons
	const categoryBtns = document.querySelectorAll<HTMLButtonElement>('[data-category-btn]')
	for (const btn of categoryBtns) {
		btn.addEventListener('click', () => {
			engine.setState({ category: btn.dataset.categoryBtn! })
			// Update button styles
			for (const b of categoryBtns) {
				const isActive = b.dataset.categoryBtn === engine.getState().category
				b.classList.toggle('bg-brand-600', isActive)
				b.classList.toggle('text-white', isActive)
				b.classList.toggle('bg-gray-100', !isActive)
				b.classList.toggle('text-gray-700', !isActive)
			}
		})
	}

	// Open source / Proprietary checkboxes
	const osCheckbox = document.querySelector<HTMLInputElement>('#filter-open-source')
	const propCheckbox = document.querySelector<HTMLInputElement>('#filter-proprietary')
	if (osCheckbox) {
		osCheckbox.addEventListener('change', () => {
			engine.setState({ showOpenSource: osCheckbox.checked })
		})
	}
	if (propCheckbox) {
		propCheckbox.addEventListener('change', () => {
			engine.setState({ showProprietary: propCheckbox.checked })
		})
	}

	// Signup filter
	const signupCheckbox = document.querySelector<HTMLInputElement>('#filter-signup')
	if (signupCheckbox) {
		signupCheckbox.addEventListener('change', () => {
			engine.setState({ signupIsOpenOnly: signupCheckbox.checked })
		})
	}

	// Reset filters
	const resetBtn = document.querySelector<HTMLButtonElement>('#reset-filters')
	if (resetBtn) {
		resetBtn.addEventListener('click', () => {
			engine.setState({
				category: 'CMS',
				searchTerm: '',
				showOpenSource: true,
				showProprietary: true,
				selectedPlatforms: [],
				signupIsOpenOnly: false,
			})
			// Reset UI
			const searchInput = document.querySelector<HTMLInputElement>('#search-input')
			if (searchInput) searchInput.value = ''
			for (const btn of categoryBtns) {
				const isActive = btn.dataset.categoryBtn === 'CMS'
				btn.classList.toggle('bg-brand-600', isActive)
				btn.classList.toggle('text-white', isActive)
				btn.classList.toggle('bg-gray-100', !isActive)
				btn.classList.toggle('text-gray-700', !isActive)
			}
			if (osCheckbox) osCheckbox.checked = true
			if (propCheckbox) propCheckbox.checked = true
			if (signupCheckbox) signupCheckbox.checked = false
			// Uncheck platform checkboxes
			const platformCheckboxes = document.querySelectorAll<HTMLInputElement>('[data-platform-checkbox]')
			for (const cb of platformCheckboxes) cb.checked = false
			// Reset platform label
			const platformLabel = document.querySelector('.platform-label')
			if (platformLabel) platformLabel.textContent = 'All platforms'
		})

		// Show/hide reset button when filters change
		engine.onChange(() => {
			const state = engine.getState()
			const isDefault =
				state.category === 'CMS' &&
				!state.searchTerm &&
				state.showOpenSource &&
				state.showProprietary &&
				state.selectedPlatforms.length === 0 &&
				!state.signupIsOpenOnly
			resetBtn.classList.toggle('hidden', isDefault)
		})
	}

	initSearch(engine)
	initSort(engine)
	initUrlSync(engine)
	initPlatformDropdown(engine)

	// Track outbound link clicks via PostHog
	document.addEventListener('click', (e) => {
		const link = (e.target as HTMLElement).closest<HTMLAnchorElement>('a.outbound-link')
		if (!link) return
		const product = link.dataset.product || ''
		const href = link.href
		if (typeof window.posthog?.capture === 'function') {
			window.posthog.capture('outbound_link_click', {
				product,
				url: href,
			})
		}
	})

	engine.applyFilters()
})
