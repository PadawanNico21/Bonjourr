const path = require('path')
const fs = require('fs/promises')
const { TRANSLATION_ROOT } = require('./config')
const { generate } = require('./generator')
const { parseFile, stringifyTo } = require('./yaml')

async function updater(lang, options = {}) {
    const expectedTranslation = (await generate()).data

    for (const file of await fs.readdir(TRANSLATION_ROOT)) {
        const langFile = file.replace('.yaml', '')
        if (langFile !== lang && lang !== '*') continue
        process.stdout.write(
            options.diff
                ? `Checking diff ${langFile}...\r`
                : `Updating "${langFile}" ...\b\b\b`
        )

        const filePath = path.resolve(TRANSLATION_ROOT, file)
        const content = await parseFile(filePath)

        const translation = content.translation ?? {}
        const toAppend = {}
        const additions = []
        const deletions = []

        for (const key of Object.keys(expectedTranslation)) {
            if (translation[key] === undefined) {
                toAppend[key] = options.keyToValues ? key : '_'
                additions.push(key)
            }
        }

        for (const key of Object.keys(translation)) {
            if (expectedTranslation[key] === undefined) {
                delete translation[key]
                deletions.push(key)
            }
        }

        const updatedTranslation = {
            ...translation,
            ...toAppend,
        }

        if (options.diff) {
            process.stdout.write(`Diff summary of "${langFile}":\n\n`)
            process.stdout.write(
                additions.map((key) => `\x1B[32m+\x1B[0m ${key}\n`).join('')
            )
            process.stdout.write(
                deletions.map((key) => `\x1B[31m-\x1B[0m ${key}\n`).join('')
            )
            process.stdout.write('\n')
            continue
        }

        await stringifyTo(
            updatedTranslation,
            content.metadata ?? { contributors: ['No contributors provided'] },
            filePath
        )

        process.stdout.write(
            `+\x1B[32m${additions.length}\x1B[0m -\x1B[31m${deletions.length}\x1B[0m\n`
        )
    }
}

module.exports = { updater }
