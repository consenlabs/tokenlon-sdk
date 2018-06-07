import * as _ from 'lodash'
import web3Wrapper from './lib/web3-wrapper'
import { createZeroExWrapper } from './lib/zeroex-wrapper'
import zeroExWrapperHelper from './lib/zeroex-wrapper/helper'
import { assert as assertUtils } from '0x.js/lib/src/utils/assert'
import { Server } from './lib/server'
import Tokenlon from './tokenlon'
import { toBN } from './utils/math'
import { lowerCaseObjValue } from './utils/helper'
import { assert, rewriteAssertUtils } from './utils/assert'
import { getGasPriceByAdaptorAsync } from './utils/gasPriceAdaptor'
import { GlobalConfig, DexOrderBNToString, Tokenlon as TokenlonInterface } from './types'
import { getPairBySymbol } from './utils/pair'
import { getSimpleOrderWithBaseQuoteBySignedOrder, getSignedOrder, generateDexOrderWithoutSalt, orderBNToString, orderStringToBN } from './utils/dex'

export const createTokenlon = async (options: GlobalConfig): Promise<Tokenlon> => {
  const config = lowerCaseObjValue(options)
  // default onChainValidate config is true
  config.onChainValidate = config.onChainValidate === false ? config.onChainValidate : true
  assert.isValidConfig(config)

  const server = new Server(config.server.url, config.wallet)
  const pairList = await server.getPairList()
  const tokenlon = new Tokenlon()
  const pairs = pairList.filter(p => p.protocol === '0x')
  const gasPrice = await getGasPriceByAdaptorAsync(config.gasPriceAdaptor)

  // need to set privider fitst
  await web3Wrapper.setProvider(new web3Wrapper.providers.HttpProvider(config.web3.providerUrl))

  const zeroExConfig = config.zeroEx
  zeroExWrapperHelper.setConfig(config)
  // Notice: prevent that isSenderAddressAsync get web3.eth.accounts that made assert error
  rewriteAssertUtils(assertUtils)
  const zeroExWrapper = createZeroExWrapper({
    ...zeroExConfig,
    gasPrice: toBN(gasPrice),
  })

  return _.extend(tokenlon, {
    _pairs: pairs,
    _config: config,
    server,
    web3Wrapper,
    zeroExWrapper,
    utils: {
      orderBNToString,
      orderStringToBN,
      getSimpleOrderWithBaseQuoteBySignedOrder(order: DexOrderBNToString) {
        return getSimpleOrderWithBaseQuoteBySignedOrder(order, pairs)
      },
      async getSignedOrderBySimpleOrderAsync(order: TokenlonInterface.SimpleOrderWithBaseQuote) {
        const pair = getPairBySymbol(order, pairs)
        const orderWithoutSalt = generateDexOrderWithoutSalt({
          pair,
          config,
          simpleOrder: order,
        })
        const signedOrder = getSignedOrder(orderWithoutSalt, config)
        if (config.onChainValidate) {
          await zeroExWrapper.exchange.validateOrderFillableOrThrowAsync(signedOrder)
        }
        return orderBNToString(signedOrder)
      },
    },
  })
}