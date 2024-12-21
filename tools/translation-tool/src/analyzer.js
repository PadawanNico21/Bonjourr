const { TRANSLATION_ROOT } = require('./config')
const fs = require('fs/promises')
const path = require('path')
const { generate } = require('./generator')
const { parseFile } = require('./yaml')

async function analyze(lang) {
    const summary = {}
    const expectedLines = Object.keys((await generate()).data)

    for (const file of await fs.readdir(TRANSLATION_ROOT)) {
        const langFile = file.replace('.yaml', '')
        if (langFile !== lang && lang !== '*') continue

        const content = await parseFile(path.resolve(TRANSLATION_ROOT, file))

        const translation = content.translation ?? {}
        const keys = Object.keys(translation)
        const entries = Object.entries(translation)

        const translated = entries.filter(
            (v) => v[1] !== '_' && expectedLines.includes(v[0])
        ).length

        const notTranslatedLines = entries
            .filter((v) => v[1] === '_' && expectedLines.includes(v[0]))
            .map((v) => v[0])
        const notTranslatedLinesCount = notTranslatedLines.length

        const missingLines = expectedLines.filter((v) => !keys.includes(v))
        const missingLinesCount = missingLines.length

        const uselessLines = keys.filter((v) => !expectedLines.includes(v))
        const uselessLinesCount = uselessLines.length

        const total = missingLinesCount + keys.length - uselessLinesCount

        const progress = Math.floor((translated / total) * 10_000) / 100

        summary[langFile] = {
            progress,
            missingLinesCount,
            uselessLinesCount,
            missingLines,
            uselessLines,
            notTranslatedLines,
            notTranslatedLinesCount,
            remains: total - translated,
        }
    }
    return summary
}

module.exports = { analyze }
