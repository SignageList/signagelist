import type { FilterEngine } from './filter'

type SortDirection = 'asc' | 'desc' | null

interface SortState {
	column: string | null
	direction: SortDirection
}

const chevronUp =
	'<svg class="w-3 h-3 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"/></svg>'
const chevronDown =
	'<svg class="w-3 h-3 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>'

export function initSort(engine: FilterEngine): void {
	const table = document.querySelector<HTMLTableElement>('#product-table')
	if (!table) return

	const headers = table.querySelectorAll<HTMLTableCellElement>('th[data-sort]')
	const sortState: SortState = { column: 'name', direction: 'asc' }

	function sort(column: string, direction: SortDirection): void {
		if (!direction) return

		const multiplier = direction === 'asc' ? 1 : -1

		engine.sortRows((a, b) => {
			let valA: string | number
			let valB: string | number

			if (column === 'pricing') {
				valA = parseFloat(a.dataset.pricingSort || '999999')
				valB = parseFloat(b.dataset.pricingSort || '999999')
			} else if (column === 'screens') {
				valA = parseInt(a.dataset.screensSort || '0', 10)
				valB = parseInt(b.dataset.screensSort || '0', 10)
			} else {
				valA = (a.dataset[column] || '').toLowerCase()
				valB = (b.dataset[column] || '').toLowerCase()
			}

			if (valA < valB) return -1 * multiplier
			if (valA > valB) return 1 * multiplier
			return 0
		})
	}

	function updateSortIndicators(): void {
		for (const header of headers) {
			const indicator = header.querySelector('.sort-indicator')
			if (!indicator) continue
			if (header.dataset.sort === sortState.column) {
				indicator.innerHTML = sortState.direction === 'asc' ? ` ${chevronUp}` : ` ${chevronDown}`
			} else {
				indicator.innerHTML = ''
			}
		}
	}

	for (const header of headers) {
		header.classList.add('cursor-pointer', 'select-none')
		header.addEventListener('click', () => {
			const column = header.dataset.sort!
			if (sortState.column === column) {
				sortState.direction = sortState.direction === 'asc' ? 'desc' : 'asc'
			} else {
				sortState.column = column
				sortState.direction = 'asc'
			}
			sort(column, sortState.direction)
			updateSortIndicators()
		})
	}

	// Initial sort
	sort('name', 'asc')
	updateSortIndicators()
}
