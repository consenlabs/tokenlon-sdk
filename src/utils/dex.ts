import * as _ from 'lodash'
import { ETH_CONTRACT, FEE_RECIPIENT } from '../constants'
import { lowerCase, getTimestamp, helpCompareStr, newError } from './helper'
import { toBN, isBigNumber } from './math'
import { fromUnitToDecimalBN, formatNumHelper, fromDecimalToUnit } from './format'
import { Dex, DexOrderBNToString, SimpleOrder, Pair, Tokenlon, GlobalConfig, TokenlonError } from '../types'
import { ZeroEx, OrderFillRequest } from '0x.js'
import { personalECSignHex } from './sign'
import { assert } from './assert'
import { getPairByContractAddress, getPairBySignedOrder } from './pair'
import { BigNumber } from '@0xproject/utils'

// generate a dex order without salt by simple order
export const generateDexOrderWithoutSalt = (params: Dex.GenerateDexOrderWithoutSaltParams): Dex.DexOrderWithoutSalt => {
  const { simpleOrder, pair, config } = params
  const { base, quote } = pair
  const {
    side,
    price,
    amount,
    expirationUnixTimestampSec,
  } = simpleOrder
  const isBuy = side === 'BUY'
  const baseTokenAmountUnit = amount
  const quoteTokenAmountUnit = toBN(price).times(amount)

  return {
    maker: lowerCase(config.wallet.address),
    taker: lowerCase(ETH_CONTRACT),
    makerTokenAmount: isBuy ? fromUnitToDecimalBN(quoteTokenAmountUnit, quote.decimal) : fromUnitToDecimalBN(baseTokenAmountUnit, base.decimal),
    takerTokenAmount: isBuy ? fromUnitToDecimalBN(baseTokenAmountUnit, base.decimal) : fromUnitToDecimalBN(quoteTokenAmountUnit, quote.decimal),
    makerTokenAddress: lowerCase(isBuy ? quote.contractAddress : base.contractAddress),
    takerTokenAddress: lowerCase(isBuy ? base.contractAddress : quote.contractAddress),

    // 智能合约上的判断 因此 expirationUnixTimestampSec 为必填项 未设置情况下设置到明年今日
    // if(block.timestamp >= order.expirationTimestampInSec) {
    //   LogError(uint8(Errors.ORDER_EXPIRED), order.orderHash);
    //   return 0;
    // }
    expirationUnixTimestampSec: toBN(expirationUnixTimestampSec || getTimestamp() + 86400 * 365),
    exchangeContractAddress: lowerCase(config.zeroEx.exchangeContractAddress),
    feeRecipient: FEE_RECIPIENT,
    // TODO setting fees
    makerFee: toBN(0),
    takerFee: toBN(0),
  }
}

// use 0x.js and privateKey's personal sign, to generate a dex order
export const getSignedOrder = (orderWithoutSalt: Dex.DexOrderWithoutSalt, config: GlobalConfig): Dex.SignedDexOrder => {
  const order = {
    ...orderWithoutSalt,
    salt: ZeroEx.generatePseudoRandomSalt(),
  } as Dex.DexOrder
  const hash = ZeroEx.getOrderHashHex(order)

  return {
    ...order,
    ecSignature: personalECSignHex(config.wallet.privateKey, hash),
  }
}

const translateValueHelper = (obj: object, check: (v) => boolean, operate: (v) => any): any => {
  let result = {}
  _.keys(obj).forEach((key) => {
    const v = obj[key]
    result[key] = check(v) ? operate(v) : v
  })
  return result
}

// translate a dex order with bigNumber to string
export const orderBNToString = (order: Dex.SignedDexOrder): DexOrderBNToString => {
  let result = {} as DexOrderBNToString
  result = translateValueHelper(order, isBigNumber, (v) => v.toString())
  return result
}

export const orderStringToBN = (order: DexOrderBNToString | Dex.DexOrderWithoutSalt): Dex.SignedDexOrder => {
  let result = {} as Dex.SignedDexOrder
  const check = (v) => _.isString(v) && !v.startsWith('0x')
  result = translateValueHelper(order, check, toBN)
  return result
}

// translate dex order to simple order, for us to check which order we want to fill
export const getSimpleOrder = (params: Dex.GetSimpleOrderParams): SimpleOrder => {
  const { order, pair, amountRemaining } = params
  const { base, quote, precision } = pair
  const formatPrice = formatNumHelper(precision)
  const {
    expirationUnixTimestampSec,
    makerTokenAddress,
    makerTokenAmount,
    takerTokenAddress,
    takerTokenAmount,
  } = order
  const isBuy = helpCompareStr(base.contractAddress, takerTokenAddress) && helpCompareStr(quote.contractAddress, makerTokenAddress)
  const side = isBuy ? 'BUY' : 'SELL'
  const baseTokenAmountBN = isBuy ? fromDecimalToUnit(takerTokenAmount, base.decimal) : fromDecimalToUnit(makerTokenAmount, base.decimal)
  const quoteTokenAmountBN = isBuy ? fromDecimalToUnit(makerTokenAmount, quote.decimal) : fromDecimalToUnit(takerTokenAmount, quote.decimal)
  const amountRemainingBN = amountRemaining && toBN(amountRemaining).lt(baseTokenAmountBN) ? toBN(amountRemaining) : baseTokenAmountBN
  const price = toBN(formatPrice(quoteTokenAmountBN.dividedBy(baseTokenAmountBN).toString(), false)).toNumber()
  const amount = toBN(formatPrice(amountRemainingBN.toString(), false)).toNumber()

  return {
    side,
    price,
    amount,
    expirationUnixTimestampSec: toBN(expirationUnixTimestampSec).toNumber(),
  }
}

export const getSimpleOrderWithBaseQuoteBySignedOrder = (order: DexOrderBNToString, pairs: Pair.ExchangePair[]): Tokenlon.SimpleOrderWithBaseQuote => {
  const pair = getPairBySignedOrder(order, pairs)
  const simpleOrder = getSimpleOrder({
    order,
    pair,
  })
  return {
    base: pair.base.symbol.toUpperCase(),
    quote: pair.quote.symbol.toUpperCase(),
    ...simpleOrder,
  }
}

export const translateOrderBookToSimple = (params: Dex.TranslateOrderBookToSimpleParams): Tokenlon.OrderBookItem[] => {
  const { orderbookItems, pair, wallet } = params
  return orderbookItems.map(item => {
    const { amountRemaining, payload } = item
    return {
      ...getSimpleOrder({
        pair,
        order: payload,
        amountRemaining,
      }),
      isMaker: !!wallet && helpCompareStr(wallet.address, payload.maker),
      rawOrder: JSON.stringify(payload),
    }
  })
}

// fill order need to change side
// if is buy, then maker token is weth, so we use quote decimal
export const getFillTakerTokenAmountBN = (side, amount, price, pair): BigNumber => {
  return side === 'SELL' ? fromUnitToDecimalBN(amount, pair.base.decimal) : fromUnitToDecimalBN(toBN(amount).times(price).toNumber(), pair.quote.decimal)
}

export const getFillTakerTokenAmountBNByUpToOrders = (side, amount, simpleOrders, pair) => {
  if (side === 'SELL') {
    return fromUnitToDecimalBN(amount, pair.base.decimal)
  }
  let remainedAmountBN = toBN(amount)
  let takerTokenAmountBN = toBN(0)
  simpleOrders.some(so => {
    const orderPrice = so.price
    const orderAmount = so.amount
    // if base amount is too large, then set takerTokenAmount as orders quote amounts
    if (remainedAmountBN.gt(toBN(orderAmount))) {
      takerTokenAmountBN = takerTokenAmountBN.plus(getFillTakerTokenAmountBN('BUY', orderAmount, orderPrice, pair))
      remainedAmountBN = remainedAmountBN.minus(toBN(orderAmount))
    // // if orders quote amount larger then base amount, then set takerTokenAmount as calculated amount
    } else {
      takerTokenAmountBN = takerTokenAmountBN.plus(getFillTakerTokenAmountBN('BUY', remainedAmountBN, orderPrice, pair))
      return true
    }
  })

  return takerTokenAmountBN
}

export const getOrderFillRequest = (params: Tokenlon.FillOrderParams, pairs: Pair.ExchangePair[]): OrderFillRequest => {
  const { rawOrder, price, amount, side, base, quote } = params
  assert.isValidrawOrder(rawOrder)
  assert.isValidBaseQuote(params, pairs)

  const order = JSON.parse(rawOrder)
  const isBuy = side === 'BUY'
  const pair = getPairByContractAddress(isBuy ? {
      base: order.makerTokenAddress,
      quote: order.takerTokenAddress,
    } : {
      base: order.takerTokenAddress,
      quote: order.makerTokenAddress,
    }, pairs)

  if (!helpCompareStr(pair.base.symbol, base) || !helpCompareStr(pair.quote.symbol, quote)) {
    throw newError(TokenlonError.UnsupportedPair)
  }

  assert.isValidSimpleOrder(params, pair.precision)

  const simpleOrder = getSimpleOrder({
    order,
    pair,
  })
  const formatPrice = formatNumHelper(pair.precision)
  if (formatPrice(simpleOrder.price, false) !== formatPrice(price, false)) {
    throw newError(TokenlonError.InvalidPriceWithToBeFilledOrder)
  }
  const takerTokenAmountBN = getFillTakerTokenAmountBN(side, amount, price, pair)
  return {
    signedOrder: orderStringToBN(order),
    takerTokenFillAmount: takerTokenAmountBN,
  }
}