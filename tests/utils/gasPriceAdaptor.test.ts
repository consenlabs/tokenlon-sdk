import { GasPriceAdaptor } from '../../src/types'
import { getGasPriceByAdaptorAsync } from '../../src/utils/gasPriceAdaptor'
import { waitSeconds } from '../__utils__/wait'
import * as _ from 'lodash'

jasmine.DEFAULT_TIMEOUT_INTERVAL = 120000

const testData = ['safeLow', 'average', 'fast']

describe('test adaptor', () => {
  for (let ad of testData) {
    it(`${ad} should larger than or equal with 1Gwei`, async () => {
      const gasPriceBefore = await getGasPriceByAdaptorAsync(ad as GasPriceAdaptor)
      expect(gasPriceBefore).toBeGreaterThanOrEqual(Math.pow(10, 9))
    })

    it(`${ad} within 60 seconds should be same`, async () => {
      const gasPriceBefore = await getGasPriceByAdaptorAsync(ad as GasPriceAdaptor)
      await waitSeconds(40)
      const gasPrice25 = await getGasPriceByAdaptorAsync(ad as GasPriceAdaptor)
      expect(gasPriceBefore).toEqual(gasPrice25)
    })
  }

  it(`fast should larger than average, and average should larger then safeLow`, async () => {
    const gasPriceA = await getGasPriceByAdaptorAsync('fast')
    const gasPriceB = await getGasPriceByAdaptorAsync('average')
    const gasPriceC = await getGasPriceByAdaptorAsync('safeLow')

    expect(gasPriceA).toBeGreaterThanOrEqual(gasPriceB)
    expect(gasPriceB).toBeGreaterThanOrEqual(gasPriceC)
  })
})