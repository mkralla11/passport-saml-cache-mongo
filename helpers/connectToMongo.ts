const { promisify } = require('util')
import mongoose, { Mongoose } from 'mongoose'
import { MongoClient } from 'mongodb'

export interface MongoCredsInterface {
  host: string
  port: string
  // password: string
  // username: string
  dbName: string
}

export interface ConnectToMongoArg {
  mongoCreds: MongoCredsInterface
}

export interface ConnectToMongoReturnVal {
  mongoose: Mongoose
  client: MongoClient
}

type connectToMongoFn = (ConnectToMongoArg: ConnectToMongoArg) => Promise<ConnectToMongoReturnVal>

const connectToMongo: connectToMongoFn = async function connectToMongo({ mongoCreds }) {
  const { host, port, dbName } = mongoCreds
  console.log(mongoCreds)
  const connUrl = `mongodb://${host}:${port}/${dbName}`
  return await new Promise((resolve, reject) => {
    // mongoose.set('debug', true)
    mongoose.connect(connUrl)
    mongoose.connection.once('connected', function () {
      // @ts-ignore
      // console.info(`Mongo connection ready`, mongoose.connection.client)
      resolve({
        mongoose,
        // connection: mongoose.connection,
        // db: mongoose.connections[0].db,
        // @ts-ignore
        client: mongoose.connection.client,
      })
    })

    mongoose.connection.once('error', function (err) {
      // console.error('MongoDB connection error: ', err)
      reject(err)
    })
  })
}

export default connectToMongo
