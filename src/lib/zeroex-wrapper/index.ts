import { ZeroEx, ZeroExConfig } from '0x.js'
import web3Wrapper from '../web3-wrapper'
import { coverageToken } from './_token'
import { coverageEtherToken } from './_etherToken'
import { coverageExchange } from './_exchange'

export const createZeroExWrapper = (config: ZeroExConfig) => {
  const instance = new ZeroEx(
    web3Wrapper.currentProvider,
    config,
  )

  coverageToken(instance.token)
  coverageEtherToken(instance.etherToken)
  coverageExchange(instance.exchange)

  return instance
}
