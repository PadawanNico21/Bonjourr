import { z } from 'zod'
import {
    Region,
    SearchAutosuggestionProvider,
    ServerType,
    Size,
    Theme,
    Unit,
} from './enums.ts'

export const storageSchema = z.object({
    version: z
        .string()
        .regex(/^v?\d+\.\d+\.\d+(?:-[^]+)?$/i)
        .default('v1.0.0'),

    features: z
        .object({
            clock: z
                .object({
                    size: z.nativeEnum(Size).default(Size.Medium),
                    twelveHoursFormat: z.boolean().default(false),
                    showSeconds: z.boolean().default(false),
                    analogMode: z.boolean().default(false),
                })
                .default({}),
            notes: z.object({}).default({}),
            quotes: z.object({}).default({}),
            searchbar: z
                .object({
                    autoSuggestions: z.boolean().default(true),
                    openInNewTab: z.boolean().default(false),
                    searchEngineURL: z
                        .string()
                        .default('https://google.com/search?q={{search}}'),
                    autoSuggestionsProvider: z
                        .nativeEnum(SearchAutosuggestionProvider)
                        .default(SearchAutosuggestionProvider.Google),
                })
                .default({}),
            weather: z.object({}).default({}),
        })
        .default({}),

    featuresEnabled: z.array(z.string()).default(['clock', 'weather']),

    layout: z.object({}).default({}),

    style: z
        .object({
            fontFamily: z.string().default('$default'),
            fontSize: z.number().default(14),
            fontWeight: z.number().default(400),

            backgroundBlur: z.number().default(12),
            backgroundBrightness: z.number().min(0).max(1).default(0.8),
            backgroundImage: z.string().default('$unsplash'),
            backgroundUpdateFrequency: z.number().default(3600),

            theme: z.nativeEnum(Theme).default(Theme.System),
            customCSS: z.string().default(''),
        })
        .default({}),

    locales: z
        .object({
            region: z.nativeEnum(Region).default(Region.Europe),
            timezone: z.string().default('system'),
            lang: z.string().default('system'),
            unit: z.nativeEnum(Unit).default(Unit.Metric),
        })
        .default({}),

    server: z
        .object({
            type: z.nativeEnum(ServerType).default(ServerType.LocalPage),
            url: z.string().default('_'),
        })
        .default({}),
})

export type StorageSchema = z.infer<typeof storageSchema>

export type StorageKeyTypes = string | number | (string | number)[]

export interface StorageDriver {
    init(): Promise<void>

    getByPath(path: string): Promise<StorageKeyTypes>
    setByPath(path: string, value: StorageKeyTypes): Promise<void>

    watchUpdateByPath(
        path: string,
        callback: (oldValue: StorageKeyTypes, newValue: StorageKeyTypes) => void
    ): void

    allocateForFeature(feature: string): Promise<StorageDriverForFeature>
}

export interface StorageDriverForFeature {
    get(key: string): Promise<StorageKeyTypes>
    set(key: string, value: StorageKeyTypes): Promise<void>
}
