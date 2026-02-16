export interface FilterState {
	category: string
	searchTerm: string
	showOpenSource: boolean
	showProprietary: boolean
	selectedPlatforms: string[]
	selectedCompliance: string[]
	selectedAuthentication: string[]
	signupIsOpenOnly: boolean
}

export class FilterEngine {
	private state: FilterState = {
		category: 'CMS',
		searchTerm: '',
		showOpenSource: true,
		showProprietary: true,
		selectedPlatforms: [],
		selectedCompliance: [],
		selectedAuthentication: [],
		signupIsOpenOnly: false,
	}
	private rows: HTMLTableRowElement[]
	private matchingRows: HTMLTableRowElement[] = []
	private currentPage = 1
	private pageSize = 50
	private listeners: Array<() => void> = []

	constructor(table: HTMLTableElement) {
		this.rows = Array.from(table.querySelectorAll<HTMLTableRowElement>('tbody .product-row'))
	}

	getState(): FilterState {
		return { ...this.state }
	}

	setState(partial: Partial<FilterState>): void {
		Object.assign(this.state, partial)
		this.currentPage = 1
		this.applyFilters()
	}

	setPage(page: number): void {
		this.currentPage = page
		this.applyPagination()
		this.updateVisibleCount()
		this.dispatchChange()
	}

	getPageInfo(): { current: number; total: number; matchCount: number } {
		const total = Math.max(1, Math.ceil(this.matchingRows.length / this.pageSize))
		return {
			current: this.currentPage,
			total,
			matchCount: this.matchingRows.length,
		}
	}

	onChange(fn: () => void): void {
		this.listeners.push(fn)
	}

	applyFilters(): void {
		// Pass 1: determine which rows match all filter predicates
		this.matchingRows = []
		for (const row of this.rows) {
			const matches =
				this.matchesCategory(row) &&
				this.matchesSearch(row) &&
				this.matchesOpenSource(row) &&
				this.matchesPlatforms(row) &&
				this.matchesCompliance(row) &&
				this.matchesAuthentication(row) &&
				this.matchesSignup(row)
			if (matches) {
				this.matchingRows.push(row)
			}
		}

		// Clamp page to valid range
		const totalPages = Math.max(1, Math.ceil(this.matchingRows.length / this.pageSize))
		if (this.currentPage > totalPages) {
			this.currentPage = totalPages
		}

		// Pass 2: show/hide rows based on match + pagination
		this.applyPagination()
		this.updateCounts()
		this.toggleEmptyState(this.matchingRows.length)
		this.dispatchChange()
	}

	private applyPagination(): void {
		const start = (this.currentPage - 1) * this.pageSize
		const end = start + this.pageSize
		const matchingSet = new Set(this.matchingRows)

		for (const row of this.rows) {
			if (!matchingSet.has(row)) {
				row.classList.add('hidden')
			} else {
				const idx = this.matchingRows.indexOf(row)
				row.classList.toggle('hidden', idx < start || idx >= end)
			}
		}
	}

	private matchesCategory(row: HTMLTableRowElement): boolean {
		const cats = (row.dataset.categories || '').split(',')
		return cats.includes(this.state.category)
	}

	private matchesSearch(row: HTMLTableRowElement): boolean {
		const term = this.state.searchTerm.toLowerCase()
		if (!term) return true
		return (
			(row.dataset.name || '').includes(term) ||
			(row.dataset.description || '').includes(term) ||
			(row.dataset.hq || '').includes(term) ||
			(row.dataset.website || '').includes(term)
		)
	}

	private matchesOpenSource(row: HTMLTableRowElement): boolean {
		const isOpen = row.dataset.openSource === 'true'
		if (this.state.showOpenSource && isOpen) return true
		if (this.state.showProprietary && !isOpen) return true
		return false
	}

	private matchesPlatforms(row: HTMLTableRowElement): boolean {
		if (this.state.selectedPlatforms.length === 0) return true
		const platforms = (row.dataset.platforms || '').split(',').filter(Boolean)
		return this.state.selectedPlatforms.every((p) => platforms.includes(p))
	}

	private matchesCompliance(row: HTMLTableRowElement): boolean {
		if (this.state.selectedCompliance.length === 0) return true
		const compliance = (row.dataset.compliance || '').split(',').filter(Boolean)
		return this.state.selectedCompliance.every((c) => compliance.includes(c))
	}

	private matchesAuthentication(row: HTMLTableRowElement): boolean {
		if (this.state.selectedAuthentication.length === 0) return true
		const authentication = (row.dataset.authentication || '').split(',').filter(Boolean)
		return this.state.selectedAuthentication.every((a) => authentication.includes(a))
	}

	private matchesSignup(row: HTMLTableRowElement): boolean {
		if (!this.state.signupIsOpenOnly) return true
		return row.dataset.selfSignup === 'true'
	}

	private toggleEmptyState(visibleCount: number): void {
		const emptyState = document.querySelector('#empty-state')
		const tableWrapper = document.querySelector('.table-wrapper')
		if (emptyState) {
			emptyState.classList.toggle('hidden', visibleCount > 0)
		}
		if (tableWrapper) {
			;(tableWrapper as HTMLElement).style.display = visibleCount === 0 ? 'none' : ''
		}
	}

	private updateCounts(): void {
		// Update category counts using matchingRows-style logic (not .hidden which includes pagination)
		const categories = ['CMS', 'Content provider', 'Computer vision']
		for (const cat of categories) {
			const countEl = document.querySelector(`[data-category-count="${cat}"]`)
			if (countEl) {
				let count = 0
				for (const row of this.rows) {
					const cats = (row.dataset.categories || '').split(',')
					if (!cats.includes(cat)) continue
					// Apply all filters except category
					const matchesSearch = this.matchesSearch(row)
					const matchesOS = this.matchesOpenSource(row)
					const matchesPlatform = this.matchesPlatforms(row)
					const matchesCompliance = this.matchesCompliance(row)
					const matchesAuth = this.matchesAuthentication(row)
					const matchesSignup = this.matchesSignup(row)
					if (matchesSearch && matchesOS && matchesPlatform && matchesCompliance && matchesAuth && matchesSignup)
						count++
				}
				countEl.textContent = String(count)
			}
		}

		this.updateVisibleCount()

		// Update platform counts based on matching rows (not pagination)
		const matchingSet = new Set(this.matchingRows)
		const platformCheckboxes = document.querySelectorAll<HTMLElement>('[data-platform-count]')
		for (const el of platformCheckboxes) {
			const platform = el.dataset.platformCount || ''
			let count = 0
			for (const row of this.rows) {
				if (!matchingSet.has(row)) continue
				const platforms = (row.dataset.platforms || '').split(',').filter(Boolean)
				if (platforms.includes(platform)) count++
			}
			el.textContent = String(count)
		}
	}

	private updateVisibleCount(): void {
		const totalEl = document.querySelector('#visible-count')
		if (totalEl) {
			const { current, total, matchCount } = this.getPageInfo()
			if (total <= 1) {
				totalEl.textContent = String(matchCount)
			} else {
				const start = (current - 1) * this.pageSize + 1
				const end = Math.min(current * this.pageSize, matchCount)
				totalEl.textContent = `${start}\u2013${end} of ${matchCount}`
			}
		}
	}

	private dispatchChange(): void {
		for (const fn of this.listeners) fn()
	}
}
