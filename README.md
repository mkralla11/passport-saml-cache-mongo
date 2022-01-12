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
import mongoCacheProvider from 'mongo-saml-cache-mongo'

// First, you must create a mongo connection with mongoose/mongodb
const cacheProvider = mongoCacheProvider(mongoClient, { collectionName: 'SamlSsoAttempts', tlMillis: 600000 })

// MAKE SURE YOU CALL THE SETUP FUNCTION!!!!
await cacheProvider.setup()

// ...and finally pass the mongoClient instance to mongoCacheProvider
passport.use(
  new SamlStrategy({
    //... other passport-saml options,
    cacheProvider,
  })
)
```

## Configuration

The `mongoCacheProvider` function accepts an optional second argument. The default options are as follows:

```typescript
mongoCacheProvider(mongoClient, {
  // The maximum age of a cache entry in milliseconds.
  ttlMillis: 600000, // 10 minutes,
  // A logger to use. By default, messages are logged to console.
  // The logger should support at least `logger.info()` and `logger.error()` methods.
  logger: console,
})
```

# License

See LICENSE file
