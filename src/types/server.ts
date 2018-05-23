import { DexOrderBNToString } from './base'

export namespace Server {
  export type Transformer = {
    (data: any): any;
  }

  export type RequestParams = {
    [propName: string]: any;
  }

  export type RequestConfig = {
    url: string
    method: string
    baseURL?: string
    transformRequest?: Transformer | Transformer[]
    transformResponse?: Transformer | Transformer[]
    headers?: any
    params?: any
    paramsSerializer?: (params: any) => string
    data?: any
    timeout?: number
    withCredentials?: boolean
    responseType?: string
    xsrfCookieName?: string
    xsrfHeaderName?: string
    onUploadProgress?: (progressEvent: any) => void
    onDownloadProgress?: (progressEvent: any) => void
    maxContentLength?: number
    validateStatus?: (status: number) => boolean;
  }

  export type tradeType = 'ask' | 'bid'

  export type GetTokenParams = {
    timestamp: number
    signature: string;
  }

  export type GetOrderBookParams = {
    baseTokenAddress: string
    quoteTokenAddress: string;
  }

  export type OrderBookItem = {
    rate: number
    tradeType?: tradeType
    amountRemaining: string
    payload: DexOrderBNToString;
  }

  export type OrderBookResult = {
    bids: OrderBookItem[]
    asks: OrderBookItem[];
  }

  export type CancelOrderItem = {
    orderHash: string
    txHash: string;
  }

  export type FillOrderItem = {
    order: DexOrderBNToString
    amount: string;
  }
  export interface FillOrderParams extends FillOrderItem {
    txHash: string
  }

  export type BatchFillOrdersParams = {
    txHash: string
    orders: FillOrderItem[];
  }

  export type GetOrdersParams = {
    maker: string
    page?: number
    perpage?: number
    tokenPair?: string[];
  }

  export type GetTradesParams = {
    timeRange: number[]
    baseTokenAddress: string
    quoteTokenAddress: string
    page: number
    perpage: number;
  }

  export interface MakerTradesParams extends GetTradesParams {
    maker: string
  }

  export interface TakerTradesParams extends GetTradesParams {
    taker: string
  }

  export type TradesDetailItem = {
    id: number
    price: number
    amount: number
    timestamp: number;
  }

  export interface MakerTradesDetailItem extends TradesDetailItem {
    txHash: string
  }

  export interface MakerTradesItem extends TradesDetailItem {
    tradeType: tradeType
    amountRemaining: number
    expirationUnixTimestampSec: string
    orderHash: string
    trades: MakerTradesDetailItem[]
  }

  export interface TakerTradesItem extends TradesDetailItem {
    tradeType: tradeType
    orderHash: string
    txHash: string
  }
}