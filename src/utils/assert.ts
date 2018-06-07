import * as ethUtil from 'ethereumjs-util'
import { assert as sharedAssert } from '@0xproject/assert'
import { toBN } from './math'
import * as _ from 'lodash'
import { SimpleOrder, Pair, Tokenlon, GlobalConfig, TokenlonError } from '../types'
import { Web3Wrapper } from '@0xproject/web3-wrapper'
import { helpCompareStr, newError, getTimestamp } from './helper'

export const assert = {
  isValidSide(value: string) {
    sharedAssert.assert(value === 'BUY' || value === 'SELL', `side ${value} must be one of BUY or SELL`)
  },
  isValidPrecision(variableName: string, value: number, precision: number) {
    const formatedNum = toBN(value).toString()
    const pre = formatedNum.split('.')[1]
    precision = precision || 8
    sharedAssert.assert(_.isUndefined(pre) || pre.length <= precision, `${variableName} ${value} must match precision ${precision}`)
  },
  isValidExpirationUnixTimestampSec(value?: number) {
    sharedAssert.assert(_.isUndefined(value) || (getTimestamp() < +value), `expirationUnixTimestampSec ${value} must after the current time`)
  },
  isValidAmount(order: SimpleOrder, quoteMinUnit: number | string) {
    const { price, amount } = order
    sharedAssert.assert(price * amount >= (+quoteMinUnit ? +quoteMinUnit : 0.0001), `Total amount must larger then or be equal with quoteMinUnit ${quoteMinUnit}`)
  },
  isValidSimpleOrder(order: SimpleOrder, precision: number) {
    const { side, expirationUnixTimestampSec } = order
    this.isValidSide(side)
    this.isValidExpirationUnixTimestampSec(expirationUnixTimestampSec);
    ['amount', 'price'].forEach(key => {
      sharedAssert.isNumber(key, order[key])
      this.isValidPrecision(key, order[key], precision)
    })
  },
  isValidrawOrder(rawOrder: string) {
    try {
      const o = JSON.parse(rawOrder)
      if (!_.isPlainObject(o)) {
        throw newError(`rawOrder ${rawOrder} must be a JSON Object`)
      }
    } catch (e) {
      throw newError(`rawOrder ${rawOrder} must be a JSON Object`)
    }
  },
  isValidTokenNameString(variableName: string, value: string) {
    sharedAssert.assert(_.isString(value), `${variableName} ${value} must be a string`)
    sharedAssert.assert(!!value.trim(), `${variableName} ${value} must not be a empty string`)
    sharedAssert.assert(value.trim() === value, `${variableName} ${value} must be trimed`)
    sharedAssert.assert(value.toUpperCase() === value, `${variableName} ${value} must be upper case`)
  },
  isValidTokenName(tokenName: string, pairs: Pair.ExchangePair[]) {
    this.isValidTokenNameString('Token name', tokenName)
    sharedAssert.assert(
      pairs.some(p => helpCompareStr(p.base.symbol, tokenName) || helpCompareStr(p.quote.symbol, tokenName)),
      TokenlonError.UnsupportedToken)
  },
  isValidBaseQuote(baseQuote: Tokenlon.BaseQuote, pairs: Pair.ExchangePair[]) {
    const { base, quote } = baseQuote;
    ['base', 'quote'].forEach(key => this.isValidTokenNameString(key, baseQuote[key]))
    sharedAssert.assert(
      pairs.some(p => p.base.symbol === base && p.quote.symbol === quote),
      TokenlonError.UnsupportedPair,
    )
  },
  isValidWallet(wallet) {
    if (!wallet) throw newError(TokenlonError.WalletDoseNotExist)
    const { address, privateKey } = wallet
    sharedAssert.isETHAddressHex('wallet.address', address)
    const addr = ethUtil.privateToAddress(new Buffer(privateKey, 'hex'))
    sharedAssert.assert(helpCompareStr(`0x${addr.toString('hex')}`, address), TokenlonError.InvalidWalletPrivateKey)
  },
  isValidGasPriceAdaptor(adaptor) {
    sharedAssert.assert(['safeLow', 'average', 'fast'].includes(adaptor), TokenlonError.InvalidGasPriceAdaptor)
  },
  isValidConfig(config: GlobalConfig) {
    const { wallet, web3, server, gasPriceAdaptor } = config
    sharedAssert.isUri('web3.providerUrl', web3.providerUrl)
    sharedAssert.isUri('server.url', server.url)
    this.isValidWallet(wallet)
    this.isValidGasPriceAdaptor(gasPriceAdaptor)
  },
}

export const rewriteAssertUtils = (assert: any) => {
  assert.isSenderAddressAsync = async function (
    variableName: string,
    senderAddressHex: string,
    _web3Wrapper: Web3Wrapper,
  ): Promise<void> {
    sharedAssert.isETHAddressHex(variableName, senderAddressHex)
    // Overwrite
    // const isSenderAddressAvailable = await web3Wrapper.isSenderAddressAvailableAsync(senderAddressHex)
    // sharedAssert.assert(
    //   isSenderAddressAvailable,
    //   `Specified ${variableName} ${senderAddressHex} isn't available through the supplied web3 provider`,
    // )
  }
}