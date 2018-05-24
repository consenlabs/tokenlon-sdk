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