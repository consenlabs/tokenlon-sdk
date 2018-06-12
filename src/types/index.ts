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
  InvalidGasPriceAdaptor = 'INVALID_GAS_PRICE_ADAPTOR',
  EthDoseNotHaveApprovedMethod = 'ETH_DOSE_NOT_HAVE_APPROVED_METHOD',
  InvalidPriceWithToBeFilledOrder = 'INVALID_PRICE_WITH_TO_BE_FILLED_ORDER',
  OrdersMustBeSamePairAndSameSideWithFillOrdersUpTo = 'ORDERS_MUST_BE_SAME_PAIR_AND_SAME_SIDE_WITH_FILLORDERSUPTO',
}

export { GasPriceAdaptor, Side, Wallet, GlobalConfig, SimpleOrder, DexOrderBNToString } from './base'
export { Dex } from './dex'
export { Pair } from './pair'
export { Server } from './server'
export { Tokenlon } from './tokenlon'