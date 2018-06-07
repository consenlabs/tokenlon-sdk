import { encodeData, sendTransaction } from '../../utils/ethereum'
import { BigNumber } from '@0xproject/utils'
import { GlobalConfig } from '../../types'
import { getGasPriceByAdaptorAsync } from '../../utils/gasPriceAdaptor'

export default {
  _config: {} as GlobalConfig,
  setConfig(config: GlobalConfig) {
    this._config = config
  },
  async exchangeSendTransaction(method: string, args: any[]) {
    const { wallet, zeroEx, gasPriceAdaptor } = this._config
    const { address, privateKey } = wallet
    const { gasLimit, exchangeContractAddress } = zeroEx
    const gasPrice = await getGasPriceByAdaptorAsync(gasPriceAdaptor)

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
  async _tokenTransaction(to: string, method: string, args: any[], opts) {
    const { wallet, zeroEx, gasPriceAdaptor } = this._config
    const { address, privateKey } = wallet
    const { gasLimit } = zeroEx
    const gasPrice = await getGasPriceByAdaptorAsync(gasPriceAdaptor)

    return sendTransaction({
      address,
      privateKey,
      gasLimit: opts && opts.gas ? opts.gas : gasLimit,
      gasPrice: opts && opts.gasPrice ? opts.gasPrice : gasPrice,
      to,
      value: 0,
      data: encodeData('token', method, args),
    })
  },
  async etherTokenTransaction(method: string, amountInBaseUnits: BigNumber, opts) {
    const { wallet, zeroEx, gasPriceAdaptor } = this._config
    const { address, privateKey } = wallet
    const { gasLimit, etherTokenContractAddress } = zeroEx
    const gasPrice = await getGasPriceByAdaptorAsync(gasPriceAdaptor)

    return sendTransaction({
      address,
      privateKey,
      gasLimit: opts && opts.gas ? opts.gas : gasLimit,
      gasPrice: opts && opts.gasPrice ? opts.gasPrice : gasPrice,
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