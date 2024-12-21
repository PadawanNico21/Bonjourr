const rspack = require('@rspack/core')
const { builderTranslations, builderHTML } = require('./builder')
const { crawlFiles, ASSETS_ROOT, TRANSLATION_ROOT } = require('./config')

/**
 * @implements {rspack.RspackPluginInstance}
 */
class TranslationRspackPlugin {
    static PLUGIN_NAME = 'TranslationRspackPlugin'

    constructor(options) {
        this.options = options
    }

    /**
     * @param {rspack.Compiler} compiler
     */
    apply(compiler) {
        compiler.hooks.afterCompile.tapPromise(
            TranslationRspackPlugin.PLUGIN_NAME,
            async (compilation) => {
                compilation.fileDependencies.addAll([
                    ...(await crawlFiles(ASSETS_ROOT)).filter((file) =>
                        file.endsWith('.html')
                    ),
                    ...(await crawlFiles(TRANSLATION_ROOT)),
                ])
            }
        )

        compiler.hooks.emit.tapPromise(
            TranslationRspackPlugin.PLUGIN_NAME,
            async (compilation) => {
                const compiledFiles = await builderTranslations()
                const isProduction =
                    compilation.compiler.options.mode !== 'development'
                const alteredHtmlFiles = await builderHTML(
                    {
                        './pages/index.html':
                            compilation.getAsset('index.html').source,
                    },
                    isProduction,
                    this.options
                )

                class Source {
                    constructor(src) {
                        this.src = src
                    }

                    source() {
                        return this.src
                    }
                }

                for (const [path, content] of Object.entries(compiledFiles)) {
                    compilation.emitAsset(
                        'translations/' +
                            path.match(/[\\/]([a-z\-A-Z]+)\.yaml$/)[1] +
                            '.json',
                        new Source(content),
                        {
                            minimized: true,
                            sourceFilename: path,
                        }
                    )
                }

                for (const [path, content] of Object.entries(
                    alteredHtmlFiles
                )) {
                    if (compilation.getAsset(path))
                        compilation.updateAsset(path, new Source(content), {
                            minimized: isProduction,
                        })
                    else
                        compilation.emitAsset(path, new Source(content), {
                            minimized: isProduction,
                        })
                }
            }
        )
    }
}

module.exports = { TranslationRspackPlugin }
