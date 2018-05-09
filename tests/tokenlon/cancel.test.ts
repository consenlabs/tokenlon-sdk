import * as _ from 'lodash'
import { localConfigUseToFill } from '../__mock__/config'
import { sntWethPairData } from '../__mock__/pair'
import { simpleOrders as testSimpleOrders } from '../__mock__/simpleOrder'
import { createTokenlon } from '../../src/index'
import Tokenlon from '../../src/tokenlon'
import { toBN } from '../../src/utils/math'
import { getTimestamp } from '../../src/utils/helper'
import { waitSeconds } from '../__utils__/wait'

let tokenlon = null as Tokenlon
jasmine.DEFAULT_TIMEOUT_INTERVAL = 120000

// only use 3 test case
const simpleOrders = testSimpleOrders.slice(0, 3)

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
      _.isEqual(JSON.parse(o.rawOrder), JSON.parse(simpleOrder.rawOrder)) &&
      expirationUnixTimestampSecCheck
  })
}

describe('test cancelOrder / cancelOrders', () => {
  const baseQuote = {
    base: sntWethPairData.base.symbol,
    quote: sntWethPairData.quote.symbol,
  }
  it('test cancelOrder / cancelOrders', async () => {
    const placedOrders = []
    for (let simpleOrder of simpleOrders) {
      const placed = await tokenlon.placeOrder({
        ...baseQuote,
        ...simpleOrder,
      })
      expect(JSON.parse(placed.rawOrder).exchangeContractAddress).toEqual(localConfigUseToFill.zeroEx.exchangeContractAddress)
      expect(placed.isMaker).toBe(true)
      placedOrders.push(placed)
      await waitSeconds(2)
    }

    const orderBook1 = await tokenlon.getOrderBook(baseQuote)
    await waitSeconds(5)
    const myOrders1 = await tokenlon.getOrders(baseQuote)

    // check placed
    for (let placed of placedOrders) {
      const orderBookOrders = orderBook1[placed.side === 'BUY' ? 'bids' : 'asks']
      expect(containSimpleOrder(orderBookOrders, placed)).toBe(true)
      expect(containSimpleOrder(myOrders1, placed)).toBe(true)
    }

    await tokenlon.cancelOrder(placedOrders[0].rawOrder)
    await waitSeconds(2)
    await tokenlon.batchCancelOrders(placedOrders.slice(1).map(x => x.rawOrder))
    await waitSeconds(2)

    const orderBook2 = await tokenlon.getOrderBook(baseQuote)
    await waitSeconds(2)
    const myOrders2 = await tokenlon.getOrders(baseQuote)

    // check cancelled
    for (let placed of placedOrders) {
      const orderBookOrders = orderBook2[placed.side === 'BUY' ? 'bids' : 'asks']
      expect(containSimpleOrder(orderBookOrders, placed)).toBe(false)
      expect(containSimpleOrder(myOrders2, placed)).toBe(false)
    }
  })

  // TODO onchain
  // check order fillable
})