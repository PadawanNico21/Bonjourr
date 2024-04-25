import { settingsInit } from '../settings'
import storage from '../storage'

function toggleSettingsMenu() {
	settingsInit().then(() => {
		document.dispatchEvent(new Event('toggle-settings'))
	})
}

function openSettingsMenu() {
	const isOpen = document.getElementById('settings')?.classList.contains('shown')
	if (isOpen) return

	toggleSettingsMenu()
}

function closeSettingsMenu() {
	const isOpen = document.getElementById('settings')?.classList.contains('shown')
	if (!isOpen) return

	toggleSettingsMenu()
}

async function handleUpdateToServer() {
	const storageSession = localStorage.getItem('session')
	if (!storageSession) return closeSettingsMenu()
	const session = JSON.parse(storageSession)

	const domUpdateMessage = document.getElementById('update-to-server-message')!
	domUpdateMessage.style.color = 'var(--color-light-text)'
	domUpdateMessage.innerText = 'Loading...'

	const res = await fetch('./api/config', {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${session.token}`,
		},
		body: JSON.stringify(await storage.sync.get()),
	})

	domUpdateMessage.innerText = await res.text()
	domUpdateMessage.style.color = `var(--color-${res.status === 200 ? 'blue' : 'red'})`
}

function handleLogout() {
	closeSettingsMenu()
	localStorage.removeItem('session')
	document.location.hash = ''
}

export function initOnlineVersion() {
	const domLoginToSettings = document.getElementById('login-to-settings') as HTMLDialogElement
	const domLoginForm = document.getElementById('login-form')
	const domLoginUsername = document.getElementById('login-username') as HTMLInputElement
	const domLoginPassword = document.getElementById('login-password') as HTMLInputElement
	const domLoginMessage = document.getElementById('login-form-message')!

	const onlineRemoteConfigFeatureEnabled = !!domLoginToSettings

	if (onlineRemoteConfigFeatureEnabled) {
		const handleLocationHash = () => {
			if (document.location.hash === '#admin') {
				const session = localStorage.getItem('session')
				if (session) {
					const sessionParsed = JSON.parse(session)
					if (sessionParsed.expires <= Date.now()) {
						closeSettingsMenu()
						domLoginToSettings.show()
						return
					}
					openSettingsMenu()
				} else {
					closeSettingsMenu()
					domLoginToSettings.show()
				}
			} else {
				closeSettingsMenu()
				domLoginToSettings.close()
			}
		}

		handleLocationHash()

		window.addEventListener('hashchange', handleLocationHash)

		domLoginForm!.addEventListener('submit', async (ev) => {
			ev.preventDefault()
			const password = domLoginPassword.value
			domLoginPassword.value = ''
			try {
				const res = await fetch('./api/login', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({ username: domLoginUsername.value, password: password }),
				})
				const resJson = await res.json()

				if (res.status !== 200) {
					console.error(resJson.error)
					domLoginMessage.innerText = resJson.error
					return
				}
				domLoginMessage.innerText = ''

				domLoginToSettings.close()
				localStorage.setItem('session', JSON.stringify(resJson))
				openSettingsMenu()
			} catch (err) {
				console.error(err)
			}
		})
	}
}

export function addHandlersToSettings() {
	const domUpdateToServer = document.getElementById('update-to-server')
	const domLogout = document.getElementById('logout')

	domUpdateToServer?.addEventListener('click', handleUpdateToServer)
	domLogout?.addEventListener('click', handleLogout)
}

export const isReadonlyModeOrInServer = !!document.getElementById('login-to-settings') || process.env.STATIC_MODE
