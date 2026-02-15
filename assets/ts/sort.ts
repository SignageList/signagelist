import type { FilterEngine } from './filter'

type SortDirection = 'asc' | 'desc' | null

interface SortState {
	column: string | null
	direction: SortDirection
}

export function initSort(_engine: FilterEngine): void {
	const table = document.querySelector<HTMLTableElement>('#product-table')
	if (!table) return

	const tbody = table.querySelector('tbody')
	if (!tbody) return

	const headers = table.querySelectorAll<HTMLTableCellElement>('th[data-sort]')
	const sortState: SortState = { column: 'name', direction: 'asc' }

	function sort(column: string, direction: SortDirection): void {
		if (!direction || !tbody) return

		const rows = Array.from(tbody.querySelectorAll<HTMLTableRowElement>('.product-row'))
		const multiplier = direction === 'asc' ? 1 : -1

		rows.sort((a, b) => {
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

		for (const row of rows) {
			tbody.appendChild(row)
		}
	}

	function updateSortIndicators(): void {
		for (const header of headers) {
			const indicator = header.querySelector('.sort-indicator')
			if (!indicator) continue
			if (header.dataset.sort === sortState.column) {
				indicator.textContent = sortState.direction === 'asc' ? ' \u2191' : ' \u2193'
			} else {
				indicator.textContent = ''
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
