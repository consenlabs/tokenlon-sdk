import * as _ from 'lodash'
import BigNumber from '@0xproject/utils'
import { TransactionOpts, ZeroExError } from '0x.js'
import { assert } from '@0xproject/assert'
import helper from './helper'

export const coverageEtherToken = (obj) => {
  _.extend(obj, {
    async depositAsync(
      etherTokenAddress: string,
      amountInWei: BigNumber.BigNumber,
      depositor: string,
      txOpts: TransactionOpts = {},
    ) {
      assert.isETHAddressHex('etherTokenAddress', etherTokenAddress)
      assert.isValidBaseUnitAmount('amountInWei', amountInWei)
      // remove ownerAddress check, because we use privateKey to send tx, not metamask etc.
      // await assert.isSenderAddressAsync('depositor', depositor, this._web3Wrapper)
      // const normalizedEtherTokenAddress = etherTokenAddress.toLowerCase()
      const normalizedDepositorAddress = depositor.toLowerCase()

      const ethBalanceInWei = await this._web3Wrapper.getBalanceInWeiAsync(normalizedDepositorAddress)
      assert.assert(ethBalanceInWei.gte(amountInWei), ZeroExError.InsufficientEthBalanceForDeposit)

      const txHash = helper.etherTokenTransaction('deposit', amountInWei, txOpts ? {
        gasLimit: txOpts.gasLimit,
        gasPrice: txOpts.gasPrice,
      } : txOpts)
      return txHash
    },
    async withdrawAsync (
      etherTokenAddress: string,
      amountInWei: BigNumber.BigNumber,
      withdrawer: string,
      txOpts: TransactionOpts = {},
    ) {
      assert.isValidBaseUnitAmount('amountInWei', amountInWei)
      assert.isETHAddressHex('etherTokenAddress', etherTokenAddress)
      // remove ownerAddress check, because we use privateKey to send tx, not metamask etc.
      // await assert.isSenderAddressAsync('withdrawer', withdrawer, this._web3Wrapper)
      const normalizedEtherTokenAddress = etherTokenAddress.toLowerCase()
      const normalizedWithdrawerAddress = withdrawer.toLowerCase()

      const WETHBalanceInBaseUnits = await this._tokenWrapper.getBalanceAsync(
        normalizedEtherTokenAddress,
        normalizedWithdrawerAddress,
      )
      assert.assert(WETHBalanceInBaseUnits.gte(amountInWei), ZeroExError.InsufficientWEthBalanceForWithdrawal)

      const txHash = helper.etherTokenTransaction('withdraw', amountInWei, txOpts ? {
        gasLimit: txOpts.gasLimit,
        gasPrice: txOpts.gasPrice,
      } : txOpts)
      return txHash
    },
  })
}