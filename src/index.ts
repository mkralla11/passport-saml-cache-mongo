import * as assert from 'assert'
// CANNOT USE CACHE PROVIDER FROM passport-saml,
// it is stale/not updatee with latest interface,
// must use package that the implementors split
// passport-saml off from, specifically node-saml types
import type { CacheProvider, CacheItem } from 'node-saml'
import mongoose, { Mongoose, Document, model, Model } from 'mongoose'
const Schema = mongoose.Schema
const ObjectId = mongoose.mongo.ObjectId
const ObjectIdType = mongoose.Schema.Types.ObjectId

import { BinaryLike, createHash, randomBytes } from 'crypto'

// Make the key less prone to collision
interface Metadata {
  [key: string]: number | string | null
}

export interface SamlSsoSchemaInterface extends Document {
  // _id?: ObjectId
  key: string
  value: string
  createdAt: Date
  meta?: Metadata
}

export interface SchemaAndModelArg {
  // expires: number
}

export function createPassportSamlCacheMongoCollectionSchemaAndModel(config?: SchemaAndModelArg) {
  return new Schema<SamlSsoSchemaInterface>({
    key: {
      type: String,
      required: true,
      index: true,
      unique: true,
    },
    value: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      required: true,
    },
    meta: {
      type: Schema.Types.Mixed,
    },
  })
}

export interface Logger {
  info: (message: string) => void
  error: (message: string, err: Error) => void
}
export interface Options {
  /**
   * The maximum age of a cache entry in milliseconds. Entries older than this are deleted automatically.
   * Mongo automatically deletes entries using ttl mongo option every `ttlMillis` milliseconds.
   *
   * Default value: 10 minutes.
   */
  ttlMillis?: number
  /** A logger to use. By default, messages are logged to console. */
  logger?: Logger
}

const defaultOptions: Required<Options> = {
  ttlMillis: 600000,
  logger: console,
}

// interface ModelAndSchema<ModelType, SchemaType> {
//   model: ModelType
//   schema: SchemaType
// }

export interface MongoCacheProvider extends CacheProvider {
  /** Close the cache. This stops the scheduled job that deletes old cache entries. */
  close: () => void
  // getModelAndSchema: <ModelType, SchemaType>() => ModelAndSchema<ModelType, SchemaType>
}

interface QueryResult {
  value: string
}

/** Create a new Mongo cache provider for passport-saml. */
export default function mongoCacheProvider(
  model: Model<SamlSsoSchemaInterface>,
  options?: Options
): MongoCacheProvider {
  const { ttlMillis, logger } = { ...defaultOptions, ...options }

  assert.ok(Number.isInteger(ttlMillis) && ttlMillis > 0, 'ttlMillis must be a positive integer')
  let closed = false
  let timer: ReturnType<typeof setTimeout>
  function expiredSweeper() {
    async function sweep() {
      const nowMs = Date.now()
      if (!closed) {
        await model.deleteMany({ createdAt: { $lte: nowMs - ttlMillis } })
      }
      timer = setTimeout(() => {
        sweep().catch((e: Error) => logger.error(e.message, e))
      }, ttlMillis)
    }
    sweep().catch((e: Error) => logger.error(e.message, e))
  }

  expiredSweeper()

  return {
    getAsync: async function (key: string) {
      const res: Array<SamlSsoSchemaInterface> = await model.find({ key })
      return res.length ? res[0].value : null
    },
    saveAsync: async function (key: string, value: string, meta?: Metadata) {
      const createdAtDate = new Date()
      const item: CacheItem = {
        createdAt: createdAtDate.getTime(),
        value,
      }

      const res = await model.create({ key, ...item, createdAt: createdAtDate, meta })

      // const res = await mongo.set(`${hashedKey}:${key}`, JSON.stringify(item), 'PX', ttlMillis, 'NX')
      // if (res !== 'OK') {
      //   throw new Error('duplicate key value is not allowed')
      // }

      // return item
      return item
    },
    removeAsync: async function (key: string) {
      const { deletedCount } = await model.deleteOne({ key })
      return deletedCount > 0 ? key : null
    },
    // getModelAndSchema: function () {
    //   return {
    //     model: SamlSsoAttemptsModel,
    //     schema: SamlSsoAttemptsSchema,
    //   }
    // },
    close: function () {
      clearTimeout(timer)
      closed = true
    },
  }
}
