import { initAuthenticationDropdown } from './authentication-dropdown'
import { initComplianceDropdown } from './compliance-dropdown'
import { FilterEngine } from './filter'
import { initGitHubStars } from './github-stars'
import { initHomeUrlSync } from './home-url-sync'
import { initProductModal } from './modal'
import { initPlatformDropdown } from './platform-dropdown'
import { initSearch } from './search'
import { initSort } from './sort'
import { initUrlSync } from './url-sync'

const BREADCRUMB_KEY = 'product-breadcrumb-ctx'

document.addEventListener('DOMContentLoaded', () => {
	// Mobile menu toggle (shared across all pages)
	const mobileMenuToggle = document.querySelector<HTMLButtonElement>('#mobile-menu-toggle')
	const mobileMenu = document.querySelector<HTMLDivElement>('#mobile-menu')
	const menuIconOpen = document.querySelector<SVGElement>('#menu-icon-open')
	const menuIconClose = document.querySelector<SVGElement>('#menu-icon-close')
	if (mobileMenuToggle && mobileMenu) {
		mobileMenuToggle.addEventListener('click', () => {
			const isOpen = !mobileMenu.classList.contains('hidden')
			mobileMenu.classList.toggle('hidden', isOpen)
			menuIconOpen?.classList.toggle('hidden', !isOpen)
			menuIconClose?.classList.toggle('hidden', isOpen)
			mobileMenuToggle.setAttribute('aria-expanded', String(!isOpen))
		})
	}

	initGitHubStars()

	// Term pages (categories/platforms): store breadcrumb context on row click
	const termWrapper = document.querySelector<HTMLElement>('[data-breadcrumb-context]')
	if (termWrapper) {
		const ctx = termWrapper.dataset.breadcrumbContext!
		termWrapper.addEventListener('click', (e) => {
			if ((e.target as HTMLElement).closest('.product-row')) {
				sessionStorage.setItem(BREADCRUMB_KEY, ctx)
			}
		})
	}

	// Product pages: resolve breadcrumb context then swap skeleton → real nav
	const productBreadcrumb = document.querySelector<HTMLElement>('#product-breadcrumb')
	const breadcrumbSkeleton = document.querySelector<HTMLElement>('#breadcrumb-skeleton')
	if (productBreadcrumb) {
		const raw = sessionStorage.getItem(BREADCRUMB_KEY)
		if (raw) {
			try {
				const { indexUrl, indexLabel, termUrl, termTitle } = JSON.parse(raw)
				let referrerPath = ''
				try {
					referrerPath = new URL(document.referrer).pathname
				} catch {}
				const isFromTermPage = referrerPath.startsWith(termUrl)
				if (isFromTermPage) {
					const chevron =
						'<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>'
					const link = (href: string, label: string) =>
						`<a href="${href}" class="hover:text-neutral-600 transition-colors truncate">${label}</a>`
					const productSpan = productBreadcrumb.querySelector('span')!
					productSpan.previousElementSibling?.remove()
					const crumbs =
						indexUrl === termUrl
							? `${chevron}${link(termUrl, termTitle)}${chevron}`
							: `${chevron}${link(indexUrl, indexLabel)}${chevron}${link(termUrl, termTitle)}${chevron}`
					productSpan.insertAdjacentHTML('beforebegin', crumbs)
				} else {
					sessionStorage.removeItem(BREADCRUMB_KEY)
				}
			} catch {}
		}
		const elapsed = performance.now()
		const delay = Math.max(0, 500 - elapsed)
		setTimeout(() => {
			breadcrumbSkeleton?.classList.add('hidden')
			productBreadcrumb.classList.remove('hidden')
		}, delay)
	}

	// Homepage (div-based list)
	const productList = document.querySelector<HTMLElement>('#product-list')
	if (productList) {
		initHomePage(productList)
		return
	}

	// /products/ page (table-based)
	const mobileFilterToggle = document.querySelector<HTMLButtonElement>('#mobile-filter-toggle')
	const mobileSecondaryFilters = document.querySelector<HTMLDivElement>('#mobile-secondary-filters')
	const filterChevron = document.querySelector<SVGElement>('#filter-chevron')
	if (mobileFilterToggle && mobileSecondaryFilters) {
		mobileFilterToggle.addEventListener('click', () => {
			const isOpen = !mobileSecondaryFilters.classList.contains('hidden')
			mobileSecondaryFilters.classList.toggle('hidden', isOpen)
			filterChevron?.classList.toggle('rotate-180', !isOpen)
			mobileFilterToggle.setAttribute('aria-expanded', String(!isOpen))
		})
	}

	const table = document.querySelector<HTMLTableElement>('#product-table')
	if (!table) return

	const engine = new FilterEngine(table)

	const categoryBtns = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-category-btn]'))
	for (const btn of categoryBtns) {
		btn.addEventListener('click', () => {
			engine.setState({ category: btn.dataset.categoryBtn! })
			updateCategoryButtons(categoryBtns, engine.getState().category)
		})
	}

	const osCheckbox = document.querySelector<HTMLInputElement>('#filter-open-source')
	const propCheckbox = document.querySelector<HTMLInputElement>('#filter-proprietary')
	if (osCheckbox) osCheckbox.addEventListener('change', () => engine.setState({ showOpenSource: osCheckbox.checked }))
	if (propCheckbox)
		propCheckbox.addEventListener('change', () => engine.setState({ showProprietary: propCheckbox.checked }))

	const signupCheckbox = document.querySelector<HTMLInputElement>('#filter-signup')
	if (signupCheckbox)
		signupCheckbox.addEventListener('change', () => engine.setState({ signupIsOpenOnly: signupCheckbox.checked }))

	const osMobileCheckbox = document.querySelector<HTMLInputElement>('#filter-open-source-mobile')
	const propMobileCheckbox = document.querySelector<HTMLInputElement>('#filter-proprietary-mobile')
	const signupMobileCheckbox = document.querySelector<HTMLInputElement>('#filter-signup-mobile')
	if (osMobileCheckbox) {
		osMobileCheckbox.addEventListener('change', () => {
			engine.setState({ showOpenSource: osMobileCheckbox.checked })
			if (osCheckbox) osCheckbox.checked = osMobileCheckbox.checked
		})
	}
	if (propMobileCheckbox) {
		propMobileCheckbox.addEventListener('change', () => {
			engine.setState({ showProprietary: propMobileCheckbox.checked })
			if (propCheckbox) propCheckbox.checked = propMobileCheckbox.checked
		})
	}
	if (signupMobileCheckbox) {
		signupMobileCheckbox.addEventListener('change', () => {
			engine.setState({ signupIsOpenOnly: signupMobileCheckbox.checked })
			if (signupCheckbox) signupCheckbox.checked = signupMobileCheckbox.checked
		})
	}

	const resetBtns = Array.from(
		document.querySelectorAll<HTMLButtonElement>('#reset-filters, #reset-filters-mobile, #empty-state-reset'),
	)
	for (const btn of resetBtns) {
		btn.addEventListener('click', () =>
			resetTableFilters(
				engine,
				categoryBtns,
				osCheckbox,
				propCheckbox,
				signupCheckbox,
				osMobileCheckbox,
				propMobileCheckbox,
				signupMobileCheckbox,
			),
		)
	}

	const paginationNav = document.querySelector<HTMLElement>('#pagination')
	const pagePrev = document.querySelector<HTMLButtonElement>('#page-prev')
	const pageNext = document.querySelector<HTMLButtonElement>('#page-next')
	const pageInfoEl = document.querySelector<HTMLElement>('#page-info')

	function updatePagination(): void {
		const { current, total } = engine.getPageInfo()
		if (paginationNav) {
			paginationNav.classList.toggle('hidden', total <= 1)
			paginationNav.classList.toggle('flex', total > 1)
		}
		if (pageInfoEl) pageInfoEl.textContent = `Page ${current} of ${total}`
		if (pagePrev) pagePrev.disabled = current <= 1
		if (pageNext) pageNext.disabled = current >= total
	}

	if (pagePrev) {
		pagePrev.addEventListener('click', () => {
			const { current } = engine.getPageInfo()
			if (current > 1) {
				engine.setPage(current - 1)
				document.querySelector('.table-wrapper')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
			}
		})
	}
	if (pageNext) {
		pageNext.addEventListener('click', () => {
			const { current, total } = engine.getPageInfo()
			if (current < total) {
				engine.setPage(current + 1)
				document.querySelector('.table-wrapper')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
			}
		})
	}

	engine.onChange(() => {
		const state = engine.getState()
		const isDefault =
			state.category === 'CMS' &&
			!state.searchTerm &&
			state.showOpenSource &&
			state.showProprietary &&
			state.selectedPlatforms.length === 0 &&
			state.selectedCompliance.length === 0 &&
			state.selectedAuthentication.length === 0 &&
			!state.signupIsOpenOnly
		document.querySelectorAll('#reset-filters, #reset-filters-mobile').forEach((btn) => {
			btn.classList.toggle('hidden', isDefault)
		})
		updatePagination()
	})

	initSearch(engine)
	initSort(engine)
	initUrlSync(engine)
	initPlatformDropdown(engine)
	initComplianceDropdown(engine)
	initAuthenticationDropdown(engine)

	document.addEventListener('click', (e) => {
		const link = (e.target as HTMLElement).closest<HTMLAnchorElement>('a.outbound-link')
		if (!link) return
		if (typeof window.posthog?.capture === 'function') {
			window.posthog.capture('outbound_link_click', { product: link.dataset.product || '', url: link.href })
		}
	})

	engine.applyFilters()
})

function initHomePage(productList: HTMLElement): void {
	const engine = new FilterEngine(productList)
	engine.setState({ category: '', showOpenSource: false, showProprietary: false })

	// Type pill toggles
	const typePills = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-type-pill]'))
	for (const pill of typePills) {
		pill.addEventListener('click', () => {
			const type = pill.dataset.typePill!
			const s = engine.getState()
			if (type === 'open-source') engine.setState({ showOpenSource: !s.showOpenSource })
			else if (type === 'free') engine.setState({ showFreeOnly: !s.showFreeOnly })
			else if (type === 'free-trial') engine.setState({ showFreeTrialOnly: !s.showFreeTrialOnly })
			else if (type === 'proprietary') engine.setState({ showProprietary: !s.showProprietary })
			else if (type === 'discontinued') engine.setState({ showDiscontinuedOnly: !s.showDiscontinuedOnly })
			else if (type === 'self-signup') engine.setState({ signupIsOpenOnly: !s.signupIsOpenOnly })
			syncTypePills(typePills, engine)
			updateMobileFilterBadge()
		})
	}

	// Hide discontinued checkboxes
	const hideDiscontinuedCbs = [
		document.querySelector<HTMLInputElement>('#hide-discontinued'),
		document.querySelector<HTMLInputElement>('#hide-discontinued-mobile'),
	].filter(Boolean) as HTMLInputElement[]
	for (const cb of hideDiscontinuedCbs) {
		cb.addEventListener('change', () => {
			for (const other of hideDiscontinuedCbs) other.checked = cb.checked
			engine.setState({ hideDiscontinued: cb.checked })
			updateMobileFilterBadge()
		})
	}

	// Platform checkboxes (sidebar + mobile modal share same data-platform-checkbox attr)
	const platformCheckboxes = Array.from(document.querySelectorAll<HTMLInputElement>('[data-platform-checkbox]'))
	for (const cb of platformCheckboxes) {
		cb.addEventListener('change', () => {
			const val = cb.dataset.platformCheckbox!
			for (const other of platformCheckboxes) {
				if (other.dataset.platformCheckbox === val) other.checked = cb.checked
			}
			const seen = new Set<string>()
			const selected = platformCheckboxes
				.filter((c) => c.checked)
				.map((c) => c.dataset.platformCheckbox!)
				.filter((v) => (seen.has(v) ? false : seen.add(v) && true))
			engine.setState({ selectedPlatforms: selected })
		})
	}

	// HQ checkboxes (sidebar + mobile modal share same data-hq-checkbox attr)
	const hqCheckboxes = Array.from(document.querySelectorAll<HTMLInputElement>('[data-hq-checkbox]'))
	for (const cb of hqCheckboxes) {
		cb.addEventListener('change', () => {
			const val = cb.dataset.hqCheckbox!
			for (const other of hqCheckboxes) {
				if (other.dataset.hqCheckbox === val) other.checked = cb.checked
			}
			const seen = new Set<string>()
			const selected = hqCheckboxes
				.filter((c) => c.checked)
				.map((c) => c.dataset.hqCheckbox!)
				.filter((v) => (seen.has(v) ? false : seen.add(v) && true))
			engine.setState({ selectedHQ: selected })
		})
	}

	// Search
	const searchInput = document.querySelector<HTMLInputElement>('#search-input')
	if (searchInput) {
		searchInput.addEventListener('input', () => engine.setState({ searchTerm: searchInput.value.trim() }))
	}

	// Reset
	const resetBtns = Array.from(document.querySelectorAll<HTMLButtonElement>('#reset-filters, #empty-state-reset'))
	for (const btn of resetBtns) {
		btn.addEventListener('click', () => {
			engine.setState({
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
			})
			if (searchInput) searchInput.value = ''
			for (const cb of platformCheckboxes) cb.checked = false
			for (const cb of hqCheckboxes) cb.checked = false
			for (const cb of hideDiscontinuedCbs) cb.checked = false
			syncTypePills(typePills, engine)
		})
	}

	// Mobile filter modal
	const mobileFilterModal = document.querySelector<HTMLElement>('#mobile-filter-modal')
	const mobileFilterBadge = document.querySelector<HTMLElement>('#mobile-filter-badge')

	function updateMobileFilterBadge(): void {
		if (!mobileFilterBadge) return
		const s = engine.getState()
		const count =
			[
				s.showOpenSource,
				s.showFreeOnly,
				s.showFreeTrialOnly,
				s.showProprietary,
				s.showDiscontinuedOnly,
				s.signupIsOpenOnly,
			].filter(Boolean).length +
			s.selectedPlatforms.length +
			s.selectedHQ.length
		mobileFilterBadge.textContent = String(count)
		mobileFilterBadge.classList.toggle('hidden', count === 0)
	}

	function openFilterModal(): void {
		mobileFilterModal?.classList.remove('hidden')
		document.body.style.overflow = 'hidden'
	}

	function closeFilterModal(): void {
		mobileFilterModal?.classList.add('hidden')
		document.body.style.overflow = ''
	}

	document.querySelector('#mobile-filter-btn')?.addEventListener('click', openFilterModal)
	document.querySelector('#mobile-filter-backdrop')?.addEventListener('click', closeFilterModal)
	document.querySelector('#mobile-filter-close')?.addEventListener('click', closeFilterModal)
	document.querySelector('#mobile-filter-done')?.addEventListener('click', closeFilterModal)
	document.querySelector('#mobile-filter-reset')?.addEventListener('click', () => {
		engine.setState({
			category: '',
			searchTerm: '',
			showOpenSource: false,
			showProprietary: false,
			showDiscontinuedOnly: false,
			showFreeTrialOnly: false,
			showFreemiumOnly: false,
			showFreeOnly: false,
			selectedPlatforms: [],
			selectedHQ: [],
			selectedCompliance: [],
			selectedAuthentication: [],
			signupIsOpenOnly: false,
		})
		if (searchInput) searchInput.value = ''
		for (const cb of platformCheckboxes) cb.checked = false
		for (const cb of hqCheckboxes) cb.checked = false
		syncTypePills(typePills, engine)
		updateMobileFilterBadge()
	})

	// Active filter pills
	function renderActiveFilters(): void {
		const container = document.querySelector<HTMLElement>('#active-filters')
		if (!container) return
		const s = engine.getState()

		type Pill = { label: string; onRemove: () => void }
		const pills: Pill[] = []

		const addType = (active: boolean, label: string, patch: Partial<typeof s>) => {
			if (active)
				pills.push({
					label,
					onRemove: () => {
						engine.setState(patch)
						syncTypePills(typePills, engine)
					},
				})
		}
		addType(s.showOpenSource, 'Open Source', { showOpenSource: false })
		addType(s.showFreeOnly, 'Free / Freemium', { showFreeOnly: false })
		addType(s.showFreeTrialOnly, 'Free Trial', { showFreeTrialOnly: false })
		addType(s.showProprietary, 'Proprietary', { showProprietary: false })
		addType(s.showDiscontinuedOnly, 'Discontinued', { showDiscontinuedOnly: false })
		addType(s.signupIsOpenOnly, 'Self Signup', { signupIsOpenOnly: false })
		for (const platform of s.selectedPlatforms) {
			const p = platform
			pills.push({
				label: p,
				onRemove: () => {
					engine.setState({ selectedPlatforms: engine.getState().selectedPlatforms.filter((x) => x !== p) })
					for (const cb of platformCheckboxes) if (cb.dataset.platformCheckbox === p) cb.checked = false
				},
			})
		}
		for (const hq of s.selectedHQ) {
			const h = hq
			const label = h
				.split(' ')
				.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
				.join(' ')
			pills.push({
				label,
				onRemove: () => {
					engine.setState({ selectedHQ: engine.getState().selectedHQ.filter((x) => x !== h) })
					for (const cb of hqCheckboxes) if (cb.dataset.hqCheckbox === h) cb.checked = false
				},
			})
		}

		if (pills.length === 0) {
			container.innerHTML = ''
			container.classList.add('hidden')
			container.classList.remove('flex')
			return
		}

		container.classList.remove('hidden')
		container.classList.add('flex')
		container.innerHTML = ''

		const xIcon =
			'<svg class="w-3 h-3 text-neutral-400 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>'
		for (const pill of pills) {
			const btn = document.createElement('button')
			btn.className =
				'inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 text-xs font-medium text-neutral-700 bg-white border border-neutral-200 rounded-full hover:bg-neutral-50 transition-colors'
			btn.innerHTML = `${pill.label}${xIcon}`
			btn.addEventListener('click', pill.onRemove)
			container.appendChild(btn)
		}

		if (pills.length > 1) {
			const clearBtn = document.createElement('button')
			clearBtn.className =
				'inline-flex items-center px-2.5 py-1 text-xs font-medium text-neutral-400 hover:text-neutral-700 transition-colors'
			clearBtn.textContent = 'Clear all'
			clearBtn.addEventListener('click', () => {
				engine.setState({
					showOpenSource: false,
					showFreeOnly: false,
					showFreeTrialOnly: false,
					showProprietary: false,
					showDiscontinuedOnly: false,
					showFreemiumOnly: false,
					selectedPlatforms: [],
					selectedHQ: [],
					selectedCompliance: [],
					selectedAuthentication: [],
					signupIsOpenOnly: false,
				})
				for (const cb of platformCheckboxes) cb.checked = false
				for (const cb of hqCheckboxes) cb.checked = false
				syncTypePills(typePills, engine)
			})
			container.appendChild(clearBtn)
		}
	}

	// Reset button visibility + pagination
	engine.onChange(() => {
		renderActiveFilters()
		const s = engine.getState()
		const isDefault =
			!s.searchTerm &&
			!s.showOpenSource &&
			!s.showFreeOnly &&
			!s.showProprietary &&
			!s.showDiscontinuedOnly &&
			!s.hideDiscontinued &&
			!s.showFreeTrialOnly &&
			!s.showFreemiumOnly &&
			s.selectedPlatforms.length === 0 &&
			s.selectedHQ.length === 0 &&
			!s.signupIsOpenOnly
		document.querySelector('#reset-filters')?.classList.toggle('hidden', isDefault)
		updateMobileFilterBadge()

		const paginationNav = document.querySelector<HTMLElement>('#pagination')
		const pagePrev = document.querySelector<HTMLButtonElement>('#page-prev')
		const pageNext = document.querySelector<HTMLButtonElement>('#page-next')
		const pageInfoEl = document.querySelector<HTMLElement>('#page-info')
		const { current, total } = engine.getPageInfo()
		if (paginationNav) {
			paginationNav.classList.toggle('hidden', total <= 1)
			paginationNav.classList.toggle('flex', total > 1)
		}
		if (pageInfoEl) pageInfoEl.textContent = `Page ${current} of ${total}`
		if (pagePrev) pagePrev.disabled = current <= 1
		if (pageNext) pageNext.disabled = current >= total
	})

	function scrollToList(): void {
		const el = document.querySelector('#search-input')
		if (!el) return
		const top = el.getBoundingClientRect().top + window.scrollY - 72
		window.scrollTo({ top, behavior: 'instant' })
	}

	const pagePrev = document.querySelector<HTMLButtonElement>('#page-prev')
	const pageNext = document.querySelector<HTMLButtonElement>('#page-next')
	if (pagePrev)
		pagePrev.addEventListener('click', () => {
			const { current } = engine.getPageInfo()
			if (current > 1) {
				engine.setPage(current - 1)
				scrollToList()
			}
		})
	if (pageNext)
		pageNext.addEventListener('click', () => {
			const { current, total } = engine.getPageInfo()
			if (current < total) {
				engine.setPage(current + 1)
				scrollToList()
			}
		})

	initHomeUrlSync(engine, () => {
		syncTypePills(typePills, engine)
		updateMobileFilterBadge()
	})

	engine.applyFilters()
	initProductModal(productList, engine)
}

function syncTypePills(pills: HTMLButtonElement[], engine: FilterEngine): void {
	const s = engine.getState()
	const activeMap: Record<string, boolean> = {
		'open-source': s.showOpenSource,
		free: s.showFreeOnly,
		'free-trial': s.showFreeTrialOnly,
		proprietary: s.showProprietary,
		discontinued: s.showDiscontinuedOnly,
		'self-signup': s.signupIsOpenOnly,
	}
	for (const pill of pills) {
		const active = activeMap[pill.dataset.typePill!] ?? false
		if (active) pill.dataset.active = ''
		else delete pill.dataset.active
	}
}

function updateCategoryButtons(buttons: HTMLButtonElement[], activeCategory: string): void {
	for (const btn of buttons) {
		const isActive = btn.dataset.categoryBtn === activeCategory
		btn.classList.toggle('bg-primary-600', isActive)
		btn.classList.toggle('text-white', isActive)
		btn.classList.toggle('bg-white', !isActive)
		btn.classList.toggle('text-neutral-600', !isActive)
		btn.classList.toggle('ring-1', !isActive)
		btn.classList.toggle('ring-neutral-200', !isActive)
	}
}

function resetTableFilters(
	engine: FilterEngine,
	categoryBtns: HTMLButtonElement[],
	osCheckbox: HTMLInputElement | null,
	propCheckbox: HTMLInputElement | null,
	signupCheckbox: HTMLInputElement | null,
	osMobileCheckbox: HTMLInputElement | null,
	propMobileCheckbox: HTMLInputElement | null,
	signupMobileCheckbox: HTMLInputElement | null,
): void {
	engine.setState({
		category: 'CMS',
		searchTerm: '',
		showOpenSource: true,
		showProprietary: true,
		selectedPlatforms: [],
		selectedCompliance: [],
		selectedAuthentication: [],
		signupIsOpenOnly: false,
	})
	const searchInput = document.querySelector<HTMLInputElement>('#search-input')
	if (searchInput) searchInput.value = ''
	updateCategoryButtons(categoryBtns, 'CMS')
	if (osCheckbox) osCheckbox.checked = true
	if (propCheckbox) propCheckbox.checked = true
	if (signupCheckbox) signupCheckbox.checked = false
	if (osMobileCheckbox) osMobileCheckbox.checked = true
	if (propMobileCheckbox) propMobileCheckbox.checked = true
	if (signupMobileCheckbox) signupMobileCheckbox.checked = false
	document.querySelectorAll<HTMLInputElement>('[data-platform-checkbox]').forEach((cb) => {
		cb.checked = false
	})
	document.querySelectorAll('.platform-label').forEach((el) => {
		el.textContent = 'All platforms'
	})
	document.querySelectorAll<HTMLInputElement>('[data-compliance-checkbox]').forEach((cb) => {
		cb.checked = false
	})
	document.querySelectorAll('.compliance-label').forEach((el) => {
		el.textContent = 'Compliance'
	})
	document.querySelectorAll<HTMLInputElement>('[data-authentication-checkbox]').forEach((cb) => {
		cb.checked = false
	})
	document.querySelectorAll('.authentication-label').forEach((el) => {
		el.textContent = 'Authentication'
	})
}
