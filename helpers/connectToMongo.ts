const { promisify } = require('util')
import mongoose, { Mongoose } from 'mongoose'

export interface mongoCredsInterface {
  host: string
  port: string
  // password: string
  // username: string
  dbName: string
}

export interface connectToMongoArg {
  mongoCreds: mongoCredsInterface
}

type connectToMongoFn = (connectToMongoArg: connectToMongoArg) => Promise<void>

const connectToMongo: connectToMongoFn = async function connectToMongo({ mongoCreds }) {
  const { host, port, dbName } = mongoCreds
  console.log(mongoCreds)
  const connUrl = `mongodb://${host}:${port}/${dbName}`
  await new Promise((resolve, reject) => {
    mongoose.set('debug', true)
    mongoose.connect(connUrl)
    mongoose.connection.once('connected', function () {
      // console.info(`Mongo connection ready`)
      resolve(mongoose)
    })

    mongoose.connection.once('error', function (err) {
      // console.error('MongoDB connection error: ', err)
      reject(err)
    })
  })
}

export default connectToMongo
