/*! GPL-V3 */
import { Translator, fallbackTranslationReadyPromise } from './Translator'
import './app.css'
import { storageDriver } from '@bonsoirr/storage-driver-auto'

if ('serviceWorker' in navigator && process.env.IS_PRODUCTION) {
    navigator.serviceWorker
        .register('/service-worker.js')
        .then(() => {
            console.log('Service Worker reggistered !')
        })
        .catch((err) => {
            console.error('Unable to reggister the service worker:', err)
        })
}

async function initStorageDriver() {
    if (process.env.IS_DEVELOPMENT) {
        const driver = await import('@bonsoirr/storage-driver-localpage')
        await driver.storageDriver.init()
        return driver.storageDriver
    }
    await storageDriver.init()
    return storageDriver
}

async function main() {
    const result = await initStorageDriver()
    console.log(result)

    const t = new Translator()

    await t.loadLang('fr-FR')
    await fallbackTranslationReadyPromise
    t.translatePage()
}

main()
