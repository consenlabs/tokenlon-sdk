import BigNumber from '@0xproject/utils'
import { ECSignature } from '0x.js'

export type Side = 'BUY' | 'SELL'

export type Wallet = {
  address: string
  privateKey: string;
}

export type GlobalConfig = {
  server: {
    url: string;
  }
  web3: {
    providerUrl: string;
  }
  wallet: Wallet
  onChainValidate?: boolean
  zeroEx: {
    gasPrice: number
    gasLimit: number
    networkId: number
    exchangeContractAddress: undefined | string
    etherTokenContractAddress: string
    tokenTransferProxyContractAddress: undefined | string
    zrxContractAddress?: undefined | string
    tokenRegistryContractAddress?: undefined | string
    orderWatcherConfig?: {
      cleanupJobIntervalMs: undefined | number
      eventPollingIntervalMs: undefined | number
      expirationMarginMs: undefined | number
      orderExpirationCheckingIntervalMs: undefined | number;
    };
  };
}

export type SimpleOrder = {
  side: Side
  price: number
  amount: number
  expirationUnixTimestampSec?: number;
}

export type DexOrderBNToString = {
  maker: string
  taker: string
  makerTokenAddress: string
  takerTokenAddress: string
  exchangeContractAddress: string
  expirationUnixTimestampSec: string
  feeRecipient: string
  makerFee: string
  makerTokenAmount: string
  takerFee: string
  takerTokenAmount: string
  salt: string
  ecSignature: ECSignature;
}
export namespace Pair {
  export type ExchangePairToken = {
    symbol: string
    logo: string
    contractAddress: string
    decimal: number;
  }
  export type ExchangePair = {
    id: number | string
    market: string
    marketLogo?: string
    base: ExchangePairToken
    quote: ExchangePairToken
    tags: string[]
    rate?: number
    protocol: string
    addedTimestamp?: number
    index?: number
    infoUrl?: string
    price?: number
    change?: number
    anchored?: boolean
    precision: number
    rank?: number
    marketUrl?: string;
  }
}

export namespace Dex {
  export type ECSignatureBuffer = {
    v: number
    r: Buffer
    s: Buffer;
  }
  export type GetSimpleOrderParams = {
    amountRemaining?: string
    order: DexOrderBNToString
    pair: Pair.ExchangePair;
  }
  export type GenerateDexOrderWithoutSaltParams = {
    simpleOrder: SimpleOrder
    pair: Pair.ExchangePair
    config: GlobalConfig;
  }
  export type DexOrderWithoutSalt = {
    exchangeContractAddress: string,
    expirationUnixTimestampSec: BigNumber.BigNumber
    feeRecipient: string
    maker: string
    makerFee: BigNumber.BigNumber
    makerTokenAddress: string
    makerTokenAmount: BigNumber.BigNumber
    taker: string
    takerFee: BigNumber.BigNumber
    takerTokenAddress: string
    takerTokenAmount: BigNumber.BigNumber;
  }
  export interface DexOrder extends DexOrderWithoutSalt {
    salt: BigNumber.BigNumber
  }
  export interface SignedDexOrder extends DexOrder {
    ecSignature: ECSignature
  }

  export interface TranslateOrderBookToSimpleParams {
    orderbookItems: Server.OrderBookItem[]
    pair: Pair.ExchangePair
    wallet?: {
      address: string;
    }
  }
}

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
    trades: MakerTradesDetailItem[]
  }

  export interface TakerTradesItem extends TradesDetailItem {
    tradeType: tradeType
    txHash: string
  }
}

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

  export interface FillOrdersUpTo {
    base: string
    quote: string
    side: string
    amount: number
    rawOrders: string[]
  }
}

export namespace Web3Wrapper {
  export type Web3RequestParams = {
    [propName: string]: any;
  }

  export type Web3RequestData = {
    method: string
    data: Web3RequestParams
    [propName: string]: any;
  }
}

export namespace Ethereum {
  export type SendTransactionParams = {
    address: string
    privateKey: string
    gasLimit?: number
    gasPrice: number
    to: string
    data?: string
    value: number;
  }
}

export enum TokenlonError {
  InvalidOrders = 'INVALID_ORDERS',
  UnsupportedPair = 'UNSUPPORTED_PAIR',
  UnsupportedToken = 'UNSUPPORTED_TOKEN',
  WalletDoseNotExist = 'WALLET_DOSE_NOT_EXIST',
  InvalidContractName = 'INVALID_CONTRACT_NAME',
  InvalidContractMethod = 'INVALID_CONTRACT_METHOD',
  InvalidSideWithOrder = 'INVALID_SIDE_WITH_ORDER',
  InvalidWalletPrivateKey = 'INVALID_WALLET_PRIVATE_KEY',
  EthDoseNotHaveApprovedMethod = 'ETH_DOSE_NOT_HAVE_APPROVED_METHOD',
  InvalidPriceWithToBeFilledOrder = 'INVALID_PRICE_WITH_TO_BE_FILLED_ORDER',
  OrdersMustBeSamePairAndSameSideWithFillOrdersUpTo = 'ORDERS_MUST_BE_SAME_PAIR_AND_SAME_SIDE_WITH_FILLORDERSUPTO',
}