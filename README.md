# passport-saml-cache-mongo

<!--
![CI](https://github.com/mkralla11/passport-saml-cache-mongo/workflows/CI/badge.svg)
 -->

A mongo-backed cache provider for [passport-saml](https://github.com/node-saml/passport-saml).

## Usage

```
$ npm install passport-saml-cache-mongo
```

Use the

```typescript
import { Strategy as SamlStrategy } from 'passport-saml'
import mongoCacheProvider, {
  createPassportSamlCacheMongoCollectionSchema,
  SamlSsoSchemaInterface,
} from 'mongo-saml-cache-mongo'
import mongoose, { Mongoose, model, Model, Schema } from 'mongoose'

// First, you must create a mongo connection with mongoose.
// ...
// Then you can create the model that will be used for the cache
// as shown below

SamlSsoAttemptsSchema = createPassportSamlCacheMongoCollectionSchema()

// you can name the collection whatever you want
const collectionName = 'saml_sso_attempts'
SamlSsoAttemptsModel = model<SamlSsoSchemaInterface>(collectionName, SamlSsoAttemptsSchema)

passport.use(
  new SamlStrategy({
    //... other passport-saml options,
    cacheProvider: mongoCacheProvider(SamlSsoAttemptsModel), // provide the model instance
  })
)
```

## Configuration

The `mongoCacheProvider` function accepts an optional second argument. The default options are as follows:

```typescript
mongoCacheProvider(pool, {
  // The maximum age of a cache entry in milliseconds.
  ttlMillis: 600000, // 10 minutes,
  // A logger to use. By default, messages are logged to console.
  // The logger should support at least `logger.info()` and `logger.error()` methods.
  logger: console,
})
```

# License

See LICENSE file
