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

  export interface GetOrderParams extends BaseQuote {
    page?: number
    perpage?: number
  }

  export interface OrderBookItem extends SimpleOrder {
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
  }

  export interface TradesParams extends BaseQuote {
    page: number
    perpage: number
    timeRange?: [number, number]
  }

  export interface MakerTradesItem extends Server.MakerTradesItem {
    side: Side
  }

  export interface TakerTradesItem extends Server.TakerTradesItem {
    side: Side
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
}