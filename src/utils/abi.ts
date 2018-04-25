import * as token from '0x.js/lib/src/artifacts/Token.json'
import * as exchange from '0x.js/lib/src/artifacts/Exchange.json'
import * as etherToken from '0x.js/lib/src/artifacts/EtherToken.json'
import { TokenlonError } from '../types'

import { newError } from './helper'

const contractStack = { token, exchange, etherToken }

export const getAbiInputTypes = (contractName: string, method: string) => {
  const ct = contractStack[contractName]
  if (!ct) throw newError(TokenlonError.InvalidContractName)

  const abiMethod = ct.abi.find(abi => abi.name === method)
  if (!abiMethod) throw newError(TokenlonError.InvalidContractMethod)

  return abiMethod.inputs.map(i => i.type)
}