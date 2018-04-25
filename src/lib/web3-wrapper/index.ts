import * as Web3Export from 'web3'
import * as RequestManagerExport from 'web3/lib/web3/requestmanager'
import * as HttpProviderExport from 'web3/lib/web3/httpprovider'
import * as JsonrpcExport from 'web3/lib/web3/jsonrpc'
import * as errorsExport from 'web3/lib/web3/errors'
import { TIMEOUT } from '../../constants'
import { Web3Wrapper } from '../../types'

const Web3 = Web3Export.default ? Web3Export.default : Web3Export
const RequestManager = RequestManagerExport.default ? RequestManagerExport.default : RequestManagerExport
const HttpProvider = HttpProviderExport.default ? HttpProviderExport.default : HttpProviderExport
const Jsonrpc = JsonrpcExport.default ? JsonrpcExport.default : JsonrpcExport
const errors = errorsExport.default ? errorsExport.default : errorsExport

const wrapperCallback = (_host, _data: Web3Wrapper.Web3RequestData, callback) => {
  // const method = data.method
  return (err, result?: any) => {
    if (err) {
      // console.log(`🍅 web3 fetch ${host}  %c${method}`, `background: #E47361;color:#fff`, data, err)
    } else {
      // console.log(`🍅 web3 fetch ${host} %c${method}`, `background: #60B47A;color:#fff`, data, result)
    }
    if (callback) callback(err, result)
  }
}

RequestManager.prototype.sendAsync = function (data: Web3Wrapper.Web3RequestData, cb) {
  const host = this.provider && this.provider.host
  const callback = wrapperCallback(host, data, cb)

  if (!this.provider) {
    return callback(errors.InvalidProvider())
  }

  const payload = Jsonrpc.toPayload(data.method, data.params)
  this.provider.sendAsync(payload, (err, result) => {
    if (err) {
      return callback(err)
    }

    if (!Jsonrpc.isValidResponse(result)) {
      return callback(errors.InvalidResponse(result))
    }

    callback(null, result.result)
  })
}

HttpProvider.prototype.sendAsync = function (payload, callback) {
  const request = this.prepareRequest(true)

  request.onreadystatechange = () => {
    if (request.readyState === 4) {
      let result = request.responseText
      let error = null

      try {
        result = JSON.parse(result)

      } catch (e) {
        error = errors.InvalidResponse(request.responseText)
      }

      callback(error, result)
    }
  }

  try {
    // TODO remove but using JWT and server apiKey, apiSecret to send tx
    request.timeout = TIMEOUT
    request.setRequestHeader('agent', 'ios:2.0.1:0')
    request.setRequestHeader('deviceToken', 'foobar')
    request.send(JSON.stringify(payload))
  } catch (error) {
    callback(errors.InvalidConnection(this.host))
  }
}

const web3 = new Web3()

export default web3
