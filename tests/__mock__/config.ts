import { GasPriceAdaptor } from '../../src/types'

export const wallet = {
  address: '0x20F0C6e79A763E1Fe83DE1Fbf08279Aa3953FB5f',
  privateKey: '3f992df8720a778e68a82d27a47d91155ce69ea9954b46ef85afaf19c75bd192',
}

export const placeOrderWalletAddress = '0xd7a0D7889577ef77C11Ab5CC00817D1c9adE6B36'

export const walletUseToFill = {
  address: '0x17bf552da0ec40b1614660a773d371909dbe3eaa',
  privateKey: '80af1fcd21e974802c664a65f9c19a45c6388606a8784adb5266efd72eb1096d',
}

export const localUrl = 'http://localhost'
export const localPort = 5620
export const localServerUrl = `${localUrl}:${localPort}`

export const web3ProviderUrl = 'https://kovan.infura.io'

export const zeroExConfig = {
  networkId: 42,
  gasLimit: 150000,
  etherTokenContractAddress: '0xd0a1e359811322d97991e03f863a0c30c2cf029c',
  exchangeContractAddress: '0x90fe2af704b34e0224bf2299c838e04d4dcf1364',
  tokenTransferProxyContractAddress: '0x087Eed4Bc1ee3DE49BeFbd66C662B434B15d49d4',
}

export const localConfig = {
  wallet,
  server: {
    url: localServerUrl,
  },
  web3: {
    providerUrl: web3ProviderUrl,
  },
  zeroEx: zeroExConfig,
  gasPriceAdaptor: 'average' as GasPriceAdaptor,
}

export const localConfigUseToFill = {
  wallet: walletUseToFill,
  server: {
    url: localServerUrl,
  },
  web3: {
    providerUrl: web3ProviderUrl,
  },
  zeroEx: zeroExConfig,
  gasPriceAdaptor: 'safeLow' as GasPriceAdaptor,
}