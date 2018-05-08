import * as _ from 'lodash'
import { ZeroEx } from '0x.js'
import { localConfig, web3ProviderUrl, walletUseToFill } from '../__mock__/config'
import { sntWethPairData } from '../__mock__/pair'
import { createTokenlon } from '../../src/index'
import { orderStringToBN } from '../../src/utils/dex'
import Tokenlon from '../../src/tokenlon'
import Web3 from 'web3'
import web3 from '../../src/lib/web3-wrapper'
import { orders } from '../__mock__/order'
import { getTimestamp } from '../../src/utils/helper'

web3.setProvider(new Web3.providers.HttpProvider(web3ProviderUrl))

jasmine.DEFAULT_TIMEOUT_INTERVAL = 120000

const simpleOrder = {
  base: 'SNT',
  quote: 'WETH',
  price: 0.0002,
  amount: 100000000,
  side: 'BUY',
  expirationUnixTimestampSec: getTimestamp() + 3 * 60,
}

describe('test validateOption with getSignedOrderBySimpleOrderAsync', () => {
  it('should validate and thorw error when validate option is true', async () => {
    const tokenlon = await createTokenlon(localConfig)
    let errorMsg = null
    try {
      await tokenlon.utils.getSignedOrderBySimpleOrderAsync(simpleOrder)
    } catch (e) {
      errorMsg = e && e.message
    }

    expect(errorMsg).toBeTruthy()
  })

  it('should not do validate and got a signedOrder when validate option is false', async () => {
    const tokenlon = await createTokenlon({
      ...localConfig,
      onChainValidate: false,
    })
    const signedOrder = await tokenlon.utils.getSignedOrderBySimpleOrderAsync(simpleOrder)
    const convertedSimpleOrder = tokenlon.utils.getSimpleOrderWithBaseQuoteBySignedOrder(signedOrder)

    for (let prop of ['base', 'quote', 'side', 'price', 'amount', 'expirationUnixTimestampSec']) {
      expect(convertedSimpleOrder[prop]).toEqual(simpleOrder[prop])
    }
  })
})