import * as ethAbi from 'ethereumjs-abi'
import * as ethUtil from 'ethereumjs-util'
import * as Tx from 'ethereumjs-tx'
import * as _ from 'lodash'
import web3 from '../lib/web3-wrapper'
import { getAbiInputTypes } from './abi'
import { isBigNumber, toBN } from './math'
import { Ethereum } from '../types'
import { BigNumber } from '@0xproject/utils'

// Executes a message call or transaction, which is directly executed in the VM of the node,
// but never mined into the blockchain and returns the amount of the gas used.
export const getEstimateGas = (tx): Promise<number> => {
  return new Promise((resolve, reject) => {
    // console.log(`[web3 req] estimateGas params: ${JSON.stringify(tx)}`)
    web3.eth.estimateGas(tx, (err, gas) => {
      if (!err) {
        resolve(gas)
      } else {
        reject(err)
      }
    })
  })
}

// Get the numbers of transactions sent from this address.
export const getNonce = (address) => {
  return new Promise((resolve, reject) => {
    // console.log(`[web3 req] getTransactionCount params: ${address}`)
    web3.eth.getTransactionCount(address, (err, nonce) => {
      if (!err) {
        // console.log(`[web3 res] getTransactionCount: ${nonce}`)
        resolve(nonce)
      } else {
        reject(err)
      }
    })
  })
}

const formatArgs = (args: any[]) => {
  return args.map(item => {
    if (_.isArray(item)) return formatArgs(item)
    if (isBigNumber(item)) return item.toString()
    return item
  })
}

/**
 * @params.contractName
 * @params.method   contract method name
 * @params.args     contract method arguments
 * @description
 * generate data 的 三种实现方式
 * 1. 两年前的 https://github.com/ethereum/solidity.js （未实验）
 * 2. web3.js lib/solidity/coder （拆不出来）
 *    https://github.com/ethereum/web3.js/blob/6d3e61a010501011a107a79574cc7516900fa9e4/lib/solidity/coder.js
 *    https://github.com/ethereum/web3.js/blob/db6efd5f2309f9aeab6283383b3f4a3d1dcb7177/lib/web3/function.js#L92
 *    https://github.com/ethereum/web3.js/blob/db6efd5f2309f9aeab6283383b3f4a3d1dcb7177/lib/web3.js#L107
 * 3. ethereumjs-abi https://github.com/ethereumjs/ethereumjs-abi/blob/master/lib/index.js
 */
export const encodeData = (contractName: string, method: string, args: any[]): string => {
  const types = getAbiInputTypes(contractName, method)
  const signatureBuffer = ethAbi.methodID(method, types)
  const mainBuffer = ethAbi.rawEncode(types, formatArgs(args))
  const data = ethUtil.bufferToHex(Buffer.concat([signatureBuffer, mainBuffer]))
  return data
}

export const getTokenBalance = ({ address, contractAddress }): Promise<BigNumber> => {
  return new Promise((resolve, reject) => {
    web3.eth.call({
      to: contractAddress,
      data: encodeData('token', 'balanceOf', [address]),
    }, (err, res) => {
      if (err) {
        return reject(err)
      }
      resolve(toBN(res))
    })
  })
}

// use ethereumjs-tx and web3.eth.sendRawTransaction to send transaction by privateKey
// value must be a decimal processed number
export const sendTransaction = async (params: Ethereum.SendTransactionParams): Promise<any> => {
  const { address, privateKey, gasPrice, to, value, gasLimit, data } = params
  const nonce = await getNonce(address)
  let estimateGas = 0
  try {
    estimateGas = await getEstimateGas({
      from: address,
      to,
      value: web3.toHex(value),
      data,
    })
  } catch (_e) {}

  const privateKeyBuffer = new Buffer(privateKey, 'hex')
  const gas = estimateGas && gasLimit ? Math.max(estimateGas, gasLimit) : (estimateGas || gasLimit)
  const rawTx = {
    to,
    data: data || '',
    nonce: web3.toHex(nonce),
    gasPrice: web3.toHex(gasPrice),
    gasLimit: web3.toHex(gas),
    value: web3.toHex(value),
  }
  const tx = new (Tx.default ? Tx.default : Tx)(rawTx)
  tx.sign(privateKeyBuffer)
  const serializedTx = tx.serialize()

  return new Promise((resolve, reject) => {
    web3.eth.sendRawTransaction('0x' + serializedTx.toString('hex'), (err, txHash: string) => {
      if (!err) {
        resolve(txHash)
      } else {
        reject(err)
      }
    })
  })
}