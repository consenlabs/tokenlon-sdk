import * as _ from 'lodash'
import { simpleOrders } from '../__mock__/simpleOrder'
import { getPairBySymbol } from '../../src/utils/pair'
import { Server } from '../../src/lib/server'
import { helpCompareStr, getTimestamp } from '../../src/utils/helper'
import { toBN, isBigNumber } from '../../src/utils/math'
import { Side, Pair } from '../../src/types'
import {
  generateDexOrderWithoutSalt,
  getSignedOrder,
  orderBNToString,
  orderStringToBN,
  getSimpleOrder,
  translateOrderBookToSimple,
  getFillTakerTokenAmountBN,
  getOrderFillRequest,
  getFillTakerTokenAmountBNByUpToOrders,
} from '../../src/utils/dex'
import { personalECSignHex, personalECSign } from '../../src/utils/sign'
import { fromUnitToDecimalBN, fromUnitToDecimal } from '../../src/utils/format'
import { orders, orderBook } from '../__mock__/order'
import { sntWethPairData } from '../__mock__/pair'
import { localServerUrl, wallet, zeroExConfig, localConfig } from '../__mock__/config'
import { signatureUtils } from '0x.js/lib/src/utils/signature_utils'
import { ZeroEx } from '0x.js'
import { FEE_RECIPIENT } from '../../src/constants'

let pairs = []
let pair = null
const server = new Server(localServerUrl, wallet)

beforeAll(async () => {
  pairs = await server.getPairList()
  pair = getPairBySymbol({
    base: 'SNT',
    quote: 'WETH',
  }, pairs)
  return pairs
})

describe('test dex simple utils', () => {
  it('test getSimpleOrder', () => {
    const order = orders[0]
    const signedOrder = order.signedOrder
    const simpleOrder = getSimpleOrder({
      pair,
      order: {
        ...signedOrder,
        exchangeContractAddress: zeroExConfig.exchangeContractAddress,
        makerTokenAmount: toBN(signedOrder.makerTokenAmount).toString(),
        takerTokenAmount: toBN(signedOrder.takerTokenAmount).toString(),
        makerFee: toBN(signedOrder.makerFee).toString(),
        takerFee: toBN(signedOrder.takerFee).toString(),
        expirationUnixTimestampSec: toBN(signedOrder.expirationUnixTimestampSec).toString(),
        salt: toBN(signedOrder.salt).toString(),
      },
    })

    expect(simpleOrder.price).toEqual(order.simpleOrder.price)
    expect(simpleOrder.amount).toEqual(order.simpleOrder.amount)
    expect(simpleOrder.expirationUnixTimestampSec).toEqual(order.simpleOrder.expirationUnixTimestampSec)
  })

  describe('test translateOrderBookToSimple', () => {
    orderBook.bids.concat(orderBook.asks).forEach(o => {
      it(`test order orderId: ${o.orderId} - ${o.tradeType} - ${o.rate} - ${o.amountRemaining}`, () => {
        const simpleOrders = translateOrderBookToSimple({
          pair,
          wallet,
          orderbookItems: [o],
        })
        const simpleOrder = simpleOrders[0]
        expect(simpleOrder.side).toEqual(o.tradeType === 'bid' ? 'BUY' : 'SELL')
        expect(simpleOrder.isMaker).toEqual(helpCompareStr(wallet.address, o.payload.maker))
        expect(simpleOrder.expirationUnixTimestampSec).toEqual(+o.payload.expirationUnixTimestampSec)
        expect(simpleOrder.rawOrder).toEqual(JSON.stringify(o.payload))
        // TODO price / amount process
        // maybe server calculate wrong
        // expect(simpleOrder.price).toEqual(o.rate)
        // expect(toBN(simpleOrder.amount).toString()).toEqual(o.amountRemaining)
      })
    })
  })

  describe('test getFillTakerTokenAmountBN', () => {
    orderBook.bids.concat(orderBook.asks).forEach(o => {
      it(`test order orderId: ${o.orderId} - ${o.tradeType === 'bid' ? 'SELL' : 'BUY'} - ${o.rate} - ${o.amountRemaining}`, () => {
        const simpleOrders = translateOrderBookToSimple({
          pair,
          wallet,
          orderbookItems: [o],
        })
        const simpleOrder = simpleOrders[0]
        const fillTakerTokenAmountBN = getFillTakerTokenAmountBN(simpleOrder.side === 'BUY' ? 'SELL' : 'BUY', simpleOrder.amount, simpleOrder.price, pair)
        expect(fillTakerTokenAmountBN.toString()).toEqual(
          (
            simpleOrder.side === 'BUY' ?
            fromUnitToDecimalBN(simpleOrder.amount, pair.base.decimal) :
            fromUnitToDecimalBN(toBN(simpleOrder.amount).times(simpleOrder.price).toNumber(), pair.quote.decimal)
          ).toString(),
        )
      })
    })
  })

  describe('test getFillTakerTokenAmountBNByUpToOrders', () => {
    it('check SELL', () => {
      const baseAmount = 10000
      const orders = simpleOrders.filter(o => o.side === 'BUY')
      const fillTakerTokenAmountBN = getFillTakerTokenAmountBNByUpToOrders('SELL', baseAmount, orders, sntWethPairData)

      expect(isBigNumber(fillTakerTokenAmountBN)).toEqual(true)
      expect(fillTakerTokenAmountBN.toString()).toEqual(fromUnitToDecimal(baseAmount, sntWethPairData.base.decimal, 10))
    })

    it('should get listed orders takerTokenAmount when set baseAmount 1000000000 and is buy sell orders', () => {
      const baseAmount = 1000000000
      const orders = simpleOrders.filter(o => o.side === 'SELL')
      const fillTakerTokenAmountBN = getFillTakerTokenAmountBNByUpToOrders('BUY', baseAmount, orders, sntWethPairData)

      let remainedAmountBN = toBN(baseAmount)
      let takerTokenAmountBN = toBN(0)
      let quoteAmountBN = toBN(0)

      orders.some(so => {
        const orderPrice = so.price
        const orderAmount = so.amount
        quoteAmountBN = quoteAmountBN.plus(getFillTakerTokenAmountBN('BUY', orderAmount, orderPrice, sntWethPairData))
        if (remainedAmountBN.gt(toBN(orderAmount))) {
          takerTokenAmountBN = takerTokenAmountBN.plus(getFillTakerTokenAmountBN('BUY', orderAmount, orderPrice, sntWethPairData))
          remainedAmountBN = remainedAmountBN.minus(toBN(orderAmount))
        } else {
          takerTokenAmountBN = takerTokenAmountBN.plus(getFillTakerTokenAmountBN('BUY', remainedAmountBN, orderPrice, sntWethPairData))
          return true
        }
      })

      expect(quoteAmountBN.toString()).toEqual(takerTokenAmountBN.toString())
      expect(fillTakerTokenAmountBN.toString()).toEqual(takerTokenAmountBN.toString())
    })

    it('should get orders[0] quoteAmount as takerTokenAmount when set baseAmount 0.1 and is buy sell orders', () => {
      const baseAmount = 0.1
      const orders = simpleOrders.filter(o => o.side === 'SELL')
      const fillTakerTokenAmountBN = getFillTakerTokenAmountBNByUpToOrders('BUY', baseAmount, orders, sntWethPairData)

      let remainedAmountBN = toBN(baseAmount)
      let takerTokenAmountBN = toBN(0)
      let quoteAmountBN = getFillTakerTokenAmountBN('BUY', baseAmount, orders[0].price, sntWethPairData)

      orders.some(so => {
        const orderPrice = so.price
        const orderAmount = so.amount
        if (remainedAmountBN.gt(toBN(orderAmount))) {
          takerTokenAmountBN = takerTokenAmountBN.plus(getFillTakerTokenAmountBN('BUY', orderAmount, orderPrice, sntWethPairData))
          remainedAmountBN = remainedAmountBN.minus(toBN(orderAmount))
        } else {
          takerTokenAmountBN = takerTokenAmountBN.plus(getFillTakerTokenAmountBN('BUY', remainedAmountBN, orderPrice, sntWethPairData))
          return true
        }
      })

      expect(quoteAmountBN.toString()).toEqual(takerTokenAmountBN.toString())
      expect(fillTakerTokenAmountBN.toString()).toEqual(takerTokenAmountBN.toString())
    })
  })
})

describe('test dex flow by dex utils', () => {
  const baseQuote = {
    base: 'SNT',
    quote: 'WETH',
  }
  const testData = simpleOrders

  const pair = sntWethPairData as Pair.ExchangePair

  testData.map(simple => {
    return {
      ...baseQuote,
      ...simple,
    }
  }).forEach(simpleOrder => {
    // simpleOrder
    // generateDexOrderWithoutSalt
    // getSignedOrder
    // orderBNToString
    // orderStringToBN
    // getSimpleOrder
    // string order to orderbook item
    // translateOrderBookToSimple
    // getFillTakerTokenAmountBN
    // getOrderFillRequest
    describe(`test item ${simpleOrder.side} - ${simpleOrder.amount} - ${simpleOrder.price}`, () => {
      const orderWithoutSalt = generateDexOrderWithoutSalt({
        config: localConfig,
        simpleOrder,
        pair: sntWethPairData,
      })

      it('test generateDexOrderWithoutSalt', () => {
        const { side, amount, price } = simpleOrder
        const isBuy = side === 'BUY'
        const { maker, takerTokenAddress, makerTokenAddress, makerTokenAmount, takerTokenAmount, expirationUnixTimestampSec, exchangeContractAddress, feeRecipient } = orderWithoutSalt
        const makerAmountBN = isBuy ? fromUnitToDecimalBN(toBN(amount).times(price), pair.quote.decimal) : fromUnitToDecimalBN(amount, pair.base.decimal)
        const takerAmountBN = isBuy ? fromUnitToDecimalBN(amount, pair.base.decimal) : fromUnitToDecimalBN(toBN(amount).times(price), pair.quote.decimal)

        expect(feeRecipient).toBe(FEE_RECIPIENT)
        expect(localConfig.wallet.address.toLowerCase()).toEqual(maker)
        expect(takerTokenAddress).toEqual((isBuy ? pair.base.contractAddress : pair.quote.contractAddress).toLowerCase())
        expect(makerTokenAddress).toEqual((isBuy ? pair.quote.contractAddress : pair.base.contractAddress).toLowerCase())
        if (simpleOrder.expirationUnixTimestampSec) {
          expect(+expirationUnixTimestampSec).toEqual(simpleOrder.expirationUnixTimestampSec)
        } else {
          expect(+expirationUnixTimestampSec).toBeLessThanOrEqual(getTimestamp() + 86400 * 365)
          expect(+expirationUnixTimestampSec).toBeGreaterThanOrEqual(getTimestamp() + 86400 * 365 - 2)
        }

        expect(exchangeContractAddress).toEqual(localConfig.zeroEx.exchangeContractAddress.toLowerCase())

        expect(makerAmountBN.eq(makerTokenAmount)).toBe(true)
        expect(takerAmountBN.eq(takerTokenAmount)).toBe(true)
      })

      const signedOrder = getSignedOrder(orderWithoutSalt, localConfig)
      it('test getSignedOrder', () => {
        const orderHash = ZeroEx.getOrderHashHex(signedOrder)
        expect(signatureUtils.isValidSignature(orderHash, signedOrder.ecSignature, localConfig.wallet.address.toLowerCase())).toBe(true)
      })

      const orderString = orderBNToString(signedOrder)
      it('test orderBNToString', () => {
        [
          'maker',
          'taker',
          'makerTokenAmount',
          'takerTokenAmount',
          'makerTokenAddress',
          'takerTokenAddress',
          'expirationUnixTimestampSec',
          'exchangeContractAddress',
          'feeRecipient',
          'makerFee',
          'takerFee',
          'salt',
        ].forEach((key) => {
          expect(orderString[key]).toEqual(signedOrder[key].toString())
        })
        expect(_.isEqual(signedOrder.ecSignature, orderString.ecSignature)).toBe(true)
      })

      const orderBN = orderStringToBN(orderString)
      it('test orderStringToBN', () => {
        [
          'maker',
          'taker',
          'makerTokenAddress',
          'takerTokenAddress',
          'exchangeContractAddress',
          'feeRecipient',
        ].forEach((key) => {
          expect(_.isString(orderBN[key])).toBe(true)
          expect(orderBN[key]).toEqual(signedOrder[key])
        });

        [
          'expirationUnixTimestampSec',
          'makerTokenAmount',
          'takerTokenAmount',
          'makerFee',
          'takerFee',
          'salt',
        ].forEach((key) => {
          expect(isBigNumber(orderBN[key])).toBe(true)
          expect(orderBN[key].toString()).toBe(signedOrder[key].toString())
        })

        expect(_.isEqual(signedOrder.ecSignature, orderString.ecSignature)).toBe(true)
      })

      const gotSimpleOrder = getSimpleOrder({
        order: orderString,
        pair,
      })
      it('test getSimpleOrder', () => {
        ['price', 'amount', 'side', 'expirationUnixTimestampSec'].forEach(key => {
          if (key !== 'expirationUnixTimestampSec' || simpleOrder.expirationUnixTimestampSec) {
            expect(gotSimpleOrder[key]).toEqual(simpleOrder[key])
          } else {
            expect(gotSimpleOrder[key]).toBeLessThanOrEqual(getTimestamp() + 86400 * 365)
            expect(gotSimpleOrder[key]).toBeGreaterThan(getTimestamp() + 86400 * 365 - 5)
          }
        })
      })

      const orderBookItem = {
        rate: simpleOrder.price,
        tradeType: simpleOrder.side === 'BUY' ? 'bid' : 'ask',
        amountRemaining: simpleOrder.amount.toString(),
        payload: orderString,
      }
      const translatedSimpleOrderFromOrderBook = translateOrderBookToSimple({
        orderbookItems: [orderBookItem],
        pair,
        wallet,
      })[0]
      it('test translateOrderBookToSimple', () => {
        ['price', 'amount', 'side', 'expirationUnixTimestampSec'].forEach(key => {
          if (key !== 'expirationUnixTimestampSec' || simpleOrder.expirationUnixTimestampSec) {
            expect(translatedSimpleOrderFromOrderBook[key]).toEqual(simpleOrder[key])
          } else {
            expect(translatedSimpleOrderFromOrderBook[key]).toBeLessThanOrEqual(getTimestamp() + 86400 * 365)
            expect(translatedSimpleOrderFromOrderBook[key]).toBeGreaterThan(getTimestamp() + 86400 * 365 - 5)
          }
        })
        expect(translatedSimpleOrderFromOrderBook.rawOrder).toEqual(JSON.stringify(orderString))
      })

      const fillTakerTokenAmountBN = getFillTakerTokenAmountBN(
        translatedSimpleOrderFromOrderBook.side === 'BUY' ? 'SELL' : 'BUY',
        translatedSimpleOrderFromOrderBook.amount,
        translatedSimpleOrderFromOrderBook.price,
        pair,
      )
      it('test getFillTakerTokenAmountBN', () => {
        expect(isBigNumber(fillTakerTokenAmountBN)).toBe(true)
        expect(fillTakerTokenAmountBN.toNumber()).toEqual(signedOrder.takerTokenAmount.toNumber())
        expect(fillTakerTokenAmountBN.eq(signedOrder.takerTokenAmount)).toBe(true)
      })

      it('test getOrderFillRequest', () => {
        const orderFillReqest = getOrderFillRequest({
          ...baseQuote,
          side: translatedSimpleOrderFromOrderBook.side === 'BUY' ? 'SELL' : 'BUY',
          price: translatedSimpleOrderFromOrderBook.price,
          amount: translatedSimpleOrderFromOrderBook.amount,
          rawOrder: translatedSimpleOrderFromOrderBook.rawOrder,
        }, pairs)
        const { signedOrder, takerTokenFillAmount } = orderFillReqest
        expect(_.isEqual(orderBNToString(signedOrder), orderString)).toBe(true)

        expect(isBigNumber(takerTokenFillAmount)).toBe(true)
        expect(takerTokenFillAmount.toNumber()).toEqual(signedOrder.takerTokenAmount.toNumber())
        expect(takerTokenFillAmount.eq(signedOrder.takerTokenAmount)).toBe(true)
      })
    })
  })
})