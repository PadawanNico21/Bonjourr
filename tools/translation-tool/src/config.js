const path = require('path')
const fs = require('fs/promises')

const TRANSLATION_ROOT = path.resolve(__dirname, '../../../translations')
const ASSETS_ROOT = path.resolve(__dirname, '../../../apps/frontend/assets')
const JS_TRANSLATION_LIST_PATH = path.resolve(
    ASSETS_ROOT,
    '../src/translation-list.ts'
)

/**
 *
 * @param {string} root
 * @returns {Promise<string[]>}
 */
async function crawlFiles(root) {
    const output = []
    for (const file of await fs.readdir(root, { withFileTypes: true })) {
        if (file.isFile()) {
            output.push(path.resolve(root, './' + file.name))
        } else if (file.isDirectory()) {
            output.push(
                ...(await crawlFiles(path.resolve(root, './' + file.name)))
            )
        } else {
            console.warn('Unhandled type of file', file.name)
        }
    }
    return output
}

module.exports = {
    TRANSLATION_ROOT,
    ASSETS_ROOT,
    JS_TRANSLATION_LIST_PATH,
    crawlFiles,
}
