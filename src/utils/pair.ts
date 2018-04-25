import { helpCompareStr, newError } from './helper'
import { Pair, Tokenlon, DexOrderBNToString, TokenlonError } from '../types'
import { assert } from './assert'

export const getTokenByName = (tokenName: string, pairs: Pair.ExchangePair[]): Pair.ExchangePairToken => {
  assert.isValidTokenName(tokenName, pairs)

  let token = null as Pair.ExchangePairToken
  pairs.some(p => {
    if (helpCompareStr(p.base.symbol, tokenName)) {
      token = p.base
      return true
    } else if (helpCompareStr(p.quote.symbol, tokenName)) {
      token = p.quote
      return true
    }
  })
  if (token) return token
}

const getPairHelper = (baseQuote: Tokenlon.BaseQuote, pairs: Pair.ExchangePair[], tokenPropName: string): Pair.ExchangePair => {
  const { base, quote } = baseQuote
  const pair = pairs.find(p => helpCompareStr(p.base[tokenPropName], base) && helpCompareStr(p.quote[tokenPropName], quote))
  if (!pair) throw newError(TokenlonError.UnsupportedPair)
  return pair
}

export const getPairBySymbol = (baseQuote: Tokenlon.BaseQuote, pairs: Pair.ExchangePair[]): Pair.ExchangePair => {
  assert.isValidBaseQuote(baseQuote, pairs)
  return getPairHelper(baseQuote, pairs, 'symbol')
}

export const getPairByContractAddress = (baseQuote: Tokenlon.BaseQuote, pairs: Pair.ExchangePair[]): Pair.ExchangePair => {
  return getPairHelper(baseQuote, pairs, 'contractAddress')
}

export const getPairBySignedOrder = (order: DexOrderBNToString, pairs: Pair.ExchangePair[]) => {
  let pair = null
  const baseQuotes = [
    {
      base: order.makerTokenAddress,
      quote: order.takerTokenAddress,
    }, {
      base: order.takerTokenAddress,
      quote: order.makerTokenAddress,
    },
  ]

  baseQuotes.some((baseQuote, index) => {
    try {
      const result = getPairByContractAddress(baseQuote, pairs)
      pair = result
      return true
    } catch (e) {
      if (index === baseQuotes.length) {
        throw e
      }
    }
  })
  return pair
}