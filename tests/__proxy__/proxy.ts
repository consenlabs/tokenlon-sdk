import * as Koa from 'koa'
import * as Router from 'koa-router'
import * as koaBody from 'koa-body'
import { jsonrpc } from '../../src/lib/server/_request'
import { localPort } from '../__mock__/config'

const app = new Koa()
const router = Router()

if (!process.env.serverUrl) {
  throw new Error('Need to set serverUrl')
}

const serverUrl = process.env.serverUrl

// Add headers
app.use(async (ctx, next) => {

  // Website you wish to allow to connect
  ctx.set('Access-Control-Allow-Origin', '*')

  // Request methods you wish to allow
  ctx.set('Access-Control-Allow-Methods', '*')

  // Request headers you wish to allow
  ctx.set('Access-Control-Allow-Headers', 'Authorization,X-DEVICE-TOKEN,X-CLIENT-VERSION,X-LOCALE,X-CURRENCY,X-ACCESS-TOKEN,X-DEVICE-LOCALE,ACCESS-TOKEN')

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  ctx.set('Access-Control-Allow-Credentials', true)

  await next()
})

router
  .get('/',
    async (ctx, next) => {
      await new Promise(resolve => {
        setTimeout(() => {
          resolve()
        }, 1000)
      })
      ctx.body = 'OK GET'
    },
  )
  .options('/', ctx => {
    ctx.body = 'OK OPTIONS'
  })
  .post(
    '/',
    koaBody(),
    async (ctx, next) => {
      const reqHeader = ctx.request.header
      const reqBody = ctx.request.body
      const useHeader = {};

      ['content-type', 'user-agent', 'access-token'].forEach(key => {
        if (reqHeader[key]) {
          useHeader[key] = reqHeader[key]
        }
      })

      let result = null
      let error = null
      try {
        result = await jsonrpc.get(serverUrl, useHeader, reqBody.method, reqBody.params)
      } catch (e) {
        console.log(e)
        error = {
          code: -32000,
          message: e.toString(),
          data: null,
        }
      }

      ctx.type = 'text/plain; charset=utf-8'
      ctx.set('Content-Type', 'application/json')
      ctx.status = 200
      ctx.body = error ? {
        jsonrpc: '2.0',
        error,
      } : {
        jsonrpc: '2.0',
        result,
      }
    },
  )

app.use(router.routes())

console.log(`proxy listen on ${localPort}`)
app.listen(localPort)
