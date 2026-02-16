function initNewsPagination(container: HTMLElement, pageSize = 20): void {
	const items = Array.from(container.querySelectorAll<HTMLElement>('[data-news-item]'))
	if (items.length <= pageSize) return

	let currentPage = 1
	const totalPages = Math.ceil(items.length / pageSize)

	const nav = document.querySelector<HTMLElement>('#news-pagination')
	const prevBtn = document.querySelector<HTMLButtonElement>('#news-page-prev')
	const nextBtn = document.querySelector<HTMLButtonElement>('#news-page-next')
	const infoEl = document.querySelector<HTMLElement>('#news-page-info')

	if (!nav || !prevBtn || !nextBtn || !infoEl) return

	function render(): void {
		const start = (currentPage - 1) * pageSize
		const end = start + pageSize
		for (let i = 0; i < items.length; i++) {
			items[i].classList.toggle('hidden', i < start || i >= end)
		}
		infoEl!.textContent = `Page ${currentPage} of ${totalPages}`
		prevBtn!.disabled = currentPage <= 1
		nextBtn!.disabled = currentPage >= totalPages
		nav!.classList.remove('hidden')
		nav!.classList.add('flex')
	}

	prevBtn.addEventListener('click', () => {
		if (currentPage > 1) {
			currentPage--
			render()
			container.scrollIntoView({ behavior: 'smooth', block: 'start' })
		}
	})

	nextBtn.addEventListener('click', () => {
		if (currentPage < totalPages) {
			currentPage++
			render()
			container.scrollIntoView({ behavior: 'smooth', block: 'start' })
		}
	})

	render()
}

document.addEventListener('DOMContentLoaded', () => {
	const container = document.getElementById('news-container')
	if (container) {
		initNewsPagination(container)
	}
})
