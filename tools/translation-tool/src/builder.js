const path = require('path')
const { TRANSLATION_ROOT, crawlFiles, ASSETS_ROOT } = require('./config')
const fs = require('fs/promises')
const { parseFile } = require('./yaml')
const { hasher } = require('./hasher')
const {
    getToTranslateElements,
    removeExtrasSpaces,
    shouldTrim,
} = require('./dom')
const { JSDOM } = require('jsdom')
const { minify } = require('html-minifier')

async function builderTranslations() {
    const output = {}
    const hashesRecord = await hasher()

    for (const file of await fs.readdir(TRANSLATION_ROOT)) {
        const filePath = path.resolve(TRANSLATION_ROOT, './' + file)

        const parsedContent = await parseFile(filePath)
        const compactedContent = { $metadata: parsedContent.metadata }
        for (const [key, value] of Object.entries(parsedContent.translation)) {
            if (value !== '_' && hashesRecord[key] !== undefined)
                compactedContent[hashesRecord[key]] = value
        }

        output[filePath] = JSON.stringify(compactedContent)
    }
    return output
}

async function builderHTML(sources, production = false, htmlMinConfig = {}) {
    const assets = await crawlFiles(ASSETS_ROOT)
    const hashesRecord = await hasher()

    const output = {
        'assets/templates.html': '',
    }

    const preReadSources = {}
    Object.entries(sources).forEach((entry) => {
        preReadSources[path.resolve(ASSETS_ROOT, entry[0])] = entry[1]
    })

    for (const file of assets) {
        if (!file.endsWith('.html')) continue

        const dom = new JSDOM(
            preReadSources[file]?.source() ?? (await fs.readFile(file, 'utf-8'))
        ).window

        ;[
            dom.document.body,
            ...Array.from(dom.document.querySelectorAll('template')).map(
                (t) => t.content
            ),
        ].forEach((element) => {
            const result = getToTranslateElements(element)

            result.placeholder.forEach((placeholderElement) => {
                const placeholderContent =
                    placeholderElement.getAttribute('placeholder')
                const hash = hashesRecord[placeholderContent]
                if (!production) {
                    placeholderElement.setAttribute(
                        'data-original-placeholder',
                        placeholderContent
                    )
                }
                placeholderElement.removeAttribute('placeholder')
                placeholderElement.setAttribute(
                    'data-translate-placeholder',
                    hash
                )
            })

            result.textContent.forEach((textContentElement) => {
                const hash =
                    hashesRecord[
                        removeExtrasSpaces(
                            textContentElement.textContent,
                            shouldTrim(textContentElement, dom)
                        )
                    ]
                textContentElement.innerHTML = production
                    ? ''
                    : `<!--Original text: ${textContentElement.textContent} -->`
                textContentElement.setAttribute('data-translate', hash)
            })
        })

        if (/templates[\\/][^.]*\.html$/.test(file)) {
            output['assets/templates.html'] += dom.document.head.innerHTML
        } else if (/pages[\\/]index\.html$/.test(file)) {
            output['index.html'] = production
                ? minify(
                      dom.document.querySelector(':root').innerHTML,
                      htmlMinConfig
                  )
                : dom.document.querySelector(':root').innerHTML
        } else {
            output[
                path.normalize(
                    path.relative(path.resolve(ASSETS_ROOT, '../'), file)
                )
            ] = production
                ? minify(dom.document.body.innerHTML, htmlMinConfig)
                : dom.document.body.innerHTML
        }
    }

    if (production)
        output['assets/templates.html'] = minify(
            output['assets/templates.html'],
            htmlMinConfig
        )

    return output
}

module.exports = { builderTranslations, builderHTML }
