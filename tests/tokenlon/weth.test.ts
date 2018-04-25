import * as _ from 'lodash'
import { localConfig } from '../__mock__/config'
import { sntWethPairData } from '../__mock__/pair'
import { createTokenlon } from '../../src/index'
import Tokenlon from '../../src/tokenlon'
import { toBN } from '../../src/utils/math'
import { waitMined } from '../__utils__/wait'

let tokenlon = null as Tokenlon
jasmine.DEFAULT_TIMEOUT_INTERVAL = 120000

beforeAll(async () => {
  tokenlon = await createTokenlon(localConfig)
})

describe('test deposit / withdraw', () => {
  it('test deposit / withdraw', async () => {
    const amount = 0.0000562
    const wethBalance1 = await tokenlon.getTokenBalance(sntWethPairData.quote.symbol)
    const txHash1 = await tokenlon.withdraw(amount)
    await waitMined(txHash1, 30)

    const wethBalance2 = await tokenlon.getTokenBalance(sntWethPairData.quote.symbol)
    expect(toBN(wethBalance1).minus(amount).eq(toBN(wethBalance2))).toBe(true)

    const txHash2 = await tokenlon.deposit(amount)
    await waitMined(txHash2, 30)

    const wethBalance3 = await tokenlon.getTokenBalance(sntWethPairData.quote.symbol)
    expect(wethBalance1).toEqual(wethBalance3)
  })
})