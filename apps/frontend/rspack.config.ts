import { Configuration } from '@rspack/cli'
import { HtmlRspackPlugin, DefinePlugin } from '@rspack/core'
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
            minify: !isDev,
            template: './assets/pages/index.html',
        }),
        new DefinePlugin({
            ['process.env.MODE']: isDev ? '"development"' : '"production"',
            ['process.env.IS_PRODUCTION']: !isDev,
            ['process.env.IS_DEVELOPMENT']: isDev,
        }),
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
