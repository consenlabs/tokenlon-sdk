import Web3 from 'web3'
import { web3ProviderUrl } from '../__mock__/config'
import web3 from '../../src/lib/web3-wrapper'

web3.setProvider(new Web3.providers.HttpProvider(web3ProviderUrl))

export const waitSeconds = (seconds) => {
  return new Promise(resolve => {
    setTimeout(resolve, seconds * 1000)
  })
}

export const waitMined = async (txHash, seconds) => {
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
    await waitSeconds(2)
    return true
  } else {
    return false
  }
}
