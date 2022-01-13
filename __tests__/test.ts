import mongoCacheProvider, { MongoCacheProvider } from '../src'
import { promisify } from 'util'
import { promises as fs } from 'fs'
import * as path from 'path'
import type { CacheItem } from 'node-saml'
import mongoose, { Mongoose } from 'mongoose'
import connectToMongo, { MongoCredsInterface, ConnectToMongoReturnVal } from '../helpers/connectToMongo'
import { MongoClient, CollectionInfo } from 'mongodb'

declare const process: {
  env: {
    NODE_ENV: string
    MONGO_HOST: string
    MONGO_PORT: string
    // MONGO_PASSWORD: string
    // MONGO_USERNAME: string
    MONGO_DB_NAME: string
  }
}

async function dropAllMongoData(client: MongoClient) {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('Cannot drop all mongo data unless you are in test environment')
  }

  await client
    .db()
    .listCollections()
    .map(async (c: CollectionInfo) => {
      try {
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        await client.db().collection(c.name).deleteMany({})
      } catch (e) {
        // console.log('could not drop collection, ignoring', c.collectionName)
        // we don't care about this error at this point,
        // we are just trying to clean everything up
      }
    })
    .toArray()
}

describe('test suite', function () {
  const ttlMillis = 2000
  const delay = promisify(setTimeout)

  const collectionName = 'SamlSsoAttemptsNamed'
  let mongo: Mongoose
  let mongoClient: MongoClient
  let cache: MongoCacheProvider
  let getAsync: (key: string) => Promise<string | null>
  let saveAsync: (key: string, value: any) => Promise<CacheItem | null>
  let removeAsync: (key: string) => string | Promise<string | null>

  beforeAll(async function () {
    const { MONGO_HOST, MONGO_PORT, MONGO_DB_NAME } = process.env

    const mongoCreds: MongoCredsInterface = {
      host: MONGO_HOST,
      port: MONGO_PORT,
      // password: MONGO_PASSWORD,
      // username: MONGO_USERNAME,
      dbName: MONGO_DB_NAME,
    }

    ;({ client: mongoClient, mongoose: mongo } = await connectToMongo({
      mongoCreds,
    }))
  }, 60000)

  afterAll(async function () {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    await mongo.disconnect()
  })

  beforeEach(async function () {
    await dropAllMongoData(mongoClient)
  }, 60000)

  describe('with pre-instantiated CacheProvider', () => {
    beforeEach(async function () {
      cache = mongoCacheProvider(mongoClient, { collectionName, ttlMillis })
      await cache.setup()
      removeAsync = cache.removeAsync
      getAsync = cache.getAsync
      saveAsync = cache.saveAsync
    }, 60000)

    afterEach(() => cache.close())

    // describe('validation', () => {
    //   it('throws an error if ttlMillis is not a positive integer', () => {
    //     expect(() => mongoCacheProvider(model)).toThrowError('ttlMillis must be a positive integer')
    //     expect(() => mongoCacheProvider(model)).toThrowError('ttlMillis must be a positive integer')
    //   })
    // })

    describe('getAsync()', () => {
      it('returns null if key does not exist', async function () {
        return expect(await getAsync('key')).toBeNull()
      })

      it('returns the value if key exists', async function () {
        await saveAsync('key', 'val')
        expect(await getAsync('key')).toBe('val')
      })
    })

    describe('saveAsync()', () => {
      it('returns the new value & timestamp if key does not exist', async function () {
        const res = await saveAsync('key', 'val')
        let value
        if (res !== null) {
          ;({ value } = res)
        }
        expect(value).toBe('val')
      })

      it('throws an error if key already exists', async function () {
        await saveAsync('key', 'val1')
        return expect(saveAsync('key', 'val2')).rejects.toThrow(
          `E11000 duplicate key error collection: pscmlib.${collectionName} index: key_1 dup key: { key: "key" }`
        )
      })
    })

    describe('removeAsync()', () => {
      it('returns null if key does not exist', async function () {
        expect(await removeAsync('key')).toBeNull()
      })

      it('returns the key if it existed', async function () {
        await saveAsync('key', 'val')
        expect(await removeAsync('key')).toBe('key')
        expect(await removeAsync('key')).toBeNull()
      })
    })

    describe('expiration', () => {
      it('deletes expired key automatically', async function () {
        await saveAsync('key', 'val')
        expect(await getAsync('key')).toBe('val')
        await delay(ttlMillis * 2)
        expect(await getAsync('key')).toBeNull()
      })
    })
  })
  describe('error handling', () => {
    it('calls the callback with an error object if an error occurs', async function () {
      const mockModel = {
        db: () => {
          const collection = jest.fn(() => {
            const col = {
              insertOne: jest.fn(() => Promise.reject(new Error('Boom!'))),
              find: jest.fn(() => {
                return {
                  toArray: jest.fn(() => Promise.reject(new Error('Boom!'))),
                }
              }),
              deleteOne: jest.fn(() => Promise.reject(new Error('Boom!'))),
              deleteMany: jest.fn(() => {}),
              createIndex: jest.fn(() => Promise.resolve()),
            }
            return col
          })

          return {
            collection,
          }
        },
      }

      const cache = mongoCacheProvider(mockModel as any)
      await cache.setup()

      const error = new Error('Boom!')
      await expect(cache.getAsync('key')).rejects.toThrow(error)
      await expect(cache.saveAsync('key', 'value')).rejects.toThrow(error)
      await expect(cache.removeAsync('key')).rejects.toThrow(error)

      await delay(ttlMillis * 2)
      cache.close()
      await delay(ttlMillis * 2) 
    })
  })
})
