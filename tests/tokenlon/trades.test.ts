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
import { simpleOrders } from '../__mock__/simpleOrder'
import { waitSeconds, waitMined } from '../__utils__/wait'
import { getTimestamp } from '../../src/utils/helper'

jasmine.DEFAULT_TIMEOUT_INTERVAL = 200000

let tokenlon = null as Tokenlon
web3.setProvider(new Web3.providers.HttpProvider(web3ProviderUrl))

beforeAll(async () => {
  tokenlon = await createTokenlon(localConfig)
})

const isSameOrder = (ob1, ob2) => {
  return ['price', 'amount', 'expirationUnixTimestampSec', 'amount', 'amountTotal'].every(key => {
    return ob1[key] === ob2[key]
  }) && _.isEqual(JSON.parse(ob1.rawOrder), JSON.parse(ob2.rawOrder))
}

describe('test placeOrder / getOrders / getMakerTrades / getTakerTrades / getOrder', () => {
  const baseQuote = {
    base: sntWethPairData.base.symbol,
    quote: sntWethPairData.quote.symbol,
  }
  const simpleOrder = simpleOrders[0]

  it(`${simpleOrder.side} - ${simpleOrder.amount} - ${simpleOrder.price} test placeOrder / getOrderBook / getOrders`, async () => {
    const obItem = await tokenlon.placeOrder({
      ...baseQuote,
      ...simpleOrder,
      expirationUnixTimestampSec: getTimestamp() + 10 * 60,
    })
    await waitSeconds(3)
    const myOrders = await tokenlon.getOrders(baseQuote)

    expect(myOrders.some(o => {
      return isSameOrder(o, obItem)
    })).toBe(true)

    await waitSeconds(3)
    const orderDetail = await tokenlon.getOrder(obItem.rawOrder)
    expect(isSameOrder(orderDetail, obItem))
    expect(orderDetail.amountTotal).toEqual(orderDetail.amount)

    const toFillHalfBaseAmount = orderDetail.amount / 2

    // fill this order and check maker / taker / getOrder trades
    const txHash = await tokenlon.fillOrder({
      ...baseQuote,
      ...obItem,
      side: obItem.side === 'BUY' ? 'SELL' : 'BUY',
      amount: toFillHalfBaseAmount,
    })

    await waitMined(txHash, 60)
    await waitSeconds(60)

    const orderDetailAfterFill = await tokenlon.getOrder(obItem.rawOrder)

    // test amountTotal
    expect(orderDetailAfterFill.amount + toFillHalfBaseAmount).toEqual(obItem.amountTotal)

    const makerTrades = await tokenlon.getMakerTrades({ ...baseQuote, page: 1, perpage: 30 })
    const makerTrade = makerTrades.find(t => t.rawOrder === orderDetailAfterFill.rawOrder)
    expect(makerTrade).toBeTruthy()

    const mts = makerTrade.trades
    // test maker trades txHash
    expect(mts[0].txHash).toEqual(txHash)

    const takerTrades = await tokenlon.getTakerTrades({ ...baseQuote, page: 1, perpage: 30 })
    const takerTrade = takerTrades.find(t => t.rawOrder === orderDetailAfterFill.rawOrder)
    // test taker trades txHash
    expect(takerTrade.txHash).toEqual(txHash);

    // maker / taker trades detail
    ['id', 'price', 'amount', 'timestamp'].forEach(key => {
      expect(mts[0][key]).toEqual(takerTrade[key])
    })

    // test trade item amount
    expect(+takerTrade.amount).toEqual(toFillHalfBaseAmount)
  })
})