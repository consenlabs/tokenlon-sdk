import axios from 'axios'
import * as _ from 'lodash'
import { REQUEST_TIMEOUT } from '../../constants'
import { Server } from '../../types'

// `validateStatus` defines whether to resolve or reject the promise for a given
// HTTP response status code. If `validateStatus` returns `true` (or is set to `null`
// or `undefined`), the promise will be resolved; otherwise, the promise will be rejected.
const validateStatus = function (status: number): boolean {
  return status >= 200 && status < 300 // default
}

const getHeaders = () => {
  return {
    'Content-Type': 'application/json',
  }
}

const newError = (message, url: string) => {
  if (_.isObject(message) && message.message) {
    const error = message
    if (_.isObject(error.response) && _.isObject(error.response.data)) {
      if (error.response.data.error) {
        message = error.response.data.error.message
      }
    } else {
      message = `${url}: ${message.message}`
    }
  } else {
    message = `${url}: ${message}`
  }
  const error = new Error(message)
  error.message = message
  error.toString = () => message
  return error
}

// TODO do something with request error
const handleError = function (error) {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    // console.log(error.response.data)
    // console.log(error.response.status)
    // console.log(error.response.headers)
  } else if (error.request) {
    // The request was made but no response was received
    // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
    // http.ClientRequest in node.js
    // console.log(error.request)
  } else {
    // Something happened in setting up the request that triggered an Error
    // console.log('Error', error.message)
  }
}

// TODO add debounceTime
const sendRequest = (config: Server.RequestConfig) => {
  const rConfig = { validateStatus, timeout: REQUEST_TIMEOUT, ...config }
  return new Promise((resolve, reject) => {
    axios(rConfig).then(res => {
      if (res.data) {
        resolve(res.data)
      } else {
        reject(newError('null response', config.url))
      }
    }).catch(error => {
      handleError(error)
      reject(newError(error, config.url))
    })
  }) as Promise<{ error: object, result: any }>
}

export const jsonrpc = {
  get(url, header = {}, method, params, timeout: number = REQUEST_TIMEOUT) {
    const headers = {
      ...getHeaders(),
      ...header,
    }
    const data = {
      jsonrpc: '2.0',
      id: 1,
      method,
      params,
    }
    return sendRequest({ method: 'post', url, data, timeout, headers }).then(data => {
      if (data.error) {
        throw newError(data.error, url)
      }

      if (_.isUndefined(data.result)) {
        throw newError('server result is undefined', url)
      }
      return data.result
    }).catch(err => {
      throw err
    })
  },
}
