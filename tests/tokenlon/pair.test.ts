import * as _ from 'lodash'
import { localConfig } from '../__mock__/config'
import { sntWethPairData } from '../__mock__/pair'
import { createTokenlon } from '../../src/index'
import Tokenlon from '../../src/tokenlon'

let tokenlon = null as Tokenlon

beforeAll(async () => {
  tokenlon = await createTokenlon(localConfig)
})

describe('test getPairs', () => {
  it('test getPairs', async () => {
    const pairs = await tokenlon.getPairs()
    const found = pairs.find(p => {
      return p.base.contractAddress === sntWethPairData.base.contractAddress &&
        p.quote.contractAddress === sntWethPairData.quote.contractAddress
    })
    const compared = _.isEqual(found.base.contractAddress, sntWethPairData.base.contractAddress) &&
      _.isEqual(found.quote.contractAddress, sntWethPairData.quote.contractAddress)
    expect(compared).toBe(true)
  })
})

describe('test getPairInfo', () => {
  it('test getPairInfo', async () => {
    const pair = await tokenlon.getPairInfo({
      base: sntWethPairData.base.symbol,
      quote: sntWethPairData.quote.symbol,
    })
    const compared = _.isEqual(pair.base.contractAddress, sntWethPairData.base.contractAddress) &&
      _.isEqual(pair.quote.contractAddress, sntWethPairData.quote.contractAddress)
    expect(compared).toBe(true)
  })
})

describe('test getTokenInfo', () => {
  it('test getTokenInfo', async () => {
    const token = await tokenlon.getTokenInfo(sntWethPairData.base.symbol)
    const compared = _.isEqual(token.contractAddress, sntWethPairData.base.contractAddress)
    expect(compared).toBe(true)
  })
})