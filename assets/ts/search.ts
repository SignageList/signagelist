import type { FilterEngine } from './filter'

export function initSearch(engine: FilterEngine): void {
	const input = document.querySelector<HTMLInputElement>('#search-input')
	const clearBtn = document.querySelector<HTMLButtonElement>('#search-clear')
	if (!input) return

	let debounceTimer: ReturnType<typeof setTimeout>

	input.addEventListener('input', () => {
		clearTimeout(debounceTimer)
		debounceTimer = setTimeout(() => {
			engine.setState({ searchTerm: input.value.trim() })
			if (clearBtn) {
				clearBtn.classList.toggle('hidden', !input.value)
			}
		}, 200)
	})

	if (clearBtn) {
		clearBtn.addEventListener('click', () => {
			input.value = ''
			engine.setState({ searchTerm: '' })
			clearBtn.classList.add('hidden')
			input.focus()
		})
	}
}
