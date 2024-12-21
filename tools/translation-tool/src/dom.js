const fs = require('fs/promises')
const { JS_TRANSLATION_LIST_PATH } = require('./config')
const { JSDOM } = require('jsdom')

function removeExtrasSpaces(content, shouldTrim) {
    return (shouldTrim ? content.trim() : content).replace(/\s+/g, ' ')
}

function getToTranslateElements(element) {
    return {
        textContent: Array.from(element.querySelectorAll('[data-translate]')),
        placeholder: Array.from(
            element.querySelectorAll('[data-translate-placeholder]')
        ),
    }
}

function shouldTrim(element, window) {
    return !(
        element instanceof window.HTMLAnchorElement ||
        element instanceof window.HTMLSpanElement
    )
}

function getToTranslate(element, win) {
    const { textContent, placeholder } = getToTranslateElements(element)

    return [
        ...textContent.map((node) =>
            removeExtrasSpaces(node.textContent, shouldTrim(node, win))
        ),
        ...placeholder.map(
            (node) =>
                node.getAttribute('placeholder') ??
                console.warn('Empty placeholder detected')
        ),
    ]
}

async function getInJSTranslations() {
    const content = await fs.readFile(JS_TRANSLATION_LIST_PATH, 'utf-8')
    const arrayMatch = /translationList\s*=\s*(\[[^]+\])\s+as\s+const/.exec(
        content
    )

    if (!arrayMatch) return []

    const safeJSON = arrayMatch[1]
        .replace(/"/g, '\\"')
        .replace(/'/g, '"')
        .replace(/,\s*\]/, ']')

    return JSON.parse(safeJSON)
}

async function getTranslationsKeysFromFile(file) {
    const translationKeys = []
    const content = await fs.readFile(file, 'utf-8')
    const win = new JSDOM(content).window
    const dom = win.document

    dom.querySelectorAll('template').forEach((template) => {
        translationKeys.push(...getToTranslate(template.content, win))
    })

    translationKeys.push(...getToTranslate(dom, win))

    return translationKeys
}

module.exports = {
    removeExtrasSpaces,
    getToTranslate,
    getInJSTranslations,
    getTranslationsKeysFromFile,
    getToTranslateElements,
    shouldTrim,
}
