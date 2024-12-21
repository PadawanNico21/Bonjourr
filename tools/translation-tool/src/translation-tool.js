const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const fs = require('fs/promises')
const { generate } = require('./generator')
const { analyze } = require('./analyzer')
const { TRANSLATION_ROOT } = require('./config')
const path = require('path')
const { updater } = require('./updater')

const langRe = /^[a-z]{2}-[A-Z]{2}$/

yargs(hideBin(process.argv))
    .scriptName('translation-tool')
    .command(
        'generate <lang>',
        'Generate translation file for the specified lang',
        (yargs) =>
            yargs
                .positional('lang', {
                    describe: 'lang to generate',
                })
                .option('use-key-as-value', {
                    default: false,
                    describe:
                        'Use the translation key as value useful for creating english translations',
                    alias: 'K',
                    type: 'boolean',
                }),
        async (argv) => {
            if (!langRe.test(argv.lang)) {
                console.log(
                    'Invalid lang, the specified lang should be of the format country-LOCALE'
                )
                return
            }
            const translationPath = path.resolve(
                TRANSLATION_ROOT,
                `./${argv.lang}.yaml`
            )
            try {
                await fs.stat(translationPath)
                console.log(
                    `The translation "${argv.lang}" already exists.\nUse \x1B[1mtranslation-tool update ${argv.lang}\x1B[0m if you want to update the translation.`
                )
                return
            } catch {}

            process.stdout.write('Generating...\b\b\b')
            const translation = await generate({
                keyToValues: argv.K,
            })
            process.stdout.write(` (will write in ${translationPath})...\r`)
            await fs.writeFile(translationPath, translation.content, 'utf-8')
            console.log(`\x1B[2KGenerated "${argv.lang}".`)
        }
    )
    .command(
        'update [lang]',
        'Update translation file for the specified lang',
        (yargs) =>
            yargs
                .positional('lang', {
                    describe: 'lang to update',
                    default: '*',
                })
                .option('use-key-as-value', {
                    default: false,
                    describe:
                        'Use the translation key as value useful for creating english translations',
                    alias: 'K',
                    type: 'boolean',
                })
                .option('diff', {
                    default: false,
                    describe:
                        'Will show the difference and not modify the files',
                    alias: 'D',
                    type: 'boolean',
                }),

        async (argv) => {
            if (!langRe.test(argv.lang) && argv.lang !== '*') {
                console.log(
                    'Invalid lang, the specified lang should be of the format country-LOCALE or *'
                )
                return
            }
            await updater(argv.lang, { keyToValues: argv.K, diff: argv.diff })
        }
    )
    .command(
        'analyze [lang]',
        'Analyze how much is translated',
        (yargs) =>
            yargs.positional('lang', {
                describe: 'lang to be analyzed',
                default: '*',
            }),
        async (argv) => {
            process.stdout.write('Analyzing...\r')
            const summary = await analyze(argv.lang)

            const table = []
            Object.entries(summary).forEach((v) =>
                table.push({
                    ...v[1],
                    progress: v[1].progress + ' %',
                    lang: v[0],
                })
            )

            if (table.length === 0) {
                console.log('No translation found')
                return
            }

            console.table(table, [
                'lang',
                'progress',
                'uselessLinesCount',
                'missingLinesCount',
                'remains',
            ])
        }
    )
    // .option('commit', {
    //     alias: 'C',
    //     boolean: true,
    //     default: false,
    //     describe: 'Auto commit of the translation file',
    // })
    .strictCommands()
    .demandCommand(1)
    .parse()
