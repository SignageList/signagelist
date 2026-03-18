import type { FilterEngine } from './filter'

export function initAuthenticationDropdown(engine: FilterEngine): void {
	const toggle = document.querySelector<HTMLButtonElement>('#authentication-dropdown-toggle')
	const dropdown = document.querySelector<HTMLDivElement>('#authentication-dropdown')
	if (!toggle || !dropdown) return

	// Toggle dropdown visibility
	toggle.addEventListener('click', (e) => {
		e.stopPropagation()
		const isHidden = dropdown.classList.toggle('hidden')
		toggle.setAttribute('aria-expanded', String(!isHidden))
	})

	// Close on outside click
	document.addEventListener('click', (e) => {
		if (!dropdown.contains(e.target as Node) && e.target !== toggle) {
			dropdown.classList.add('hidden')
			toggle.setAttribute('aria-expanded', 'false')
		}
	})

	// Authentication checkbox changes (desktop dropdown)
	const checkboxes = dropdown.querySelectorAll<HTMLInputElement>('[data-authentication-checkbox]')
	for (const cb of checkboxes) {
		cb.addEventListener('change', () => {
			const authentication = getSelectedAuthentication(dropdown)
			// Sync mobile checkboxes
			syncAuthenticationCheckboxes(authentication, 'authentication-dropdown-mobile')
			engine.setState({ selectedAuthentication: authentication })
			updateAuthenticationLabel(authentication)
		})
	}

	// Mobile dropdown
	const toggleMobile = document.querySelector<HTMLButtonElement>('#authentication-dropdown-toggle-mobile')
	const dropdownMobile = document.querySelector<HTMLDivElement>('#authentication-dropdown-mobile')
	if (toggleMobile && dropdownMobile) {
		toggleMobile.addEventListener('click', (e) => {
			e.stopPropagation()
			const isHidden = dropdownMobile.classList.toggle('hidden')
			toggleMobile.setAttribute('aria-expanded', String(!isHidden))
		})

		document.addEventListener('click', (e) => {
			if (!dropdownMobile.contains(e.target as Node) && e.target !== toggleMobile) {
				dropdownMobile.classList.add('hidden')
				toggleMobile.setAttribute('aria-expanded', 'false')
			}
		})

		const mobileCheckboxes = dropdownMobile.querySelectorAll<HTMLInputElement>('[data-authentication-checkbox]')
		for (const cb of mobileCheckboxes) {
			cb.addEventListener('change', () => {
				const authentication = getSelectedAuthentication(dropdownMobile)
				// Sync desktop checkboxes
				syncAuthenticationCheckboxes(authentication, 'authentication-dropdown')
				engine.setState({ selectedAuthentication: authentication })
				updateAuthenticationLabel(authentication)
			})
		}
	}

	// Init label from state
	updateAuthenticationLabel(engine.getState().selectedAuthentication)
}

function getSelectedAuthentication(container: HTMLElement): string[] {
	const checked = container.querySelectorAll<HTMLInputElement>('[data-authentication-checkbox]:checked')
	return Array.from(checked).map((cb) => cb.dataset.authenticationCheckbox!)
}

function syncAuthenticationCheckboxes(selected: string[], containerId: string): void {
	const container = document.getElementById(containerId)
	if (!container) return
	const checkboxes = container.querySelectorAll<HTMLInputElement>('[data-authentication-checkbox]')
	for (const cb of checkboxes) {
		cb.checked = selected.includes(cb.dataset.authenticationCheckbox || '')
	}
}

function updateAuthenticationLabel(authentication: string[]): void {
	const labels = document.querySelectorAll('.authentication-label')
	for (const label of labels) {
		if (authentication.length === 0) {
			label.textContent = 'Authentication'
		} else if (authentication.length === 1) {
			label.textContent = formatAuthenticationName(authentication[0])
		} else {
			label.textContent = `${authentication.length} methods`
		}
	}
}

function formatAuthenticationName(key: string): string {
	const names: Record<string, string> = {
		sso: 'SSO',
		saml: 'SAML',
	}
	return names[key] || key
}
