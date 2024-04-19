/*! GPL-V3 */
import './app.css'
import { storageDriver } from '@bonsoirr/storage-driver-auto'

async function initStorageDriver() {
    if (process.env.IS_DEVELOPMENT) {
        const driver = await import('@bonsoirr/storage-driver-localpage')
        await driver.storageDriver.init()
        return driver.storageDriver
    }
    await storageDriver.init()
    return storageDriver
}

initStorageDriver().then(console.log)
