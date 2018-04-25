import { constants } from '0x.js/lib/src/utils/constants'
import { localConfig, localConfigUseToFill, web3ProviderUrl } from '../__mock__/config'
import { sntWethPairData } from '../__mock__/pair'
import { createTokenlon } from '../../src/index'
import Tokenlon from '../../src/tokenlon'
import Web3 from 'web3'
import web3 from '../../src/lib/web3-wrapper'
import { fromDecimalToUnit } from '../../src/utils/format'
import { getTokenBalance } from '../../src/utils/ethereum'
import { toBN } from '../../src/utils/math'
import { waitMined } from '../__utils__/wait'

jasmine.DEFAULT_TIMEOUT_INTERVAL = 120000

let tokenlon = null as Tokenlon
web3.setProvider(new Web3.providers.HttpProvider(web3ProviderUrl))

beforeAll(async () => {
  tokenlon = await createTokenlon(localConfigUseToFill)
})

describe('test setAllowance / setAllowance / getAllowance', () => {
  it(`test setAllowance / setAllowance / getAllowance`, async () => {
    const amount = 562.562562
    const tokenName = sntWethPairData.base.symbol
    const txHash1 = await tokenlon.setAllowance(tokenName, amount)
    await waitMined(txHash1, 30)
    const allowance1 = await tokenlon.getAllowance(tokenName)
    expect(allowance1).toEqual(amount)

    const txHash2 = await tokenlon.setUnlimitedAllowance(tokenName)
    await waitMined(txHash2, 30)
    const allowance2 = await tokenlon.getAllowance(tokenName)
    expect(allowance2).toEqual(fromDecimalToUnit(constants.UNLIMITED_ALLOWANCE_IN_BASE_UNITS, sntWethPairData.base.decimal).toNumber())
  })
})