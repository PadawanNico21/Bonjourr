import {
    StorageDriver,
    StorageDriverForFeature,
    StorageKeyTypes,
    StorageSchema,
    storageSchema,
} from '@bonsoirr/storage-driver-base'

export class StorageDriverLocalPage implements StorageDriver {
    private storage!: StorageSchema

    async init(): Promise<void> {
        console.info(
            'Using',
            StorageDriverLocalPage,
            'as the storage driver',
            '(',
            this,
            ')'
        )

        const storageConfig =
            localStorage.getItem('bonsoirr') ?? localStorage.getItem('bonjourr')

        this.storage = await storageSchema.parseAsync(
            storageConfig ? JSON.parse(storageConfig) : {}
        )
    }

    getByPath(path: string): Promise<StorageKeyTypes> {
        throw new Error('Method not implemented.')
    }
    setByPath(path: string, value: StorageKeyTypes): Promise<void> {
        throw new Error('Method not implemented.')
    }
    watchUpdateByPath(
        path: string,
        callback: (oldValue: StorageKeyTypes, newValue: StorageKeyTypes) => void
    ): void {
        throw new Error('Method not implemented.')
    }
    allocateForFeature(feature: string): Promise<StorageDriverForFeature> {
        throw new Error('Method not implemented.')
    }
}

export const storageDriver = new StorageDriverLocalPage()
