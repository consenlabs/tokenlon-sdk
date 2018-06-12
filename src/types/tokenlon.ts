import { SimpleOrder, Side } from './base'
import { Server } from './server'

export namespace Tokenlon {
  export type makerTaker = {
    maker: string
    taker: string;
  }

  export type BaseQuote = {
    base: string
    quote: string;
  }

  export interface GetOrdersParams extends BaseQuote {
    page?: number
    perpage?: number
  }

  export interface OrderBookItem extends SimpleOrder {
    amountTotal: number
    rawOrder: string
    isMaker: boolean
  }

  export interface OrderBookResult {
    asks: OrderBookItem[]
    bids: OrderBookItem[]
  }

  export interface SimpleOrderWithBaseQuote extends SimpleOrder {
    base: string
    quote: string
  }

  export interface FillOrderParams extends SimpleOrderWithBaseQuote {
    rawOrder: string
    [propName: string]: any
  }

  export interface TradesParams extends BaseQuote {
    page: number
    perpage: number
    timeRange?: [number, number]
  }

  export interface MakerTradesItem {
    tradeType: Server.tradeType
    trades: Server.MakerTradesDetailItem[]
    amountRemaining: number
    expirationUnixTimestampSec: string

    side: Side
    rawOrder: string
  }

  export interface TakerTradesItem {
    tradeType: Server.tradeType
    id: number
    price: number
    amount: number
    timestamp: number
    txHash: string

    side: Side
    rawOrder: string
  }

  export interface OrderDetail extends OrderBookItem {
    trades: Server.MakerTradesDetailItem[]
  }

  export interface FillOrdersUpTo {
    base: string
    quote: string
    side: string
    amount: number
    rawOrders: string[]
  }

  export interface TxOpts {
    gasPrice?: number
    gasLimit?: number
  }
}