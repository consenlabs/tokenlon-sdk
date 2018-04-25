import * as _ from 'lodash'
import { ZeroEx } from '0x.js'
import { localConfig, web3ProviderUrl, walletUseToFill } from '../__mock__/config'
import { sntWethPairData } from '../__mock__/pair'
import { createTokenlon } from '../../src/index'
import { orderStringToBN } from '../../src/utils/dex'
import Tokenlon from '../../src/tokenlon'
import Web3 from 'web3'
import web3 from '../../src/lib/web3-wrapper'
import { orders } from '../__mock__/order'

let tokenlon = null as Tokenlon
web3.setProvider(new Web3.providers.HttpProvider(web3ProviderUrl))

jasmine.DEFAULT_TIMEOUT_INTERVAL = 120000

beforeAll(async () => {
  tokenlon = await createTokenlon(localConfig)
})

const testData = orders[0]
const simpleOrderData = testData.simpleOrder
const signedOrderData = testData.signedOrder

describe('test getSimpleOrderWithBaseQuoteBySignedOrder', () => {
  it(`should get a simple order`, () => {
    const simpleOrder = tokenlon.utils.getSimpleOrderWithBaseQuoteBySignedOrder(signedOrderData)
    expect(_.isEqual(simpleOrder, simpleOrderData)).toBe(true)
  })
})

describe('test getSignedOrderBySimpleOrderAsync', () => {
  it(`should get a signed order`, async () => {
    const signedOrder = await tokenlon.utils.getSignedOrderBySimpleOrderAsync(simpleOrderData);
    [
      'exchangeContractAddress',
      'maker',
      'taker',
      'makerTokenAddress',
      'takerTokenAddress',
      'feeRecipient',
      'makerTokenAmount',
      'takerTokenAmount',
      'makerFee',
      'takerFee',
      'expirationUnixTimestampSec',
    ].forEach(key => {
      expect(signedOrderData[key]).toEqual(signedOrder[key])
    })

    // check signature
    expect(
      ZeroEx.isValidSignature(ZeroEx.getOrderHashHex(orderStringToBN(signedOrder)), signedOrder.ecSignature, signedOrder.maker.toLowerCase()),
    ).toBe(true)
  })
})