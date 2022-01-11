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

const Mongo = require('iomongo')

// create a mongo instance
const mongoClient = Mongo.createClient({
  host,
  port,
  password,
})

passport.use(
  new SamlStrategy({
    //... other passport-saml options,
    cacheProvider: mongoCacheProvider(mongo), // provide the mongo instance
  })
)
```

## Configuration

The `mongoCacheProvider` function accepts an optional second argument. The default options are as follows:

```typescript
mongoCacheProvider(pool, {
  // The maximum age of a cache entry in milliseconds. Uses mongo's TTL implementation under the hood.
  ttlMillis: 600000, // 10 minutes,
  // A logger to use. By default, messages are logged to console.
  // The logger should support at least `logger.info()` and `logger.error()` methods.
  logger: console,
})
```

# License

See LICENSE file
