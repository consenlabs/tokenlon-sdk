import { constants } from '0x.js/lib/src/utils/constants'
import { localConfig, localConfigUseToFill, web3ProviderUrl } from '../__mock__/config'
import { sntWethPairData } from '../__mock__/pair'
import { createTokenlon } from '../../src/index'
import Tokenlon from '../../src/tokenlon'
import Web3 from 'web3'
import web3 from '../../src/lib/web3-wrapper'
import { fromDecimalToUnit } from '../../src/utils/format'
import { getTokenBalance, getEstimateGas } from '../../src/utils/ethereum'
import { toBN } from '../../src/utils/math'
import { waitMined } from '../__utils__/wait'
import { getTimestamp } from '../../src/utils/helper'
import { getGasPriceByAdaptorAsync } from '../../src/utils/gasPriceAdaptor'
import { getGasLimitByTransactionAsync, getGasPriceByTransactionAsync } from '../__utils__/helper'

jasmine.DEFAULT_TIMEOUT_INTERVAL = 3000000

let tokenlon = null as Tokenlon
web3.setProvider(new Web3.providers.HttpProvider(web3ProviderUrl))

beforeAll(async () => {
  tokenlon = await createTokenlon(localConfigUseToFill)
})

const getPlacedOrderAsync = async () => {
  return tokenlon.placeOrder({
    base: 'SNT',
    quote: 'WETH',
    price: 0.001,
    amount: 10,
    side: 'BUY',
    expirationUnixTimestampSec: getTimestamp() + 60 * 10,
  })
}

const testDatas = [
  {
    method: 'deposit',
    params: [0.0001],
  },
  {
    method: 'withdraw',
    params: [0.0001],
  },
  {
    method: 'setAllowance',
    params: ['SNT', 1],
  },
  {
    method: 'setUnlimitedAllowance',
    params: ['SNT'],
  },
  {
    getOrder: getPlacedOrderAsync,
    method: 'fillOrder',
    params: [],
  },
  {
    getOrder: getPlacedOrderAsync,
    method: 'fillOrKillOrder',
    params: [],
  },
  {
    getOrder: getPlacedOrderAsync,
    method: 'batchFillOrders',
    params: [],
  },
  {
    getOrder: getPlacedOrderAsync,
    method: 'batchFillOrKill',
    params: [],
  },
  {
    getOrder: getPlacedOrderAsync,
    method: 'fillOrdersUpTo',
    params: [],
  },
  {
    getOrder: getPlacedOrderAsync,
    method: 'cancelOrder',
    params: [],
  },
  {
    getOrder: getPlacedOrderAsync,
    method: 'batchCancelOrders',
    params: [],
  },
]

describe('test transaction', () => {
  it('test transaction', async () => {
    for (let type of ['coverage', 'default']) {
      const opts = type === 'default' ? undefined : { gasLimit: 216666, gasPrice: 5260000000 }

      for (let item of testDatas) {
        let params = []

        if (item.getOrder) {
          const order = await item.getOrder()
          if (['fillOrKillOrder', 'fillOrder'].includes(item.method)) {
            params = [{
              base: 'SNT',
              quote: 'WETH',
              ...order,
              side: order.side === 'BUY' ? 'SELL' : 'BUY',
            }]

          } else if (['batchFillOrders', 'batchFillOrKill'].includes(item.method)) {
            params = [[{
              base: 'SNT',
              quote: 'WETH',
              ...order,
              side: order.side === 'BUY' ? 'SELL' : 'BUY',
            }]]

          } else if (item.method === 'fillOrdersUpTo') {
            params = [{
              base: 'SNT',
              quote: 'WETH',
              ...order,
              side: order.side === 'BUY' ? 'SELL' : 'BUY',
              rawOrders: [order.rawOrder],
            } as any]

          } else if (item.method === 'cancelOrder') {
            params = [order.rawOrder, true]

          } else if (item.method === 'batchCancelOrders') {
            params = [[order.rawOrder], true]

          }
        } else {
          params = item.params
        }

        let expectGasPrice = 0
        let expectGasLimit = 0

        if (type === 'default') {
          expectGasPrice = await getGasPriceByAdaptorAsync(localConfigUseToFill.gasPriceAdaptor)
          expectGasLimit = localConfigUseToFill.zeroEx.gasLimit

        } else {
          expectGasPrice = opts.gasPrice
          expectGasLimit = opts.gasLimit
          params.push(opts)
        }

        console.log('type', type)
        console.log('item.method', item.method)
        console.log('params', params)
        const txHash = await tokenlon[item.method].apply(tokenlon, params)

        await waitMined(txHash, 60)

        const resultGasLimit = await getGasLimitByTransactionAsync(txHash)
        const resultGasPrice = await getGasPriceByTransactionAsync(txHash)

        expect(resultGasLimit).toEqual(expectGasLimit)
        expect(resultGasPrice).toEqual(expectGasPrice)
      }
    }
  })
})