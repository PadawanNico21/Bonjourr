const { ASSETS_ROOT, crawlFiles } = require('./config')
const { stringify } = require('./yaml')
const { getTranslationsKeysFromFile, getInJSTranslations } = require('./dom.js')

async function generate(options = {}) {
    const files = await crawlFiles(ASSETS_ROOT)

    const translationKeys = []

    for (const file of files) {
        if (file.endsWith('.html')) {
            translationKeys.push(...(await getTranslationsKeysFromFile(file)))
        }
    }
    const translationObj = {}
    for (const k of [...translationKeys, ...(await getInJSTranslations())]) {
        translationObj[k] = options.keyToValues ? k : '_'
    }

    return {
        content: stringify(translationObj, {
            contributors: ['<Your name here>'],
        }),
        data: translationObj,
    }
}

module.exports = { generate }
