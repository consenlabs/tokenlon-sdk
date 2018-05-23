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
    quoteMinUnit?: number
    marketUrl?: string;
  }
}