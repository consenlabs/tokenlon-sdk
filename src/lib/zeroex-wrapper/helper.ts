import { encodeData, sendTransaction } from '../../utils/ethereum'
import { BigNumber } from '@0xproject/utils'
import { GlobalConfig } from '../../types'

export default {
  _config: {} as GlobalConfig,
  setConfig(config: GlobalConfig) {
    this._config = config
  },
  exchangeSendTransaction(method: string, args: any[]) {
    const { wallet, zeroEx } = this._config
    const { address, privateKey } = wallet
    const { gasLimit, gasPrice, exchangeContractAddress } = zeroEx
    return sendTransaction({
      address,
      privateKey,
      gasLimit,
      gasPrice,
      to: exchangeContractAddress,
      value: 0,
      data: encodeData('exchange', method, args),
    })
  },
  _tokenTransaction(to: string, method: string, args: any[], opts) {
    const { wallet, zeroEx } = this._config
    const { address, privateKey } = wallet
    const { gasLimit, gasPrice } = zeroEx

    return sendTransaction({
      address,
      privateKey,
      gasLimit: opts ? opts.gas : gasLimit,
      gasPrice: opts ? opts.gasPrice : gasPrice,
      to,
      value: 0,
      data: encodeData('token', method, args),
    })
  },
  etherTokenTransaction(method: string, amountInBaseUnits: BigNumber, opts) {
    const { wallet, zeroEx } = this._config
    const { address, privateKey } = wallet
    const { gasLimit, gasPrice, etherTokenContractAddress } = zeroEx

    return sendTransaction({
      address,
      privateKey,
      gasLimit: opts ? opts.gas : gasLimit,
      gasPrice: opts ? opts.gasPrice : gasPrice,
      to: etherTokenContractAddress,
      value: method === 'deposit' ? amountInBaseUnits.toNumber() : 0,
      data: encodeData('etherToken', method, [amountInBaseUnits.toString()]),
    })
  },
  tokenApproveTransaction(normalizedTokenAddress, normalizedSpenderAddress, amountInBaseUnits, opts) {
    return this._tokenTransaction(normalizedTokenAddress, 'approve', [
      normalizedSpenderAddress,
      amountInBaseUnits,
    ], opts)
  },
  tokenTransferTransaction(normalizedTokenAddress, normalizedSpenderAddress, amountInBaseUnits, opts) {
    return this._tokenTransaction(normalizedTokenAddress, 'transfer', [
      normalizedSpenderAddress,
      amountInBaseUnits,
    ], opts)
  },
  tokenTransferFromTransaction(
    normalizedTokenAddress,
    normalizedFromAddress,
    normalizedToAddress,
    amountInBaseUnits,
    opts,
  ) {
    return this._tokenTransaction(normalizedTokenAddress, 'transferFrom', [
      normalizedFromAddress,
      normalizedToAddress,
      amountInBaseUnits,
    ], opts)
  },

}