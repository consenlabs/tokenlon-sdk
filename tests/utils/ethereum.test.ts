import { fromUnitToDecimalBN } from '../../src/utils/format'
import { encodeData, getEstimateGas, getNonce, sendTransaction, getTokenBalance } from '../../src/utils/ethereum'
import Web3 from 'web3'
import web3 from '../../src/lib/web3-wrapper'
import * as _ from 'lodash'
import { toBN } from '../../src/utils/math'
import { sntWethPairData } from '../__mock__/pair'
import { wallet, web3ProviderUrl } from '../__mock__/config'
import { BigNumber } from '@0xproject/utils'
import { orders } from '../__mock__/order'
import { waitSeconds } from '../__utils__/wait'

jasmine.DEFAULT_TIMEOUT_INTERVAL = 120000

web3.setProvider(new Web3.providers.HttpProvider(web3ProviderUrl))

const waitMined = async (txHash, seconds) => {
  const getReceiptAsync = (txHash) => {
    return new Promise((resolve) => {
      web3.eth.getTransactionReceipt(txHash, (err, res) => {
        if (!err) {
          resolve(res)
        }
      })
    })
  }
  let receipt = await getReceiptAsync(txHash)
  let timeUsed = 0
  if (timeUsed <= seconds) {
    while (!receipt || !timeUsed) {
      await waitSeconds(2)
      receipt = await getReceiptAsync(txHash)
      timeUsed += 2
    }
    console.log('set seconds', seconds)
    console.log('timeUsed', timeUsed)
    return true
  } else {
    return false
  }
}

describe('test getNonce', () => {
  it('test getNonce', async () => {
    const n1 = await getNonce(wallet.address)
    const n2 = await new Promise((resolve, reject) => {
      web3.eth.getTransactionCount(wallet.address, (err, nonce) => {
        if (!err) {
          resolve(nonce)
        } else {
          reject(err)
        }
      })
    })

    expect(_.isNumber(n1)).toBe(true)
    expect(n1).toEqual(n2)
  })
})

describe('test encodeData', () => {
  const order = orders[0]
  const testData = [
    {
      contractName: 'etherToken',
      method: 'deposit',
      args: [fromUnitToDecimalBN(1, sntWethPairData.quote.decimal)],
      encodedData: '0xd0e30db0',
    },
    {
      contractName: 'etherToken',
      method: 'withdraw',
      args: [fromUnitToDecimalBN(1, sntWethPairData.quote.decimal)],
      encodedData: '0x2e1a7d4d0000000000000000000000000000000000000000000000000de0b6b3a7640000',
    },
    {
      contractName: 'exchange',
      method: 'fillOrder',
      args: [
        [
          order.signedOrder.maker,
          order.signedOrder.taker,
          order.signedOrder.makerTokenAddress,
          order.signedOrder.takerTokenAddress,
          order.signedOrder.feeRecipient,
        ],
        [
          order.signedOrder.makerTokenAmount,
          order.signedOrder.takerTokenAmount,
          order.signedOrder.makerFee,
          order.signedOrder.takerFee,
          order.signedOrder.expirationUnixTimestampSec,
          order.signedOrder.salt,
        ].map(n => toBN(n)),
        toBN(order.fillTakerTokenAmount),
        order.shouldThrowOnInsufficientBalanceOrAllowance,
        toBN(order.signedOrder.ecSignature.v),
        order.signedOrder.ecSignature.r,
        order.signedOrder.ecSignature.s,
      ],
      encodedData: order.encodedData,
    },
  ]

  testData.forEach((item) => {
    it(`test ${item.contractName} ${item.method}`, () => {
      expect(encodeData(item.contractName, item.method, item.args)).toEqual(item.encodedData)
    })
  })
})

describe('test getEstimateGas', () => {
  it('test getEstimateGas', async () => {
    const tx = {
      from: wallet.address,
      to: sntWethPairData.quote.contractAddress,
      data: encodeData('etherToken', 'withdraw', [fromUnitToDecimalBN(0.00001, sntWethPairData.quote.decimal)]),
    }
    const g1 = await getEstimateGas(tx)
    const g2 = await new Promise((resolve, reject) => {
      web3.eth.estimateGas(tx, (err, gasLimit) => {
        if (!err) {
          resolve(gasLimit)
        } else {
          reject(err)
        }
      })
    })

    expect(_.isNumber(g1)).toBe(true)
    expect(g1).toEqual(g2)
  })
})

describe('test getTokenBalance and sendTransaction', () => {
  it('test getTokenBalance and sendTransaction', async () => {
    const amount = 0.00001
    const decimalAmountBN = fromUnitToDecimalBN(amount, sntWethPairData.quote.decimal)
    const wethAddr = sntWethPairData.quote.contractAddress
    const defaultParams = {
      ...wallet,
      gasPrice: 20000000000,
      to: wethAddr,
    }
    const withdrawParams = {
      ...defaultParams,
      value: 0,
      data: encodeData('etherToken', 'withdraw', [decimalAmountBN]),
    }
    const depositParams = {
      ...defaultParams,
      value: decimalAmountBN.toNumber(),
      data: encodeData('etherToken', 'deposit', []),
    }

    const wethBalance1 = await getTokenBalance({
      address: wallet.address,
      contractAddress: wethAddr,
    })
    const txHash1 = await sendTransaction(withdrawParams)
    await waitMined(txHash1, 20)
    const wethBalance2 = await getTokenBalance({
      address: wallet.address,
      contractAddress: wethAddr,
    })

    expect(wethBalance1.minus(decimalAmountBN).toString()).toEqual(wethBalance2.toString())

    const txHash2 = await sendTransaction(depositParams)
    await waitMined(txHash2, 20)

    const wethBalance3 = await getTokenBalance({
      address: wallet.address,
      contractAddress: wethAddr,
    })
    expect(wethBalance1.toString()).toEqual(wethBalance3.toString())
  })
})