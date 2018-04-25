import * as _ from 'lodash'
import { Server } from '../../src/lib/server'
import { localServerUrl, wallet } from '../__mock__/config'
import { sntWethPairData } from '../__mock__/pair'

let pairs = []
let server = new Server(localServerUrl, wallet)

beforeAll(async () => {
  pairs = await server.getPairList()
  return pairs
})

describe('getPairList', () => {
  it('getPairList contains snt-weth pair', () => {
    expect(pairs.some(p => {
      return _.isEqual(p.base.contractAddress, sntWethPairData.base.contractAddress) &&
        _.isEqual(p.quote.contractAddress, sntWethPairData.quote.contractAddress)
    })).toBe(true)
  })
})

describe('getOrderBook', () => {
  it('getOrderBook api response asks and bids', async () => {
    const orderbook = await server.getOrderBook({
      baseTokenAddress: sntWethPairData.base.contractAddress,
      quoteTokenAddress: sntWethPairData.quote.contractAddress,
    })

    expect(!!orderbook.asks && !!orderbook.bids).toBe(true)
    expect(orderbook.asks.length).toBeGreaterThanOrEqual(0)
    expect(orderbook.bids.length).toBeGreaterThanOrEqual(0)

    // server data not sorted
    if (orderbook.bids.length > 1) {
      expect(orderbook.bids[0].rate).toBeGreaterThanOrEqual(orderbook.bids[1].rate)
    }

    if (orderbook.asks.length > 1) {
      expect(orderbook.asks[0].rate).toBeLessThanOrEqual(orderbook.asks[1].rate)
    }
  })
})

describe('getOrders', () => {
  it('get orders from server', async () => {
    const orders = await server.getOrders({
      maker: wallet.address,
      tokenPair: [sntWethPairData.base.contractAddress, sntWethPairData.quote.contractAddress],
    })
    expect(!!orders).toBe(true)
    expect(orders.length).toBeGreaterThanOrEqual(0)
  })
})