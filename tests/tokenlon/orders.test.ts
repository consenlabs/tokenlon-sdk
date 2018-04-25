import * as _ from 'lodash'
import { localConfigUseToFill } from '../__mock__/config'
import { sntWethPairData } from '../__mock__/pair'
import { simpleOrders } from '../__mock__/simpleOrder'
import { createTokenlon } from '../../src/index'
import Tokenlon from '../../src/tokenlon'
import { toBN } from '../../src/utils/math'
import { getTimestamp } from '../../src/utils/helper'
import { waitSeconds } from '../__utils__/wait'

let tokenlon = null as Tokenlon
jasmine.DEFAULT_TIMEOUT_INTERVAL = 120000

beforeAll(async () => {
  tokenlon = await createTokenlon(localConfigUseToFill)
})

const containSimpleOrder = (orders, simpleOrder) => {
  return orders.some(o => {
    let expirationUnixTimestampSecCheck = true
    if (simpleOrder.expirationUnixTimestampSec) {
      expirationUnixTimestampSecCheck = _.isEqual(+o.expirationUnixTimestampSec, simpleOrder.expirationUnixTimestampSec)
    }

    return _.isEqual(o.side, simpleOrder.side) &&
      _.isEqual(o.price, simpleOrder.price) &&
      _.isEqual(o.amount, simpleOrder.amount) &&
      expirationUnixTimestampSecCheck
  })
}

describe('test placeOrder / getOrderBook / getOrders', () => {
  const baseQuote = {
    base: sntWethPairData.base.symbol,
    quote: sntWethPairData.quote.symbol,
  }
  simpleOrders.forEach((simpleOrder) => {
    it(`${simpleOrder.side} - ${simpleOrder.amount} - ${simpleOrder.price} test placeOrder / getOrderBook / getOrders`, async () => {
      await tokenlon.placeOrder({
        ...baseQuote,
        ...simpleOrder,
      })
      await waitSeconds(3)
      const orderBook = await tokenlon.getOrderBook(baseQuote)
      const orderBookOrders = orderBook[simpleOrder.side === 'BUY' ? 'bids' : 'asks']
      expect(containSimpleOrder(orderBookOrders, simpleOrder)).toBe(true)

      const myOrders = await tokenlon.getOrders(baseQuote)
      expect(containSimpleOrder(myOrders, simpleOrder)).toBe(true)
    })
  })
})