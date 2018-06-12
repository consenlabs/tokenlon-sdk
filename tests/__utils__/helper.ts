import { wallet, web3ProviderUrl, placeOrderWalletAddress } from '../__mock__/config'
import { helpCompareStr } from '../../src/utils/helper'
import * as Web3 from 'web3'
import web3 from '../../src/lib/web3-wrapper'

web3.setProvider(new (Web3 ? Web3 : Web3.default).providers.HttpProvider(web3ProviderUrl))

export const filterOrderBook = (orderBooks) => {
  return orderBooks.filter(o => {
    const singedOrderString = JSON.parse(o.rawOrder)
    return !o.isMaker && (
      helpCompareStr(singedOrderString.maker, wallet.address) ||
      helpCompareStr(singedOrderString.maker, placeOrderWalletAddress)
    )
  })
}

export const getReceiptAsync = (txHash) => {
  return new Promise((resolve) => {
    web3.eth.getTransactionReceipt(txHash, (err, res) => {
      if (!err) {
        resolve(res)
      }
    })
  })
}

export const getTransactionAsync = async (txHash) => {
  return web3.eth.getTransaction(txHash)
}

export const getGasPriceByTransactionAsync = async (txHash) => {
  const r = web3.eth.getTransaction(txHash)
  return r ? r.gasPrice.toNumber() : null
}

export const getGasLimitByTransactionAsync = async (txHash) => {
  const r = web3.eth.getTransaction(txHash)
  return r ? r.gas : null
}