import { StorageDriver } from '@bonsoirr/storage-driver-base'

/* 
  This package is automatically replaced at compile time
 */

export declare const storageDriver: StorageDriver

if (process.env.IS_PRODUCTION)
    throw new Error('Unable to get the StorageDriver')
