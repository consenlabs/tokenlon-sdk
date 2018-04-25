import * as _ from 'lodash'
import { localConfig, web3ProviderUrl, walletUseToFill } from '../__mock__/config'
import { sntWethPairData } from '../__mock__/pair'
import { createTokenlon } from '../../src/index'
import Tokenlon from '../../src/tokenlon'
import Web3 from 'web3'
import web3 from '../../src/lib/web3-wrapper'
import { fromDecimalToUnit } from '../../src/utils/format'
import { getTokenBalance } from '../../src/utils/ethereum'

let tokenlon = null as Tokenlon
web3.setProvider(new Web3.providers.HttpProvider(web3ProviderUrl))

beforeAll(async () => {
  tokenlon = await createTokenlon(localConfig)
})

describe('test getTokenBalance', () => {
  it(`test getTokenBalance ${walletUseToFill.address} ETH`, async () => {
    const balance1 = await tokenlon.getTokenBalance('ETH', walletUseToFill.address)
    const balance2 = fromDecimalToUnit(web3.eth.getBalance(walletUseToFill.address), 18).toNumber()
    expect(balance1).toEqual(balance2)
  })

  it(`test getTokenBalance ${localConfig.wallet.address} SNT`, async () => {
    const balance1 = await tokenlon.getTokenBalance(sntWethPairData.base.symbol)
    const balance2BN = await getTokenBalance({
      address: localConfig.wallet.address,
      contractAddress: sntWethPairData.base.contractAddress,
    })
    const balance2 = fromDecimalToUnit(balance2BN, sntWethPairData.base.decimal).toNumber()

    expect(balance1).toEqual(balance2)
  })
})