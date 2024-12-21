import { Compiler, RspackPluginInstance } from '@rspack/core'

/**
 * **see** \@bonsoirr/translation-tool
 *
 *     -> ./src/TranslationRspackPlugin.js
 */
export class TranslationRspackPlugin implements RspackPluginInstance {
    constructor(options: any)

    apply: (compiler: Compiler) => void
}
