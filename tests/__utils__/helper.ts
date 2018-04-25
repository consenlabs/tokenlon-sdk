import { wallet, placeOrderWalletAddress } from '../__mock__/config'
import { helpCompareStr } from '../../src/utils/helper'

export const filterOrderBook = (orderBooks) => {
  return orderBooks.filter(o => {
    const singedOrderString = JSON.parse(o.rawOrder)
    return !o.isMaker && (
      helpCompareStr(singedOrderString.maker, wallet.address) ||
      helpCompareStr(singedOrderString.maker, placeOrderWalletAddress)
    )
  })
}