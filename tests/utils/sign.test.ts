import { ZeroEx } from '0x.js'
import * as _ from 'lodash'
import { personalECSign, personalECSignHex, personalSign } from '../../src/utils/sign'
import { toBN } from '../../src/utils/math'
import { wallet, zeroExConfig } from '../__mock__/config'
import { orders } from '../__mock__/order'

describe('test sign util', () => {
  it('test personalECSignHex', () => {
    const order = orders[0]
    const hash = ZeroEx.getOrderHashHex({
      exchangeContractAddress: zeroExConfig.exchangeContractAddress,
      maker: order.signedOrder.maker,
      taker: order.signedOrder.taker,
      makerTokenAddress: order.signedOrder.makerTokenAddress,
      takerTokenAddress: order.signedOrder.takerTokenAddress,
      feeRecipient: order.signedOrder.feeRecipient,
      makerTokenAmount: toBN(order.signedOrder.makerTokenAmount),
      takerTokenAmount: toBN(order.signedOrder.takerTokenAmount),
      makerFee: toBN(order.signedOrder.makerFee),
      takerFee: toBN(order.signedOrder.takerFee),
      expirationUnixTimestampSec: toBN(order.signedOrder.expirationUnixTimestampSec),
      salt: toBN(order.signedOrder.salt),
    })

    const ecSignature = personalECSignHex(wallet.privateKey, hash)

    expect(_.isEqual(ecSignature, order.signedOrder.ecSignature)).toBe(true)
  })
})