export function initGitHubStars(): void {
	const elements = document.querySelectorAll<HTMLElement>('[data-github-repo]')
	if (!elements.length) return

	for (const el of elements) {
		const repo = el.dataset.githubRepo
		if (!repo) continue

		const row = el.closest('[data-github-stars-row]')

		const cached = sessionStorage.getItem(`gh-stars-${repo}`)
		if (cached) {
			showStars(el, row, Number.parseInt(cached, 10))
			continue
		}

		fetch(`https://api.github.com/repos/${repo}`)
			.then((r) => (r.ok ? r.json() : null))
			.then((data) => {
				if (!data?.stargazers_count) return
				const count = data.stargazers_count
				sessionStorage.setItem(`gh-stars-${repo}`, String(count))
				showStars(el, row, count)
			})
			.catch(() => {})
	}
}

function showStars(el: HTMLElement, row: Element | null, count: number): void {
	el.insertAdjacentText('beforeend', formatStars(count))
	row?.classList.remove('hidden')
}

function formatStars(count: number): string {
	if (count >= 1000) return `${(count / 1000).toFixed(1)}k`
	return String(count)
}
