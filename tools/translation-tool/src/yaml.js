const YAML = require('yaml')
const fs = require('fs/promises')

async function parseFile(file) {
    const documents = YAML.parseAllDocuments(
        await fs.readFile(file, 'utf-8')
    ).map((document) => document.toJSON())

    const output = { metadata: null, translation: null }

    for (const document of documents) {
        if (document.metadata) {
            output.metadata = document.metadata
        } else if (output.translation) {
            output.translation = { ...output.translation, ...document }
        } else {
            output.translation = document
        }
    }

    return output
}

function stringify(translation, metadata) {
    const metaString = YAML.stringify({ metadata }, { indent: 4 })
    const translationString = YAML.stringify(translation, { indent: 4 })
    const output = `---\n${metaString}---\n${translationString}`

    return output
}

async function stringifyTo(translation, metadata, file) {
    await fs.writeFile(file, stringify(translation, metadata), 'utf-8')
}

module.exports = { parseFile, stringifyTo, stringify }
