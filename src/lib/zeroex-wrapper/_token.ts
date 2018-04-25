import { BigNumber } from '@0xproject/utils'
import { assert } from '@0xproject/assert'
import * as _ from 'lodash'

import { TransactionOpts, ZeroExError } from '0x.js/lib/src/types'
import helper from './helper'

// only need to cover setAllowanceAsync, transferAsync, transferFromAsync
// other functions just use these below functions to send transaction
export const coverageToken = (obj) => {
  // use _.extends to shallow extend
  return _.extend(obj, {
    async setAllowanceAsync(
      tokenAddress: string,
      ownerAddress: string,
      spenderAddress: string,
      amountInBaseUnits: BigNumber,
      txOpts: TransactionOpts = {},
    ) {
      assert.isETHAddressHex('spenderAddress', spenderAddress)
      assert.isETHAddressHex('tokenAddress', tokenAddress)
      // remove ownerAddress check, because we use privateKey to send tx, not metamask etc.
      // await assert.isSenderAddressAsync('ownerAddress', ownerAddress, this._web3Wrapper)
      const normalizedTokenAddress = tokenAddress.toLowerCase()
      const normalizedSpenderAddress = spenderAddress.toLowerCase()
      const normalizedOwnerAddress = ownerAddress.toLowerCase()
      assert.isValidBaseUnitAmount('amountInBaseUnits', amountInBaseUnits)
      return helper.tokenApproveTransaction(
        normalizedTokenAddress,
        normalizedSpenderAddress,
        amountInBaseUnits,
        {
          from: normalizedOwnerAddress,
          gas: txOpts.gasLimit,
          gasPrice: txOpts.gasPrice,
        },
      )
    },

    async transferAsync(
      tokenAddress: string,
      fromAddress: string,
      toAddress: string,
      amountInBaseUnits: BigNumber,
      txOpts: TransactionOpts = {},
    ) {
      assert.isETHAddressHex('tokenAddress', tokenAddress)
      assert.isETHAddressHex('toAddress', toAddress)
      // remove ownerAddress check, because we use privateKey to send tx, not metamask etc.
      // await assert.isSenderAddressAsync('fromAddress', fromAddress, this._web3Wrapper)
      const normalizedTokenAddress = tokenAddress.toLowerCase()
      const normalizedFromAddress = fromAddress.toLowerCase()
      const normalizedToAddress = toAddress.toLowerCase()
      assert.isValidBaseUnitAmount('amountInBaseUnits', amountInBaseUnits)

      const fromAddressBalance = await this.getBalanceAsync(normalizedTokenAddress, normalizedFromAddress)
      if (fromAddressBalance.lessThan(amountInBaseUnits)) {
        throw new Error(ZeroExError.InsufficientBalanceForTransfer)
      }
      return helper.tokenTransferTransaction(
        normalizedTokenAddress,
        normalizedToAddress,
        amountInBaseUnits,
        {
          from: normalizedFromAddress,
          gas: txOpts.gasLimit,
          gasPrice: txOpts.gasPrice,
        },
      )
    },

    async transferFromAsync(
      tokenAddress: string,
      fromAddress: string,
      toAddress: string,
      senderAddress: string,
      amountInBaseUnits: BigNumber,
      txOpts: TransactionOpts = {},
    ): Promise<string> {
      assert.isETHAddressHex('toAddress', toAddress)
      assert.isETHAddressHex('fromAddress', fromAddress)
      assert.isETHAddressHex('tokenAddress', tokenAddress)
      // remove ownerAddress check, because we use privateKey to send tx, not metamask etc.
      // await assert.isSenderAddressAsync('senderAddress', senderAddress, this._web3Wrapper)
      const normalizedToAddress = toAddress.toLowerCase()
      const normalizedFromAddress = fromAddress.toLowerCase()
      const normalizedTokenAddress = tokenAddress.toLowerCase()
      const normalizedSenderAddress = senderAddress.toLowerCase()
      assert.isValidBaseUnitAmount('amountInBaseUnits', amountInBaseUnits)

      const fromAddressAllowance = await this.getAllowanceAsync(
        normalizedTokenAddress,
        normalizedFromAddress,
        normalizedSenderAddress,
      )
      if (fromAddressAllowance.lessThan(amountInBaseUnits)) {
        throw new Error(ZeroExError.InsufficientAllowanceForTransfer)
      }

      const fromAddressBalance = await this.getBalanceAsync(normalizedTokenAddress, normalizedFromAddress)
      if (fromAddressBalance.lessThan(amountInBaseUnits)) {
        throw new Error(ZeroExError.InsufficientBalanceForTransfer)
      }

      return helper.tokenTransferFromTransaction(
        normalizedTokenAddress,
        normalizedFromAddress,
        normalizedToAddress,
        amountInBaseUnits,
        {
          from: normalizedSenderAddress,
          gas: txOpts.gasLimit,
          gasPrice: txOpts.gasPrice,
        },
      )
    },
  })
}