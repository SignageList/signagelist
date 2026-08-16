import type { FilterEngine } from './filter'

export function initProductModal(productList: HTMLElement, engine: FilterEngine): void {
	// Captured each time the modal opens, so closing returns to the list URL as it
	// was then, filters and all, rather than to a snapshot from page load.
	let listUrl = location.href
	let currentIndex = -1
	let isOpen = false
	const cache = new Map<string, string>()
	let closeTimer: ReturnType<typeof setTimeout> | null = null

	// ── Build modal DOM ──────────────────────────────────────────────────────
	const overlay = document.createElement('div')
	overlay.id = 'product-modal'
	overlay.className = 'fixed inset-0 z-50 flex flex-col justify-end hidden'
	overlay.setAttribute('role', 'dialog')
	overlay.setAttribute('aria-modal', 'true')
	overlay.innerHTML = `
		<div id="modal-backdrop" class="absolute inset-0 bg-black/40"></div>
		<div id="modal-panel" class="relative w-full max-w-5xl mx-auto bg-white rounded-t-2xl shadow-2xl flex flex-col" style="height:92vh;transform:translateY(100%);transition:transform 300ms cubic-bezier(0.32,0.72,0,1)">
			<div class="flex items-center justify-between px-6 py-3 border-b border-neutral-100 flex-shrink-0">
				<div class="flex items-center gap-1">
					<button id="modal-prev" disabled
						class="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-neutral-400"
						aria-label="Previous product">
						<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
					</button>
					<button id="modal-next" disabled
						class="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-neutral-400"
						aria-label="Next product">
						<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
					</button>
					<span id="modal-counter" class="text-xs text-neutral-400 ml-2 tabular-nums"></span>
				</div>
				<div class="flex items-center gap-2">
					<a id="modal-open-link" href="#"
						class="text-xs font-medium text-neutral-500 hover:text-neutral-900 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-neutral-100">
						Open page
						<svg class="w-3 h-3 inline-block ml-0.5 -mt-px" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
					</a>
					<button id="modal-close"
						class="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
						aria-label="Close">
						<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
					</button>
				</div>
			</div>
			<div id="modal-body" class="flex-1 overflow-y-auto overscroll-contain">
				<div id="modal-content"></div>
			</div>
		</div>
	`
	document.body.appendChild(overlay)

	const panel = overlay.querySelector<HTMLElement>('#modal-panel')!
	const body = overlay.querySelector<HTMLElement>('#modal-body')!
	const content = overlay.querySelector<HTMLElement>('#modal-content')!
	const backdrop = overlay.querySelector<HTMLElement>('#modal-backdrop')!
	const btnClose = overlay.querySelector<HTMLButtonElement>('#modal-close')!
	const btnPrev = overlay.querySelector<HTMLButtonElement>('#modal-prev')!
	const btnNext = overlay.querySelector<HTMLButtonElement>('#modal-next')!
	const counter = overlay.querySelector<HTMLElement>('#modal-counter')!
	const openLink = overlay.querySelector<HTMLAnchorElement>('#modal-open-link')!

	// ── Helpers ──────────────────────────────────────────────────────────────
	function getVisibleRows(): HTMLAnchorElement[] {
		return engine.getMatchingRows() as HTMLAnchorElement[]
	}

	function updateNav(): void {
		const rows = getVisibleRows()
		btnPrev.disabled = currentIndex <= 0
		btnNext.disabled = currentIndex >= rows.length - 1
		counter.textContent = rows.length > 0 ? `${currentIndex + 1} / ${rows.length}` : ''
	}

	async function loadProduct(href: string): Promise<void> {
		content.innerHTML = `
			<div class="flex items-center justify-center py-32">
				<div class="w-5 h-5 border-2 border-neutral-200 border-t-neutral-500 rounded-full animate-spin"></div>
			</div>`
		body.scrollTop = 0

		let html = cache.get(href)
		if (!html) {
			const res = await fetch(href)
			html = await res.text()
			cache.set(href, html)
		}

		const doc = new DOMParser().parseFromString(html, 'text/html')
		const main = doc.querySelector<HTMLElement>('#main-content')
		doc.querySelector('#product-breadcrumb')?.remove()
		doc.querySelector('#breadcrumb-skeleton')?.remove()
		content.innerHTML = main?.innerHTML ?? '<p class="p-8 text-neutral-500">Could not load product.</p>'
	}

	// ── Open / close ─────────────────────────────────────────────────────────
	async function openModal(href: string, pushState = true): Promise<void> {
		if (closeTimer !== null) {
			clearTimeout(closeTimer)
			closeTimer = null
		}
		isOpen = true
		overlay.classList.remove('hidden')
		document.body.style.overflow = 'hidden'
		panel.style.transform = 'translateY(100%)'
		requestAnimationFrame(() =>
			requestAnimationFrame(() => {
				panel.style.transform = 'translateY(0)'
			}),
		)
		openLink.href = href
		if (pushState) {
			listUrl = location.href
			history.pushState({ modal: true, href }, '', href)
		}
		updateNav()
		await loadProduct(href)
	}

	function closeModal(pushState = true): void {
		isOpen = false
		panel.style.transform = 'translateY(100%)'
		document.body.style.overflow = ''
		if (pushState) history.pushState(null, '', listUrl)
		closeTimer = setTimeout(() => {
			overlay.classList.add('hidden')
			content.innerHTML = ''
			closeTimer = null
		}, 300)
	}

	async function navigate(dir: 1 | -1): Promise<void> {
		const rows = getVisibleRows()
		const next = currentIndex + dir
		if (next < 0 || next >= rows.length) return
		currentIndex = next
		const href = rows[currentIndex].href
		openLink.href = href
		history.replaceState({ modal: true, href }, '', href)
		updateNav()
		await loadProduct(href)
	}

	// ── Event listeners ──────────────────────────────────────────────────────
	productList.addEventListener('click', (e) => {
		const row = (e.target as HTMLElement).closest<HTMLAnchorElement>('.product-row')
		if (!row) return
		e.preventDefault()
		currentIndex = getVisibleRows().indexOf(row)
		openModal(row.href)
	})

	backdrop.addEventListener('click', () => closeModal())
	btnClose.addEventListener('click', () => closeModal())
	btnPrev.addEventListener('click', () => navigate(-1))
	btnNext.addEventListener('click', () => navigate(1))
	openLink.addEventListener('click', () => {
		// Replace the modal pushState entry with the list URL before navigating,
		// so the browser back button returns to the list page instead of the
		// modal's product URL (which would restore the product page from bfcache).
		history.replaceState(null, '', listUrl)
	})

	document.addEventListener('keydown', (e) => {
		if (!isOpen) return
		if (e.key === 'Escape') closeModal()
		if (e.key === 'ArrowLeft') navigate(-1)
		if (e.key === 'ArrowRight') navigate(1)
	})

	window.addEventListener('popstate', () => {
		if (isOpen) closeModal(false)
	})

	// Prefetch on hover for instant open
	productList.addEventListener('mouseover', (e) => {
		const row = (e.target as HTMLElement).closest<HTMLAnchorElement>('.product-row')
		if (!row || cache.has(row.href)) return
		fetch(row.href)
			.then((r) => r.text())
			.then((html) => cache.set(row.href, html))
			.catch(() => {})
	})
}
