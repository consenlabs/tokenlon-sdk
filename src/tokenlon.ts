import { ZeroEx } from '0x.js'
import * as Web3 from 'web3'
import { constants } from '0x.js/lib/src/utils/constants'
import { fromDecimalToUnit, fromUnitToDecimalBN } from './utils/format'
import { assert as zeroExAssertUtils } from '@0xproject/assert'
import { assert } from './utils/assert'
import { Server } from './lib/server'
import { getPairBySymbol, getTokenByName, getPairBySignedOrder } from './utils/pair'
import {
  orderStringToBN,
  translateOrderBookToSimple,
  getOrderFillRequest,
  getSimpleOrder,
  getFillTakerTokenAmountBNByUpToOrders,
  orderBNToString,
} from './utils/dex'
import { Pair, Tokenlon as TokenlonInterface, GlobalConfig, TokenlonError } from './types'
import { helpCompareStr, newError, convertTrades, convertTokenlonTxOptsTo0xOpts } from './utils/helper'
import { BigNumber } from '@0xproject/utils'

export default class Tokenlon {
  constructor() {}

  private _config: GlobalConfig
  private _pairs: Pair.ExchangePair[]

  server: Server
  web3Wrapper: Web3
  zeroExWrapper: ZeroEx
  utils: {
    getSimpleOrderWithBaseQuoteBySignedOrder: any,
    getSignedOrderBySimpleOrderAsync: any,
    orderStringToBN: any,
    orderBNToString: any,
  }

  async getPairs(): Promise<Pair.ExchangePair[]> {
    return Promise.resolve(this._pairs)
  }

  async getPairInfo(baseQuote: TokenlonInterface.BaseQuote): Promise<Pair.ExchangePair> {
    const pair = getPairBySymbol(baseQuote, this._pairs)
    return Promise.resolve(pair)
  }

  async getTokenInfo(tokenName: string): Promise<Pair.ExchangePairToken> {
    const token = getTokenByName(tokenName, this._pairs)
    return Promise.resolve(token)
  }

  async getOrderBook(params: TokenlonInterface.BaseQuote): Promise<TokenlonInterface.OrderBookResult> {
    const pair = getPairBySymbol(params, this._pairs)
    const baseTokenAddress = pair.base.contractAddress
    const quoteTokenAddress = pair.quote.contractAddress
    const { wallet } = this._config
    const orderBook = await this.server.getOrderBook({ baseTokenAddress, quoteTokenAddress })
    return {
      asks: translateOrderBookToSimple({
        orderbookItems: orderBook.asks,
        pair,
        wallet,
      }).sort((a, b) => a.price - b.price),
      bids: translateOrderBookToSimple({
        orderbookItems: orderBook.bids,
        pair,
        wallet,
      }).sort((a, b) => b.price - a.price),
    }
  }

  async getOrders(params: TokenlonInterface.GetOrdersParams): Promise<TokenlonInterface.OrderBookItem[]> {
    const pair = getPairBySymbol(params, this._pairs)
    const baseTokenAddress = pair.base.contractAddress
    const quoteTokenAddress = pair.quote.contractAddress
    const { page, perpage } = params
    const { wallet } = this._config
    const myOrders = await this.server.getOrders({
      maker: wallet.address,
      page,
      perpage,
      tokenPair: [baseTokenAddress, quoteTokenAddress],
    })
    return translateOrderBookToSimple({
      orderbookItems: myOrders,
      pair,
    })
  }

  async getOrder(rawOrder: string): Promise<TokenlonInterface.OrderDetail> {
    const signedOrder = JSON.parse(rawOrder)
    const orderHash = ZeroEx.getOrderHashHex(signedOrder)
    const pair = getPairBySignedOrder(signedOrder, this._pairs)
    const order = await this.server.getOrder(orderHash)
    const ob = translateOrderBookToSimple({
      orderbookItems: [order],
      pair,
    })[0]
    return {
      ...ob,
      trades: order.trades,
    }
  }

  async getMakerTrades(params: TokenlonInterface.TradesParams): Promise<TokenlonInterface.MakerTradesItem[]> {
    const pair = getPairBySymbol(params, this._pairs)
    const baseTokenAddress = pair.base.contractAddress
    const quoteTokenAddress = pair.quote.contractAddress
    const { timeRange, page, perpage } = params
    const { wallet } = this._config

    const trades = await this.server.getMakerTrades({
      page,
      perpage,
      timeRange,
      baseTokenAddress,
      quoteTokenAddress,
      maker: wallet.address,
    })

    return convertTrades(trades)
  }

  async getTakerTrades(params: TokenlonInterface.TradesParams): Promise<TokenlonInterface.TakerTradesItem[]> {
    const pair = getPairBySymbol(params, this._pairs)
    const baseTokenAddress = pair.base.contractAddress
    const quoteTokenAddress = pair.quote.contractAddress
    const { timeRange, page, perpage } = params
    const { wallet } = this._config

    const trades = await this.server.getTakerTrades({
      page,
      perpage,
      timeRange,
      baseTokenAddress,
      quoteTokenAddress,
      taker: wallet.address,
    })
    return convertTrades(trades)
  }

  async placeOrder(params: TokenlonInterface.SimpleOrderWithBaseQuote): Promise<TokenlonInterface.OrderBookItem> {
    const pairs = this._pairs
    assert.isValidBaseQuote(params, pairs)
    const pair = getPairBySymbol(params, pairs)
    const { precision, quoteMinUnit } = pair
    assert.isValidSimpleOrder(params, precision)
    assert.isValidAmount(params, quoteMinUnit)
    const toBePlacedOrder = await this.utils.getSignedOrderBySimpleOrderAsync(params)
    await this.server.placeOrder(toBePlacedOrder)
    return {
      isMaker: true,
      side: params.side,
      price: params.price,
      amount: params.amount,
      amountTotal: params.amount,
      expirationUnixTimestampSec: params.expirationUnixTimestampSec || +toBePlacedOrder.expirationUnixTimestampSec,
      // for key sequence to be same with server order rawOrder
      rawOrder: JSON.stringify({
        exchangeContractAddress: toBePlacedOrder.exchangeContractAddress,
        maker: toBePlacedOrder.maker,
        taker: toBePlacedOrder.taker,
        makerTokenAddress: toBePlacedOrder.makerTokenAddress,
        takerTokenAddress: toBePlacedOrder.takerTokenAddress,
        feeRecipient: toBePlacedOrder.feeRecipient,
        makerTokenAmount: toBePlacedOrder.makerTokenAmount,
        takerTokenAmount: toBePlacedOrder.takerTokenAmount,
        makerFee: toBePlacedOrder.makerFee,
        takerFee: toBePlacedOrder.takerFee,
        expirationUnixTimestampSec: toBePlacedOrder.expirationUnixTimestampSec,
        salt: toBePlacedOrder.salt,
        ecSignature: toBePlacedOrder.ecSignature,
      }),
    }
  }

  async deposit(amount: number, opts?: TokenlonInterface.TxOpts) {
    const { wallet, zeroEx } = this._config
    zeroExAssertUtils.isNumber('amount', amount)
    return this.zeroExWrapper.etherToken.depositAsync(
      zeroEx.etherTokenContractAddress,
      fromUnitToDecimalBN(amount, 18),
      wallet.address,
      convertTokenlonTxOptsTo0xOpts(opts),
    )
  }

  async withdraw(amount: number, opts?: TokenlonInterface.TxOpts) {
    const { wallet, zeroEx } = this._config
    zeroExAssertUtils.isNumber('amount', amount)
    return this.zeroExWrapper.etherToken.withdrawAsync(
      zeroEx.etherTokenContractAddress,
      fromUnitToDecimalBN(amount, 18),
      wallet.address,
      convertTokenlonTxOptsTo0xOpts(opts),
    )
  }

  async getTokenBalance(tokenName: string, address?: string): Promise<number> {
    if (address) {
      zeroExAssertUtils.isETHAddressHex('address', address)
    }
    const { wallet } = this._config
    let balanceDecimalBN: BigNumber
    let decimal: number
    if (tokenName === 'ETH') {
      balanceDecimalBN = this.web3Wrapper.eth.getBalance(address || wallet.address)
      decimal = 18
    } else {
      const token = getTokenByName(tokenName, this._pairs)
      balanceDecimalBN = await this.zeroExWrapper.token.getBalanceAsync(token.contractAddress, address || wallet.address)
      decimal = token.decimal
    }
    return fromDecimalToUnit(balanceDecimalBN, decimal).toNumber()
  }

  async getAllowance(tokenName: string, address?: string) {
    if (helpCompareStr(tokenName, 'ETH')) throw newError(TokenlonError.EthDoseNotHaveApprovedMethod)
    if (address) {
      zeroExAssertUtils.isETHAddressHex('address', address)
    }
    const { wallet, zeroEx } = this._config
    const token = getTokenByName(tokenName, this._pairs)
    const allowanceBN = await this.zeroExWrapper.token.getAllowanceAsync(token.contractAddress, (address || wallet.address).toLowerCase(), zeroEx.tokenTransferProxyContractAddress)
    return fromDecimalToUnit(allowanceBN, token.decimal).toNumber()
  }

  async setAllowance(tokenName: string, amount: number, opts?: TokenlonInterface.TxOpts) {
    if (helpCompareStr(tokenName, 'ETH')) throw newError(TokenlonError.EthDoseNotHaveApprovedMethod)
    const { wallet, zeroEx } = this._config
    zeroExAssertUtils.isNumber('amount', amount)
    const token = getTokenByName(tokenName, this._pairs)
    const amountDecimalBN = fromUnitToDecimalBN(amount, token.decimal)

    return this.zeroExWrapper.token.setAllowanceAsync(
      token.contractAddress,
      wallet.address,
      zeroEx.tokenTransferProxyContractAddress,
      amountDecimalBN,
      convertTokenlonTxOptsTo0xOpts(opts),
    )
  }

  async setUnlimitedAllowance(tokenName, opts?: TokenlonInterface.TxOpts) {
    if (helpCompareStr(tokenName, 'ETH')) throw newError(TokenlonError.EthDoseNotHaveApprovedMethod)
    const { wallet, zeroEx } = this._config
    const token = getTokenByName(tokenName, this._pairs)
    return this.zeroExWrapper.token.setAllowanceAsync(
      token.contractAddress,
      wallet.address,
      zeroEx.tokenTransferProxyContractAddress,
      constants.UNLIMITED_ALLOWANCE_IN_BASE_UNITS,
      convertTokenlonTxOptsTo0xOpts(opts),
    )
  }

  private async fillOrderHelper({ params, fill, validate }) {
    const { wallet, onChainValidate } = this._config
    const { rawOrder } = params
    const orderFillRequest = getOrderFillRequest(params, this._pairs)
    const { signedOrder, takerTokenFillAmount } = orderFillRequest
    let txHash = ''
    if (onChainValidate) {
      await validate(signedOrder, takerTokenFillAmount, wallet.address)
    }
    txHash = await fill(signedOrder, takerTokenFillAmount, wallet.address)

    await this.server.fillOrder({
      txHash,
      order: JSON.parse(rawOrder),
      amount: takerTokenFillAmount.toString(),
    })
    return txHash
  }

  async fillOrder(params: TokenlonInterface.FillOrderParams, opts?: TokenlonInterface.TxOpts) {
    return this.fillOrderHelper({
      fill: (signedOrder, takerTokenFillAmount, address) => {
        return this.zeroExWrapper.exchange.fillOrderAsync(
          signedOrder,
          takerTokenFillAmount,
          false,
          address,
          convertTokenlonTxOptsTo0xOpts(opts),
        )
      },
      validate: (signedOrder, takerTokenFillAmount, address) => {
        return this.zeroExWrapper.exchange.validateFillOrderThrowIfInvalidAsync(signedOrder, takerTokenFillAmount, address)
      },
      params,
    })
  }

  async fillOrKillOrder(params: TokenlonInterface.FillOrderParams, opts?: TokenlonInterface.TxOpts) {
    return this.fillOrderHelper({
      fill: (signedOrder, takerTokenFillAmount, address) => {
        return this.zeroExWrapper.exchange.fillOrKillOrderAsync(
          signedOrder,
          takerTokenFillAmount,
          address,
          convertTokenlonTxOptsTo0xOpts(opts),
        )
      },
      validate: (signedOrder, takerTokenFillAmount, address) => {
        return this.zeroExWrapper.exchange.validateFillOrKillOrderThrowIfInvalidAsync(signedOrder, takerTokenFillAmount, address)
      },
      params,
    })
  }

  private async batchFillOrdersHelper({ batchFill, validate, orderFillReqs }) {
    const { wallet, onChainValidate } = this._config
    const orderFillRequests = orderFillReqs.map(req => getOrderFillRequest(req, this._pairs))
    const errors = []
    let errorMsg = ''
    if (onChainValidate) {
      for (let r of orderFillRequests) {
        const { signedOrder, takerTokenFillAmount } = r
        try {
          await validate(signedOrder, takerTokenFillAmount, wallet.address)
        } catch (e) {
          errors.push(e && e.message && e.message.toString())
        }
      }
      if (errors.length) {
        errorMsg = `These orders are invalid ${JSON.stringify(errors)}`
      }
    }

    if (errors.length !== orderFillRequests.length) {
      if (errorMsg) {
        console.log(errorMsg)
      }
      // !! Using orderFillRequests, even though there has some orders invalid
      const txHash = await batchFill(orderFillRequests, wallet.address)
      await this.server.batchFillOrders({
        txHash,
        orders: orderFillReqs.map(({ rawOrder }, index) => {
          return {
            order: JSON.parse(rawOrder),
            amount: orderFillRequests[index].takerTokenFillAmount.toString(),
          }
        }),
      })
      return txHash
    } else {
      console.log(errorMsg)
      throw newError(TokenlonError.InvalidOrders)
    }
  }

  async batchFillOrders(orderFillReqs: TokenlonInterface.FillOrderParams[], opts?: TokenlonInterface.TxOpts) {
    return this.batchFillOrdersHelper({
      batchFill: (orderFillRequests, address) => {
        return this.zeroExWrapper.exchange.batchFillOrdersAsync(
          orderFillRequests,
          false,
          address,
          convertTokenlonTxOptsTo0xOpts(opts),
        )
      },
      validate: (signedOrder, takerTokenFillAmount, address) => {
        return this.zeroExWrapper.exchange.validateFillOrderThrowIfInvalidAsync(signedOrder, takerTokenFillAmount, address)
      },
      orderFillReqs,
    })
  }

  async batchFillOrKill(orderFillReqs: TokenlonInterface.FillOrderParams[], opts?: TokenlonInterface.TxOpts) {
    return this.batchFillOrdersHelper({
      batchFill: (orderFillRequests, address) => {
        return this.zeroExWrapper.exchange.batchFillOrKillAsync(
          orderFillRequests,
          address,
          convertTokenlonTxOptsTo0xOpts(opts),
        )
      },
      validate: (signedOrder, takerTokenFillAmount, address) => {
        return this.zeroExWrapper.exchange.validateFillOrKillOrderThrowIfInvalidAsync(signedOrder, takerTokenFillAmount, address)
      },
      orderFillReqs,
    })
  }

  async fillOrdersUpTo(params: TokenlonInterface.FillOrdersUpTo, opts?: TokenlonInterface.TxOpts) {
    const { wallet } = this._config
    const { side, rawOrders, amount } = params
    const signedOrders = rawOrders.map(s => JSON.parse(s))
    const isBuy = side === 'BUY'
    let makerTaker = {} as any
    const checkSamePair = signedOrders.every(o => {
      const { maker, taker } = makerTaker
      const { makerTokenAddress, takerTokenAddress } = o
      if (maker && taker) {
        return helpCompareStr(maker, makerTokenAddress) && helpCompareStr(taker, takerTokenAddress)
      } else if (!maker && !taker) {
        makerTaker = { maker: makerTokenAddress, taker: takerTokenAddress }
        return true
      } else {
        return false
      }
    })

    if (!checkSamePair) {
      throw newError(TokenlonError.OrdersMustBeSamePairAndSameSideWithFillOrdersUpTo)
    }

    const pair = getPairBySymbol(params, this._pairs)
    const { maker, taker } = makerTaker

    // to filled order is another side
    if (
      (isBuy && (pair.base.contractAddress !== maker || pair.quote.contractAddress !== taker)) ||
      (!isBuy && (pair.base.contractAddress !== taker || pair.quote.contractAddress !== maker))
    ) {
      throw newError(TokenlonError.InvalidSideWithOrder)
    }

    signedOrders.sort((s1, s2) => {
      const simple1 = getSimpleOrder({ order: s1, pair })

      const simple2 = getSimpleOrder({ order: s2, pair })

      if (side === 'BUY') {
        return simple1.price - simple2.price
      } else {
        return simple2.price - simple1.price
      }
    })

    const simpleOrders = signedOrders.map(order => getSimpleOrder({ order, pair }))
    const takerTokenAmountBN = getFillTakerTokenAmountBNByUpToOrders(side, amount, simpleOrders, pair)
    const txHash = await this.zeroExWrapper.exchange.fillOrdersUpToAsync(
      signedOrders.map(orderStringToBN),
      takerTokenAmountBN,
      false,
      wallet.address,
      convertTokenlonTxOptsTo0xOpts(opts),
    )

    await this.server.batchFillOrders({
      txHash,
      orders: signedOrders.map(signedOrder => {
        return {
          order: orderBNToString(signedOrder),
          // TODO use signedOrder takerTokenAmount temporality, the server dosen't solve this amount param
          amount: signedOrder.takerTokenAmount.toString(),
        }
      }),
    })
    return txHash
  }

  async cancelOrder(rawOrder: string, onChain?: boolean, opts?: TokenlonInterface.TxOpts) {
    const { onChainValidate } = this._config
    const order = JSON.parse(rawOrder)
    const bnOrder = orderStringToBN(order)
    const orderHash = ZeroEx.getOrderHashHex(bnOrder)

    if (onChain) {
      if (onChainValidate) {
        await this.zeroExWrapper.exchange.validateCancelOrderThrowIfInvalidAsync(bnOrder, bnOrder.takerTokenAmount)
      }
      const txHash = await this.zeroExWrapper.exchange.cancelOrderAsync(
        bnOrder,
        bnOrder.takerTokenAmount,
        convertTokenlonTxOptsTo0xOpts(opts),
      )
      await this.server.cancelOrdersWithHash([{ orderHash, txHash }])
      return txHash
    } else {
      return this.server.cancelOrders([orderHash])
    }
  }

  async batchCancelOrders(rawOrders: string[], onChain?: boolean, opts?: TokenlonInterface.TxOpts) {
    const { onChainValidate } = this._config
    const bnOrders = rawOrders.map(rawOrder => orderStringToBN(JSON.parse(rawOrder)))
    const orderHashs = bnOrders.map(ZeroEx.getOrderHashHex)

    if (onChain) {
      const errors = []
      let errorMsg = ''
      for (let bnOrder of bnOrders) {
        try {
          if (onChainValidate) {
            await this.zeroExWrapper.exchange.validateCancelOrderThrowIfInvalidAsync(bnOrder, bnOrder.takerTokenAmount)
          }
        } catch (e) {
          errors.push(e && e.message && e.message.toString())
        }
      }
      if (errors.length) {
        errorMsg = `These orders are invalid ${JSON.stringify(errors)}`
        console.log(errorMsg)
      }

      if (errors.length !== bnOrders.length) {
        const orderCancellationRequests = bnOrders.map(bnOrder => {
          return {
            order: bnOrder,
            takerTokenCancelAmount: bnOrder.takerTokenAmount,
          }
        })
        // !! Using orderCancellationRequests, even though there has some orders invalid
        const txHash = await this.zeroExWrapper.exchange.batchCancelOrdersAsync(orderCancellationRequests, convertTokenlonTxOptsTo0xOpts(opts))
        await this.server.cancelOrdersWithHash(orderHashs.map(orderHash => ({ orderHash, txHash })))
        return txHash
      } else {
        throw newError(errorMsg)
      }
    } else {
      return this.server.cancelOrders(orderHashs)
    }
  }
}