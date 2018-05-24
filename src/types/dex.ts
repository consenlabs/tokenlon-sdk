import BigNumber from '@0xproject/utils'
import { ECSignature } from '0x.js'
import { SimpleOrder, DexOrderBNToString, GlobalConfig } from './base'
import { Server } from './server'
import { Pair } from './pair'

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