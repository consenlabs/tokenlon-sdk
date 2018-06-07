import { encodeData, sendTransaction } from '../../utils/ethereum'
import { OrderTransactionOpts } from '0x.js'
import { BigNumber } from '@0xproject/utils'
import { GlobalConfig, Tokenlon } from '../../types'
import { TransactionOpts } from '0x.js'
import { getGasPriceByAdaptorAsync } from '../../utils/gasPriceAdaptor'

export default {
  _config: {} as GlobalConfig,
  setConfig(config: GlobalConfig) {
    this._config = config
  },
  async _getGasLimitAndGasPriceAsync(opts?: TransactionOpts): Promise<Tokenlon.TokenlonTransactionOpts> {
    const { zeroEx, gasPriceAdaptor } = this._config
    const { gasLimit } = zeroEx
    let gasP = null

    if (opts && opts.gasPrice) {
      gasP = opts.gasPrice.toNumber()
    } else {
      gasP = await getGasPriceByAdaptorAsync(gasPriceAdaptor)
    }

    return {
      gasPrice: gasP,
      gasLimit: opts && opts.gasLimit ? opts.gasLimit : gasLimit,
    }
  },
  async exchangeSendTransaction(method: string, args: any[], orderTransactionOpts?: OrderTransactionOpts) {
    const { wallet, zeroEx } = this._config
    const { address, privateKey } = wallet
    const { exchangeContractAddress } = zeroEx
    const { gasPrice, gasLimit } = await this._getGasLimitAndGasPriceAsync(orderTransactionOpts)

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
  async _tokenTransaction(to: string, method: string, args: any[], opts?: TransactionOpts) {
    const { wallet } = this._config
    const { address, privateKey } = wallet
    const { gasPrice, gasLimit } = await this._getGasLimitAndGasPriceAsync(opts)

    return sendTransaction({
      address,
      privateKey,
      gasLimit,
      gasPrice,
      to,
      value: 0,
      data: encodeData('token', method, args),
    })
  },
  async etherTokenTransaction(method: string, amountInBaseUnits: BigNumber, opts?: TransactionOpts) {
    const { wallet, zeroEx } = this._config
    const { address, privateKey } = wallet
    const { etherTokenContractAddress } = zeroEx
    const { gasPrice, gasLimit } = await this._getGasLimitAndGasPriceAsync(opts)

    return sendTransaction({
      address,
      privateKey,
      gasLimit,
      gasPrice,
      to: etherTokenContractAddress,
      value: method === 'deposit' ? amountInBaseUnits.toNumber() : 0,
      data: encodeData('etherToken', method, [amountInBaseUnits.toString()]),
    })
  },
  tokenApproveTransaction(normalizedTokenAddress, normalizedSpenderAddress, amountInBaseUnits, opts?: TransactionOpts) {
    return this._tokenTransaction(normalizedTokenAddress, 'approve', [
      normalizedSpenderAddress,
      amountInBaseUnits,
    ], opts)
  },
  tokenTransferTransaction(normalizedTokenAddress, normalizedSpenderAddress, amountInBaseUnits, opts?: TransactionOpts) {
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
    opts?: TransactionOpts,
  ) {
    return this._tokenTransaction(normalizedTokenAddress, 'transferFrom', [
      normalizedFromAddress,
      normalizedToAddress,
      amountInBaseUnits,
    ], opts)
  },
}