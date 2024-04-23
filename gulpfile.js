import gulp from 'gulp'
import rename from 'gulp-rename'
import replace from 'gulp-replace'
import esbuild from 'esbuild'

const { parallel, src, dest, watch } = gulp

function fixAnonymousName(fn, name) {
	Object.defineProperty(fn, 'name', { value: name })
	return fn
}

function isOnline(platform) {
	return platform === 'online' || platform.startsWith('online-server') || platform === 'online-static'
}

function html(platform) {
	return fixAnonymousName(() => {
		const assets = ['src/index.html']
		const stream = src(assets)

		if (platform !== 'online-static') assets.push('src/settings.html')

		if (platform === 'edge') {
			stream.pipe(replace(`favicon.ico`, `monochrome.png`))
		}

		if (platform.startsWith('online-server')) {
			stream.pipe(replace('<!--feature:online-server', '')).pipe(replace('feature:online-server-->', ''))
		} else {
			stream.pipe(replace(/<!--feature:online-server[^]*feature:online-server-->/, ''))
		}

		if (isOnline(platform)) {
			stream.pipe(replace(`<!-- icon -->`, `<link rel="apple-touch-icon" href="src/assets/apple-touch-icon.png" />`))
			stream.pipe(replace(`<!-- manifest -->`, `<link rel="manifest" href="manifest.webmanifest">`))
		} else {
			stream.pipe(replace(`<!-- webext-storage -->`, `<script src="src/scripts/webext-storage.js"></script>`))
		}

		return stream.pipe(dest(`release/${platform}`))
	}, `html:${platform}`)
}

function scripts(platform, env) {
	return fixAnonymousName(async () => {
		esbuild.buildSync({
			entryPoints: ['src/scripts/index.ts'],
			outfile: `release/${platform}/src/scripts/main.js`,
			format: 'iife',
			bundle: true,
			minifySyntax: env === 'PROD',
			minifyWhitespace: env === 'PROD',
			define: {
				['process.env.STATIC_MODE']: JSON.stringify(platform === 'online-static'),
				ENV: JSON.stringify(env),
			},
		})
	}, `scripts:${platform}`)
}

function ressources(platform) {
	return fixAnonymousName(() => {
		const assetPath = ['src/assets/**', '!src/assets/bonjourr.png']

		if (!isOnline(platform)) {
			assetPath.push('!src/assets/screenshots/**')
		}

		return src(assetPath).pipe(dest(`release/${platform}/src/assets`))
	}, `ressources:${platform}`)
}

function worker(platform) {
	return fixAnonymousName(() => {
		if (isOnline(platform)) {
			return src('src/scripts/services/service-worker.js').pipe(dest(`release/${platform}`))
		} else {
			const services = ['src/scripts/services/background.js', 'src/scripts/services/webext-storage.js']
			return src(services).pipe(dest(`release/${platform}/src/scripts`))
		}
	}, `worker:${platform}`)
}

function manifest(platform) {
	return fixAnonymousName(() => {
		return isOnline(platform)
			? src(`src/manifests/manifest.webmanifest`).pipe(dest(`release/${platform}`))
			: src(`src/manifests/${platform}.json`)
					.pipe(rename('manifest.json'))
					.pipe(dest(`release/${platform}`))
	}, `manifest:${platform}`)
}

function styles(platform, env) {
	return fixAnonymousName(async () => {
		esbuild.buildSync({
			entryPoints: ['src/styles/style.css'],
			outfile: `release/${platform}/src/styles/style.css`,
			bundle: true,
			minify: env === 'PROD',
		})
	}, `styles:${platform}`)
}

function locales(platform) {
	const filenames = isOnline(platform) ? 'translations' : '*'
	return fixAnonymousName(
		() => src(`_locales/**/${filenames}.json`).pipe(dest(`release/${platform}/_locales/`)),
		`locales:${platform}`
	)
}

function buildServer(done) {
	src(['./server/server.js', './server/package.json', 'pnpm-lock.yaml']).pipe(dest('./release/online-server'))
	done()
}

//
// Tasks
//

// Watches style map to make sure everything is compiled
const filesToWatch = ['./_locales/**', './src/*.html', './src/scripts/**', './src/styles/**', './src/manifests/*.json']

// prettier-ignore
const taskOnline = (env) => [
	html('online'),
	styles('online', env),
	worker('online'),
	locales('online'),
	manifest('online'),
	scripts('online', env),
	ressources('online', false),
]

const taskOnlineServer = (env) => [...taskExtension('online-server/client', env), buildServer]

const taskOnlineStatic = (env) => taskExtension('online-static', env)

const taskExtension = (from, env) => [
	html(from),
	worker(from),
	styles(from, env),
	locales(from),
	manifest(from),
	ressources(from),
	scripts(from, env),
]

//
// All Exports
//

export const online = async function () {
	watch(filesToWatch, parallel(...taskOnline('DEV')))
}

export const chrome = async function () {
	watch(filesToWatch, parallel(...taskExtension('chrome', 'DEV')))
}

export const edge = async function () {
	watch(filesToWatch, parallel(...taskExtension('edge', 'DEV')))
}

export const firefox = async function () {
	watch(filesToWatch, parallel(...taskExtension('firefox', 'DEV')))
}

export const safari = async function () {
	watch(filesToWatch, parallel(...taskExtension('safari', 'DEV')))
}

export const test = async function () {
	watch(filesToWatch, parallel(...taskOnline('TEST')))
}

export const onlineServer = async () => {
	watch(filesToWatch, parallel(...taskOnlineServer('DEV')))
}

export const onlineStatic = async () => {
	watch(filesToWatch, parallel(...taskOnlineStatic('DEV')))
}

export const buildtest = parallel(...taskOnline('TEST'))

export const build = parallel(
	...taskOnline('PROD'),
	...taskOnlineServer('PROD'),
	...taskOnlineStatic('PROD'),
	...taskExtension('firefox', 'PROD'),
	...taskExtension('chrome', 'PROD'),
	...taskExtension('edge', 'PROD'),
	...taskExtension('safari', 'PROD')
)
