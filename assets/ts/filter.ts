export interface FilterState {
	category: string
	searchTerm: string
	showOpenSource: boolean
	showProprietary: boolean
	selectedPlatforms: string[]
	selectedCompliance: string[]
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
		signupIsOpenOnly: false,
	}
	private rows: HTMLTableRowElement[]
	private listeners: Array<() => void> = []

	constructor(table: HTMLTableElement) {
		this.rows = Array.from(table.querySelectorAll<HTMLTableRowElement>('tbody .product-row'))
	}

	getState(): FilterState {
		return { ...this.state }
	}

	setState(partial: Partial<FilterState>): void {
		Object.assign(this.state, partial)
		this.applyFilters()
	}

	onChange(fn: () => void): void {
		this.listeners.push(fn)
	}

	applyFilters(): void {
		let visibleCount = 0
		for (const row of this.rows) {
			const visible =
				this.matchesCategory(row) &&
				this.matchesSearch(row) &&
				this.matchesOpenSource(row) &&
				this.matchesPlatforms(row) &&
				this.matchesCompliance(row) &&
				this.matchesSignup(row)
			row.classList.toggle('hidden', !visible)
			if (visible) visibleCount++
		}
		this.updateCounts()
		this.toggleEmptyState(visibleCount)
		this.dispatchChange()
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
		// Update category counts
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
					const matchesSignup = this.matchesSignup(row)
					if (matchesSearch && matchesOS && matchesPlatform && matchesCompliance && matchesSignup) count++
				}
				countEl.textContent = String(count)
			}
		}

		// Update total visible count
		const totalEl = document.querySelector('#visible-count')
		if (totalEl) {
			const visible = this.rows.filter((r) => !r.classList.contains('hidden')).length
			totalEl.textContent = String(visible)
		}

		// Update platform counts
		const platformCheckboxes = document.querySelectorAll<HTMLElement>('[data-platform-count]')
		for (const el of platformCheckboxes) {
			const platform = el.dataset.platformCount || ''
			let count = 0
			for (const row of this.rows) {
				if (row.classList.contains('hidden')) continue
				const platforms = (row.dataset.platforms || '').split(',').filter(Boolean)
				if (platforms.includes(platform)) count++
			}
			el.textContent = String(count)
		}
	}

	private dispatchChange(): void {
		for (const fn of this.listeners) fn()
	}
}
