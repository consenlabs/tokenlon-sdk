import Web3 from 'web3'
import { web3ProviderUrl } from '../__mock__/config'
import web3 from '../../src/lib/web3-wrapper'

web3.setProvider(new Web3.providers.HttpProvider(web3ProviderUrl))

export const waitSeconds = (seconds) => {
  return new Promise(resolve => {
    setTimeout(resolve, seconds * 1000)
  })
}

const getReceiptAsync = (txHash) => {
  return new Promise((resolve) => {
    web3.eth.getTransactionReceipt(txHash, (err, res) => {
      if (!err) {
        resolve(res)
      }
    })
  })
}

export const waitMined = async (txHash, seconds) => {
  let receipt = await getReceiptAsync(txHash) as any
  let timeUsed = 0

  while ((!receipt || receipt.blockNumber <= 0) && timeUsed <= seconds) {
    await waitSeconds(2)
    receipt = await getReceiptAsync(txHash)
    timeUsed += 2
  }

  if (receipt && receipt.blockNumber > 0) {
    console.log('set seconds', seconds)
    console.log('timeUsed', timeUsed)
    await waitSeconds(2)
    return true
  }
  return false
}
