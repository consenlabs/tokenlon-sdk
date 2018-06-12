import { GasPriceAdaptor } from '../types'
import axios from 'axios'
import { ETH_GAS_STATION_URL } from '../constants'
import { getTimestamp, newError } from './helper'

const getGasPriceByAdaptorHelper = async (adaptor: GasPriceAdaptor): Promise<number> => {
  return axios(ETH_GAS_STATION_URL).then(res => {
    return res.data[adaptor] * 0.1
  }).catch(e => {
    throw newError(`${ETH_GAS_STATION_URL} server error ${e && e.message}`)
  })
}

const stack = {}

export const getGasPriceByAdaptorAsync = async (adaptor: GasPriceAdaptor): Promise<number> => {
  // Use variable cache data within 5mins
  if (stack[adaptor] && stack[adaptor].timestamp + 300 > getTimestamp()) {
    return stack[adaptor].gasPrice
  } else if (stack[adaptor] && stack[adaptor].requesting) {

    // only try to recursive call 15 times
    if (stack[adaptor].tried > 15) {
      newError(`${ETH_GAS_STATION_URL} server request timeout`)

    } else {
      await new Promise((resolve) => {
        setTimeout(resolve, 1000)
      })
      stack[adaptor].tried = stack[adaptor].tried ? stack[adaptor].tried + 1 : 1
      return getGasPriceByAdaptorAsync(adaptor)
    }
  } else {
    stack[adaptor] = { requesting: true }
    const gasPrice = await getGasPriceByAdaptorHelper(adaptor)
    const gasPriceInGwei = gasPrice * Math.pow(10, 9) // gwei process
    stack[adaptor] = {
      gasPrice: gasPriceInGwei,
      timestamp: getTimestamp(),
      requesting: false,
    }
    return gasPriceInGwei
  }
}