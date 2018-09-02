import { jsonrpc } from './_request'
import { DexOrderBNToString, Pair, Server as ServerInterface } from '../../types'
import { Wallet } from '../../types'
import { getTimestamp } from '../../utils/helper'
import { personalSign } from '../../utils/sign'
export class Server {
  private _url: string
  private _wallet: Wallet
  private _tokenObj = { timestamp: 0, token: '' }
  private _tokenRequesting = false

  constructor(url: string, wallet: Wallet) {
    this._url = url
    this._wallet = wallet
  }

  private async getToken(params: ServerInterface.GetTokenParams): Promise<string> {
    return jsonrpc.get(this._url, {}, 'auth.getToken', [params]).then(data => {
      return data.token
    })
  }

  private async _getHeader() {
    const timestamp = getTimestamp()

    // 因每一个 Tokenlon instantce 都有各自的 JWT Token
    // 并且 SDK 用于自动化交易，过程中没有切换节点需要更新JWT Token的情况
    // 因此使用定期提前更新 JWT Token 的方式来避免 JWT Token 的过期
    if (!this._tokenRequesting && (!this._tokenObj.timestamp || this._tokenObj.timestamp < timestamp - 3600)) {
      const signature = personalSign(this._wallet.privateKey, timestamp.toString())
      this._tokenRequesting = true
      try {
        const token = await this.getToken({ timestamp, signature })
        this._tokenObj = { timestamp, token }
      } catch (e) {
      }
      this._tokenRequesting = false
    }

    return { 'access-token': this._tokenObj.token }
  }

  async getPairList(): Promise<Pair.ExchangePair[]> {
    const header = await this._getHeader()
    return jsonrpc.get(this._url, header, 'dex.getPairList', [{ market: 'Tokenlon' }]).then(data => {
      const res = data || []
      return res.filter(p => p.tradingEnabled)
    })
  }

  async getOrderBook(params: ServerInterface.GetOrderBookParams): Promise<ServerInterface.OrderBookResult> {
    const header = await this._getHeader()
    return jsonrpc.get(this._url, header, 'dex.getOrderBook', [params]).then(res => {
      const result = {
        bids: [],
        asks: [],
      } as ServerInterface.OrderBookResult
      if (res.bids && res.bids.length) {
        result.bids = res.bids.sort((s, l) => l.rate - s.rate)
      }
      if (res.asks && res.asks.length > 1) {
        result.asks = res.asks.sort((s, l) => s.rate - l.rate)
      }
      return result
    })
  }

  async placeOrder(order: DexOrderBNToString): Promise<string> {
    const header = await this._getHeader()
    return jsonrpc.get(this._url, header, 'dex.placeOrder', [{
      protocol: '0x',
      order,
    }])
  }

  async fillOrder(params: ServerInterface.FillOrderParams): Promise<string> {
    const header = await this._getHeader()
    return jsonrpc.get(this._url, header, 'dex.fillOrder', [{
      protocol: '0x',
      ...params,
    }])
  }

  async batchFillOrders(params: ServerInterface.BatchFillOrdersParams): Promise<string> {
    const header = await this._getHeader()
    return jsonrpc.get(this._url, header, 'dex.batchFillOrders', [{
      protocol: '0x',
      ...params,
    }])
  }

  async cancelOrders(params: string[]): Promise<string> {
    const header = await this._getHeader()
    return jsonrpc.get(this._url, header, 'dex.cancelOrders', params)
  }

  async cancelOrdersWithHash(params: ServerInterface.CancelOrderItem[]): Promise<string> {
    const header = await this._getHeader()
    return jsonrpc.get(this._url, header, 'dex.cancelOrdersWithHash', params)
  }

  async getOrders(params: ServerInterface.GetOrdersParams): Promise<ServerInterface.OrderBookItem[]> {
    const header = await this._getHeader()
    return jsonrpc.get(this._url, header, 'dex.getOrders', [params]).then(data => data || [])
  }

  async getOrder(orderHash: string): Promise<ServerInterface.OrderDetail> {
    const header = await this._getHeader()
    return jsonrpc.get(this._url, header, 'dex.getOrder', [{ orderHash }]).then(data => data || [])
  }

  async getMakerTrades(params: ServerInterface.MakerTradesParams): Promise<ServerInterface.MakerTradesItem[]> {
    const header = await this._getHeader()
    return jsonrpc.get(this._url, header, 'dex.getMakerTrades', [params]).then(data => data || [])
  }

  async getTakerTrades(params: ServerInterface.TakerTradesParams): Promise<ServerInterface.TakerTradesItem[]> {
    const header = await this._getHeader()
    return jsonrpc.get(this._url, header, 'dex.getTakerTrades', [params]).then(data => data || [])
  }
}