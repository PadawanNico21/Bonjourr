import { Configuration } from '@rspack/cli'
import { DefinePlugin, CopyRspackPlugin } from '@rspack/core'
import HtmlRspackPlugin from 'html-rspack-plugin'
import { TranslationRspackPlugin } from '@bonsoirr/translation-tool'
import WorkboxPlugin from 'workbox-webpack-plugin'

import { resolve } from 'path'

const isDev = !!(
    process.env.NODE_ENV === 'development' ||
    process.env.DEVELOPMENT ||
    process.env.MODE === 'development'
)

const commonConfig: Configuration = {
    mode: isDev ? 'development' : 'production',
    devtool: isDev ? 'eval-source-map' : 'cheap-source-map',
    entry: {
        main: './src/main.ts',
    },
    output: {
        clean: true,
        filename: '[contenthash].[name].js',
        publicPath: '/',
    },
    context: __dirname,
    stats: 'normal',
    plugins: [
        new HtmlRspackPlugin({
            minify: false,
            template: './assets/pages/index.html',
        }),
        new CopyRspackPlugin({
            patterns: [
                {
                    from: 'assets/svgs',
                    to: 'assets/svgs',
                },
            ],
        }),
        new DefinePlugin({
            ['process.env.MODE']: isDev ? '"development"' : '"production"',
            ['process.env.IS_PRODUCTION']: !isDev,
            ['process.env.IS_DEVELOPMENT']: isDev,
        }),
        new TranslationRspackPlugin({
            collapseWhitespace: true,
            keepClosingSlash: false,
            removeComments: true,
            removeRedundantAttributes: true,
            removeScriptTypeAttributes: true,
            removeStyleLinkTypeAttributes: true,
            html5: true,
        }),
        ...(!isDev
            ? [
                  new WorkboxPlugin.GenerateSW({
                      exclude: ['index.html', /\.json$/],
                      clientsClaim: true,
                  }) as any,
              ]
            : []),
    ],
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: [/node_modules/],
                loader: 'builtin:swc-loader',
                options: {
                    sourceMap: true,
                    jsc: {
                        parser: {
                            syntax: 'typescript',
                        },
                    },
                },
                type: 'javascript/auto',
            },
        ],
    },
    resolve: {
        extensions: ['.js', '.ts'],
    },
}

function createConfig({
    buildName,
    storageDriver,
}: {
    buildName: string
    storageDriver: string
}): Configuration {
    const config = { ...commonConfig }
    if (!config.output) config.output = {}
    if (!config.resolve) config.resolve = {}
    if (!config.resolve.alias) config.resolve.alias = {}

    config.name = buildName
    config.output.path = resolve(__dirname, './dist/' + buildName)

    config.resolve.alias['@bonsoirr/storage-driver-auto$'] = storageDriver

    return config
}

export default [
    createConfig({
        buildName: 'webpage',
        storageDriver: '@bonsoirr/storage-driver-localpage',
    }),
]
