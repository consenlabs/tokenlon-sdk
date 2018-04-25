import * as _ from 'lodash'
import { wallet, web3ProviderUrl, localConfigUseToFill, placeOrderWalletAddress } from '../__mock__/config'
import { sntWethPairData } from '../__mock__/pair'
import { createTokenlon } from '../../src/index'
import Tokenlon from '../../src/tokenlon'
import { toBN } from '../../src/utils/math'
import { helpCompareStr } from '../../src/utils/helper'
import { waitSeconds, waitMined } from '../__utils__/wait'
import { filterOrderBook } from '../__utils__/helper'

let tokenlon = null as Tokenlon
jasmine.DEFAULT_TIMEOUT_INTERVAL = 600000

const baseQuote = {
  base: sntWethPairData.base.symbol,
  quote: sntWethPairData.quote.symbol,
}

beforeAll(async () => {
  tokenlon = await createTokenlon(localConfigUseToFill)
})

describe('test fillOrder / batchFillOrders / fillOrKillOrder / batchfillOrKill', () => {
  it('test fillOrder / batchFillOrders / fillOrKillOrder / batchfillOrKill', async () => {

    for (let singleFillMethod of ['fillOrKillOrder', 'fillOrder']) {
      const isKill = singleFillMethod === 'fillOrKillOrder'
      const batchFillOMethod = isKill ? 'batchFillOrKill' : 'batchFillOrders'

      const orderBook = await tokenlon.getOrderBook(baseQuote)
      const processedOrderBook = {
        asks: filterOrderBook(orderBook.asks),
        bids: filterOrderBook(orderBook.bids),
      }

      for (let side of ['BUY', 'SELL']) {
        const baseTokenBalance1 = await tokenlon.getTokenBalance(sntWethPairData.base.symbol)
        const quoteTokenBalance1 = await tokenlon.getTokenBalance(sntWethPairData.quote.symbol)
        const isBuy = side === 'BUY'
        const simpleOrder = processedOrderBook[isBuy ? 'asks' : 'bids'][0]
        if (!simpleOrder) {
          continue
        }
        // change fillTakerTokenAmount to test
        const baseAmount = simpleOrder.amount > 1 ? 1 : simpleOrder.amount
        console.log(`test ${singleFillMethod} ${side} ${baseAmount}`)
        const txHash = await tokenlon[singleFillMethod]({
          ...baseQuote,
          ...simpleOrder,
          amount: baseAmount,
          side,
        })
        await waitMined(txHash, 60)
        const baseTokenBalance2 = await tokenlon.getTokenBalance(sntWethPairData.base.symbol)
        const quoteTokenBalance2 = await tokenlon.getTokenBalance(sntWethPairData.quote.symbol)
        expect(toBN(baseTokenBalance1)[isBuy ? 'plus' : 'minus'](toBN(baseAmount)).toString()).toEqual(toBN(baseTokenBalance2).toString())
        expect(toBN(quoteTokenBalance1)[isBuy ? 'minus' : 'plus'](toBN(baseAmount).times(toBN(simpleOrder.price))).toFixed(12)).toEqual(toBN(quoteTokenBalance2).toFixed(12))
      }

      for (let side of ['BUY', 'SELL']) {
        const baseTokenBalance3 = await tokenlon.getTokenBalance(sntWethPairData.base.symbol)
        const quoteTokenBalance3 = await tokenlon.getTokenBalance(sntWethPairData.quote.symbol)
        const isBuy = side === 'BUY'
        const simpleOrder = processedOrderBook[isBuy ? 'asks' : 'bids'][1]
        if (!simpleOrder) {
          continue
        }
        // change fillTakerTokenAmount to test
        // if amount can not be filled, fillOrKill will throw error
        // but fillOrder will still to fill the order's can be filled amount
        const baseAmount = 100000000
        console.log(`test ${singleFillMethod} ${side} ${baseAmount}`)
        if (isKill) {
          try {
            const txHash = await tokenlon[singleFillMethod]({
              ...baseQuote,
              ...simpleOrder,
              amount: baseAmount,
              side,
            })
          } catch (e) {
            expect(e.toString()).toMatch(/INSUFFICIENT_REMAINING_FILL_AMOUNT/)
          }
        } else {
          const txHash = await tokenlon[singleFillMethod]({
            ...baseQuote,
            ...simpleOrder,
            amount: baseAmount,
            side,
          })
          await waitMined(txHash, 60)
          const baseTokenBalance4 = await tokenlon.getTokenBalance(sntWethPairData.base.symbol)
          const quoteTokenBalance4 = await tokenlon.getTokenBalance(sntWethPairData.quote.symbol)
          expect(toBN(baseTokenBalance3)[isBuy ? 'plus' : 'minus'](toBN(simpleOrder.amount)).toString()).toEqual(toBN(baseTokenBalance4).toString())
          expect(toBN(quoteTokenBalance3)[isBuy ? 'minus' : 'plus'](toBN(simpleOrder.amount).times(toBN(simpleOrder.price))).toFixed(12)).toEqual(toBN(quoteTokenBalance4).toFixed(12))
        }
      }

      const orderFillReqs = [...processedOrderBook.bids.slice(2, 3), ...processedOrderBook.asks.slice(2, 3)].map(o => {
        return {
          ...baseQuote,
          ...o,
          side: o.side === 'BUY' ? 'SELL' : 'BUY',
        }
      })

      if (!orderFillReqs.length) {
        return
      }

      let baseTokenBalance5 = await tokenlon.getTokenBalance(sntWethPairData.base.symbol)
      let quoteTokenBalance5 = await tokenlon.getTokenBalance(sntWethPairData.quote.symbol)
      console.log(`test ${batchFillOMethod}`)
      const txHash = await tokenlon[batchFillOMethod](orderFillReqs)
      await waitMined(txHash, 90)

      orderFillReqs.forEach(req => {
        const { side, price, amount } = req
        const isBuy = side === 'BUY'
        baseTokenBalance5 = toBN(baseTokenBalance5)[isBuy ? 'plus' : 'minus'](toBN(amount)).toNumber()
        quoteTokenBalance5 = toBN(quoteTokenBalance5)[isBuy ? 'minus' : 'plus'](toBN(amount).times(toBN(price))).toNumber()
      })

      const baseTokenBalance6 = await tokenlon.getTokenBalance(sntWethPairData.base.symbol)
      const quoteTokenBalance6 = await tokenlon.getTokenBalance(sntWethPairData.quote.symbol)

      expect(toBN(baseTokenBalance5).toString()).toEqual(toBN(baseTokenBalance6).toString())
      expect(toBN(quoteTokenBalance5).toFixed(12)).toEqual(toBN(quoteTokenBalance6).toFixed(12))
    }
  })
})

// TODO batchFill special fillTakerAmount