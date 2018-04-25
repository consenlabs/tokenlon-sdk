import { constants } from '0x.js/lib/src/utils/constants'
import { localConfig, localConfigUseToFill, web3ProviderUrl } from '../__mock__/config'
import { sntWethPairData } from '../__mock__/pair'
import { createTokenlon } from '../../src/index'
import Tokenlon from '../../src/tokenlon'
import { fromDecimalToUnit } from '../../src/utils/format'
import { getTokenBalance } from '../../src/utils/ethereum'
import { toBN } from '../../src/utils/math'
import { waitMined, waitSeconds } from '../__utils__/wait'
import { filterOrderBook } from '../__utils__/helper'
import { TokenlonError } from '../../src/types'

jasmine.DEFAULT_TIMEOUT_INTERVAL = 300000

let tokenlon = null as Tokenlon
const baseQuote = {
  base: sntWethPairData.base.symbol,
  quote: sntWethPairData.quote.symbol,
}

beforeAll(async () => {
  tokenlon = await createTokenlon(localConfigUseToFill)
})

describe('test fillOrdersUpTo', () => {
  it(`should thorw error because these orders not same pair`, async () => {
    const orderBook1 = await tokenlon.getOrderBook(baseQuote)
    const orderBook2 = await tokenlon.getOrderBook({
      base: 'KNC',
      quote: 'WETH',
    })
    const processedOrderBook1 = {
      asks: filterOrderBook(orderBook1.asks),
      bids: filterOrderBook(orderBook1.bids),
    }
    const processedOrderBook2 = {
      asks: filterOrderBook(orderBook2.asks),
      bids: filterOrderBook(orderBook2.bids),
    }

    try {
      await tokenlon.fillOrdersUpTo({
        ...baseQuote,
        side: 'SELL',
        amount: 1000000,
        rawOrders: [processedOrderBook1.bids[0].rawOrder, processedOrderBook2.bids[0].rawOrder],
      })
    } catch (e) {
      expect(e.toString()).toMatch(TokenlonError.OrdersMustBeSamePairAndSameSideWithFillOrdersUpTo)
    }
  })

  it(`should thorw error because these orders not same side`, async () => {
    const orderBook = await tokenlon.getOrderBook(baseQuote)
    const processedOrderBook = {
      asks: filterOrderBook(orderBook.asks),
      bids: filterOrderBook(orderBook.bids),
    }

    try {
      await tokenlon.fillOrdersUpTo({
        ...baseQuote,
        side: 'BUY',
        amount: 1000000,
        rawOrders: [processedOrderBook.asks[0].rawOrder, processedOrderBook.bids[0].rawOrder],
      })
    } catch (e) {
      expect(e.toString()).toMatch(TokenlonError.OrdersMustBeSamePairAndSameSideWithFillOrdersUpTo)
    }
  })

  it(`should thorw error because side not match`, async () => {
    const orderBook = await tokenlon.getOrderBook(baseQuote)
    const processedOrderBook = {
      asks: filterOrderBook(orderBook.asks),
      bids: filterOrderBook(orderBook.bids),
    }

    try {
      await tokenlon.fillOrdersUpTo({
        ...baseQuote,
        side: 'SELL',
        amount: 1000000,
        rawOrders: [processedOrderBook.asks[0].rawOrder, processedOrderBook.asks[1].rawOrder],
      })
    } catch (e) {
      expect(e.toString()).toMatch(TokenlonError.InvalidSideWithOrder)
    }
  })
})

describe(`test fillOrdersUpTo flow`, () => {
  it(`test fillOrdersUpTo flow`, async () => {
    for (let amountType of ['small', 'large']) {
      let i = 0
      const isSmall = amountType === 'small'
      const baseAmount = isSmall ? 10 : 10000000

      for (let side of ['SELL', 'BUY']) {
        const isBuy = side === 'BUY'
        const operateOrderBookType = isBuy ? 'asks' : 'bids'
        const baseTokenBalance1 = await tokenlon.getTokenBalance(sntWethPairData.base.symbol)
        const quoteTokenBalance1 = await tokenlon.getTokenBalance(sntWethPairData.quote.symbol)
        const orderBook = await tokenlon.getOrderBook(baseQuote)
        const processedOrderBook = {
          asks: filterOrderBook(orderBook.asks),
          bids: filterOrderBook(orderBook.bids),
        }
        // price sorted
        // use different order because of server pulling not update immediately
        const order1 = processedOrderBook[operateOrderBookType][i]
        const order2 = processedOrderBook[operateOrderBookType][i + 7]

        // use to test sort
        const operateOrderBookOrders = [order2, order1]
        const txHash = await tokenlon.fillOrdersUpTo({
          ...baseQuote,
          side,
          amount: baseAmount,
          rawOrders: operateOrderBookOrders.map(o => o.rawOrder),
        })

        console.log('txHash', txHash)
        await waitMined(txHash, 60)
        const baseTokenBalance2 = await tokenlon.getTokenBalance(sntWethPairData.base.symbol)
        const quoteTokenBalance2 = await tokenlon.getTokenBalance(sntWethPairData.quote.symbol)

        let baseUnitBN = toBN(0)
        let quoteUnitBN = toBN(0)

        if (isSmall) {
          baseUnitBN = toBN(baseAmount)
          // use order1
          quoteUnitBN = toBN(order1.price).times(baseUnitBN)
        } else {
          operateOrderBookOrders.forEach(o => {
            baseUnitBN = baseUnitBN.plus(o.amount)
            quoteUnitBN = quoteUnitBN.plus(toBN(o.price).times(o.amount))
          })
        }

        await new Promise((reosolve) => {
          setTimeout(() => {
            console.log(side)
            console.log('baseTokenBalance1', toBN(baseTokenBalance1).toString())
            console.log('quoteTokenBalance1', toBN(quoteTokenBalance1).toString())

            console.log('baseUnitBN', baseUnitBN.toString())
            console.log('quoteUnitBN', quoteUnitBN.toString())

            console.log('cal baseTokenBalance2', toBN(baseTokenBalance1)[isBuy ? 'plus' : 'minus'](baseUnitBN).toString())
            console.log('baseTokenBalance2', toBN(baseTokenBalance2).toString())

            console.log('cal quoteTokenBalance2', toBN(quoteTokenBalance1)[isBuy ? 'minus' : 'plus'](quoteUnitBN).toString())
            console.log('quoteTokenBalance2', toBN(quoteTokenBalance2).toString())

            reosolve()
          }, 10000)
        })

        // change orders
        i += 2

        expect(toBN(baseTokenBalance1)[isBuy ? 'plus' : 'minus'](baseUnitBN).toFixed(6)).toEqual(baseTokenBalance2.toFixed(6))
        expect(toBN(quoteTokenBalance1)[isBuy ? 'minus' : 'plus'](quoteUnitBN).toFixed(6)).toEqual(quoteTokenBalance2.toFixed(6))
      }
    }
  })
})