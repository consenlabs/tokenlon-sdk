import * as _ from 'lodash'
import { Server } from '../../src/lib/server'
import { getPairBySymbol, getPairByContractAddress, getTokenByName, getPairBySignedOrder } from '../../src/utils/pair'
import { localServerUrl, wallet } from '../__mock__/config'
import { sntWethPairData } from '../__mock__/pair'
import { orders } from '../__mock__/order'

let pairs = []
const server = new Server(localServerUrl, wallet)

beforeAll(async () => {
  pairs = await server.getPairList()
  return pairs
})

describe('getPairBySymbol', () => {
  it('SNT-WETH should be found', () => {
    const found = getPairBySymbol({
      base: sntWethPairData.base.symbol,
      quote: sntWethPairData.quote.symbol,
    }, pairs)
    expect(_.isEqual(found.base.contractAddress, sntWethPairData.base.contractAddress) &&
      _.isEqual(found.quote.contractAddress, sntWethPairData.quote.contractAddress)).toBe(true)
  })

  it('snt-WETH should thorw error', () => {
    expect(() => {
      getPairBySymbol({
        base: sntWethPairData.base.symbol.toLowerCase(),
        quote: sntWethPairData.quote.symbol,
      }, pairs)
    }).toThrow()
  })

  it('WETH-SNT should thorw error', () => {
    expect(() => {
      getPairBySymbol({
        base: sntWethPairData.quote.symbol,
        quote: sntWethPairData.base.symbol,
      }, pairs)
    }).toThrow()
  })
})

describe('getPairByContractAddress', () => {
  it('SNT-WETH should be found', () => {
    const found = getPairByContractAddress({
      base: sntWethPairData.base.contractAddress,
      quote: sntWethPairData.quote.contractAddress,
    }, pairs)
    expect(_.isEqual(found.base.contractAddress, sntWethPairData.base.contractAddress) &&
      _.isEqual(found.quote.contractAddress, sntWethPairData.quote.contractAddress)).toBe(true)
  })

  it('WETH-SNT should thorw error', () => {
    expect(() => {
      getPairByContractAddress({
        base: sntWethPairData.quote.contractAddress,
        quote: sntWethPairData.base.contractAddress,
      }, pairs)
    }).toThrow()
  })
})

describe('getTokenByName', () => {
  it('SNT should be found', () => {
    const found = getTokenByName(sntWethPairData.base.symbol.toUpperCase(), pairs)
    expect(_.isEqual(found.contractAddress, sntWethPairData.base.contractAddress)).toBe(true)
  })

  it('snt should thorw error', () => {
    expect(() => {
      getTokenByName(sntWethPairData.base.symbol.toLowerCase(), pairs)
    }).toThrow()
  })

  it('CREDO should thorw error', () => {
    expect(() => {
      getTokenByName('CREDO', pairs)
    }).toThrow()
  })
})

describe('getPairBySignedOrder', () => {
  it('SNT-WETH pair should be found', () => {
    const pair = getPairBySignedOrder(orders[0].signedOrder, pairs)
    expect(_.isEqual(pair.base.contractAddress, sntWethPairData.base.contractAddress) &&
      _.isEqual(pair.quote.contractAddress, sntWethPairData.quote.contractAddress)).toBe(true)
  })
})