import { translationList } from './translation-list'

const LANG_RE = /[a-z]{2}-[A-Z]{2}/
type ParamsType = Record<string, string>

export class Translator {
    static fallbackTranslation: Record<string, string>

    private translation?: Record<string, string> & {
        $metadata: {
            contributors: string[]
            lang: string
        }
    }

    replaceParamsWithValues(text: string, params: ParamsType): string {
        let output = text
        for (const [key, value] of Object.entries(params)) {
            output = output.replace(
                new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g'),
                value
            )
        }
        return output
    }

    translateText(
        text: typeof translationList[number],
        params: ParamsType = {}
    ): string {
        return this.translateTextUnsafe(text, params)
    }

    private translateTextUnsafe(id: string | null, params: ParamsType = {}) {
        if (!id) return ''
        if (!this.translation)
            return this.replaceParamsWithValues(
                Translator.fallbackTranslation[id],
                params
            )

        return this.replaceParamsWithValues(
            this.translation[id] ?? Translator.fallbackTranslation[id],
            params
        )
    }

    private getToTranslateTextContentElements(
        element: Element | DocumentFragment
    ): HTMLElement[] {
        return Array.from(
            element.querySelectorAll<HTMLElement>('[data-translate]')
        )
    }

    private getToTranslatePlaceholderElements(
        element: Element | DocumentFragment
    ): HTMLElement[] {
        return Array.from(
            element.querySelectorAll<HTMLElement>(
                '[data-translate-placeholder]'
            )
        )
    }

    translatePage() {
        const toTranslateInTemplates = Array.from(
            document.querySelectorAll('template')
        )
        const toTranslateTextContentElements =
            this.getToTranslateTextContentElements(document.body)
        const toTranslatePlaceholderElements =
            this.getToTranslatePlaceholderElements(document.body)

        for (const template of toTranslateInTemplates) {
            toTranslateTextContentElements.push(
                ...this.getToTranslateTextContentElements(template.content)
            )
            toTranslatePlaceholderElements.push(
                ...this.getToTranslatePlaceholderElements(template.content)
            )
        }

        toTranslateTextContentElements.forEach((element) => {
            element.innerText = this.translateTextUnsafe(
                element.getAttribute('data-translate')
            )
        })
        toTranslatePlaceholderElements.forEach((element) => {
            element.setAttribute(
                'placeholder',
                this.translateTextUnsafe(
                    element.getAttribute('data-translate-placeholder')
                )
            )
        })

        document
            .querySelector(':root')
            ?.setAttribute('lang', this.translation?.$metadata.lang ?? 'en-US')
    }

    async loadLang(lang: string): Promise<void> {
        if (!LANG_RE.test(lang))
            throw new Error(`Invalid lang provided ('${lang}')`)

        const request = await fetch(`/translations/${lang}.json`)
        if (request.status !== 200) throw new Error('Lang not found')

        this.translation = await request.json()
        this.translation!.$metadata.lang = lang
        console.log(
            `%cLoaded %c${lang}%c, thanks to %c${this.translation!.$metadata.contributors.join(
                ', '
            )} %cfor making this translation.`,
            'color: white',
            'font-weight: bold',
            'color: white',
            'color: green',
            'color: white'
        )
    }
}

export const fallbackTranslationReadyPromise = (async () => {
    const request = await fetch(`/translations/en-US.json`, {
        priority: 'high',
    })
    if (request.status !== 200) throw new Error('Lang not found')

    const fallbackTrans = await request.json()
    Translator.fallbackTranslation = fallbackTrans
})()
