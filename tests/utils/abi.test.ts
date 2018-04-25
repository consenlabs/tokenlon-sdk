import { getAbiInputTypes } from '../../src/utils/abi'

describe('getAbiInputTypes', () => {
  const etherToken = [
    'deposit',
    'withdraw',
  ]

  const exchange = [
    'fillOrder',
    'cancelOrder',
    'batchFillOrders',
    'fillOrdersUpTo',
    'fillOrKillOrder',
    'batchFillOrKillOrders',
    'batchCancelOrders',
  ]

  etherToken.forEach(method => {
    it(`etherToken ${method} must be exists`, () => {
      expect(getAbiInputTypes('etherToken', method).length).toBeGreaterThanOrEqual(0)
    })
  })

  exchange.forEach(method => {
    it(`exchange ${method} must be exists`, () => {
      expect(getAbiInputTypes('exchange', method).length).toBeGreaterThan(0)
    })
  })
})