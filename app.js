import Hapi from 'hapi'
import Handlebars from 'handlebars'
import Extend from 'handlebars-extend-block'
import hapiAuthCookie from 'hapi-auth-cookie'
import Inert from 'inert'
import Vision from 'vision'
import Routes from './routes/'
import moment from 'moment'
import hapiDevErrors from 'hapi-dev-errors'
import dotenv from 'dotenv'
import HapiSwagger from 'hapi-swagger'
import Pack from './package'
import checkHostings from './cronJobs/checkHostings' // CRON JOB

dotenv.load()

const server = Hapi.server({
  host: '0.0.0.0',
  port: 3003
});

const swaggerOptions = {
  info: {
    title: 'Test API Documentation',
    version: Pack.version
  }
};

const start = async () => {
  await server.register([
    {
      plugin: HapiSwagger,
      options: {
        info: {
          title: 'API Documentation',
          version: Pack.version
        }
      }
    },
    hapiAuthCookie,
    Vision,
    Inert,
    {
      plugin: hapiDevErrors,
      options: {
        showErrors: true,
        useYouch: true
      }
    }
  ])

  const cache = server.cache({ segment: 'sessions', expiresIn: moment.duration(30, 'day').asMilliseconds() })
  server.app.cache = cache

  server.auth.strategy('session', 'cookie', {
    password: 'password-should-be-32-characters',
    cookie: 'sid-michcom',
    redirectTo: '/login',
    isSecure: false,
    validateFunc: async (request, session) => {
      const cached = await cache.get(session.sid)
      const out = {
        valid: !!cached
      }

      if (out.valid) {
        out.credentials = cached.account
      }

      return out
    }
  })

  server.auth.default('session')

  server.route(Routes)
  server.views({
    engines: {
      html: {
        module: Extend(Handlebars),
        isCached: false
      }
    },
    path: 'views',
    layoutPath: 'views/layout',
    layout: 'default'
  })

  await server.start()
  console.log(`Server started listening on ${server.info.uri}`)
}

start()
