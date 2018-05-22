import * as _ from 'lodash'
import * as ethUtil from 'ethereumjs-util'
import { Wallet } from '../../src/types'
import { localConfig, walletUseToFill } from '../__mock__/config'
import { sntWethPairData } from '../__mock__/pair'
import { Server } from '../../src/lib/server'

import { jsonrpc } from '../../src/lib/server/_request'
import { personalSign } from '../../src/utils/sign'
import { getTimestamp } from '../../src/utils/helper'

const server = new Server(localConfig.server.url, localConfig.wallet)

const getToken = async (timestamp, wallet: Wallet) => {
  const signature = personalSign(wallet.privateKey, timestamp.toString())
  return jsonrpc.get(localConfig.server.url, {}, 'auth.getToken', [{
    timestamp,
    signature,
  }]).then(data => {
    return data.token
  })
}

describe('test JWT signature', () => {
  it('test signature', () => {
    const timestamp = getTimestamp()
    const signature = personalSign(localConfig.wallet.privateKey, timestamp.toString())

    // Same data as before
    const message = ethUtil.toBuffer(timestamp.toString())
    const msgHash = ethUtil.hashPersonalMessage(message)
    const signatureBuffer = ethUtil.toBuffer(signature)
    const sigParams = ethUtil.fromRpcSig(signatureBuffer)
    const publicKey = ethUtil.ecrecover(msgHash, sigParams.v, sigParams.r, sigParams.s)
    const sender = ethUtil.publicToAddress(publicKey)
    const addr = ethUtil.bufferToHex(sender)

    expect(addr).toEqual(localConfig.wallet.address.toLowerCase())
  })
})

describe('test getToken', () => {
  const testItems = [
    {
      testMsg: 'get token success with now timestamp',
      timestamp: getTimestamp(),
      wallet: localConfig.wallet,
      result: true,
    },
    {
      testMsg: 'get token success with timestamp 1 hour before',
      timestamp: getTimestamp() - 3599,
      wallet: localConfig.wallet,
      result: true,
    },
    {
      testMsg: 'get token success with timestamp 1 hour after',
      timestamp: getTimestamp() + 3599,
      wallet: localConfig.wallet,
      result: true,
    },
    {
      testMsg: 'should faild when getting token failed with timestamp more then 1 hour before',
      timestamp: getTimestamp() - 3602,
      wallet: localConfig.wallet,
      errorMsg: 'timestamp',
      result: false,
    },
    {
      testMsg: 'should faild when getting token failed with timestamp more then 1 hour after',
      timestamp: getTimestamp() + 3601,
      wallet: localConfig.wallet,
      errorMsg: 'timestamp',
      result: false,
    },
    {
      testMsg: 'should faild when getting token failed with address not in whitelist',
      timestamp: getTimestamp(),
      wallet: {
        address: '0xfb2a16a6c94268a0d5bccc89a78ab769896a84b2',
        privateKey: '1c8805ba17a35372391fd8f76f2a321dde0e63c4527f3da648c4febb9283dc99',
      },
      errorMsg: 'address',
      result: false,
    },
  ]
  testItems.forEach(item => {
    it(item.testMsg, async () => {
      if (item.result) {
        const token = await getToken(item.timestamp, item.wallet)
        expect(token).toBeTruthy()
      } else {
        let errorMsg = null
        try {
          await getToken(item.timestamp, item.wallet)
        } catch (e) {
          errorMsg = e.message
        }
        if (item.errorMsg) {
          expect(errorMsg).toMatch(item.errorMsg)
        } else {
          expect(errorMsg).toBeTruthy()
        }
      }
    })
  })
})

describe('test send JWT request', () => {
  const testItems = [
    {
      testMsg: 'send a JWT request with now timestamp',
      timestamp: getTimestamp(),
      wallet: localConfig.wallet,
      result: true,
    },
    {
      testMsg: 'send a request with a expired token',
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZGRyZXNzIjoiMHgxN2JmNTUyZGEwZWM0MGIxNjE0NjYwYTc3M2QzNzE5MDlkYmUzZWFhIiwiZXhwaXJlZEF0IjoiMTUyNTgzNDk5MCJ9.cOQz9gs1lH222EQKUppK49r-asd9ydBPWjn7S78mwZg',
      errorMsg: 'invalid',
      result: false,
    },
    {
      testMsg: 'send a request with a expired token',
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZGRyZXNzIjoiMHgxN2JmNTUyZGEwZWM0MGIxNjE0NjYwYTc3M2QzNzE5MDlkYmUzZWFhIiwiZXhwaXJlZEF0IjoiMTUyNTgzNTAyNCJ9.Qgg2yk0lz2DQ4ClTTmlI7jPgpKXKO_YEGVp0AbR_MfI',
      errorMsg: 'invalid',
      result: false,
    },
    {
      testMsg: 'send a request with a expired token',
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZGRyZXNzIjoiMHgxN2JmNTUyZGEwZWM0MGIxNjE0NjYwYTc3M2QzNzE5MDlkYmUzZWFhIiwiZXhwaXJlZEF0IjoiMTUyNTgzNTA0MyJ9.gGshnK7gqIHz2043-RfFNGunP0C1YwYI1STjUo_g4po',
      errorMsg: 'invalid',
      result: false,
    },
    {
      testMsg: 'send a request without access-token',
      result: false,
    },
  ]

  testItems.forEach((item) => {
    it(item.testMsg, async () => {
      let header = {}

      if (item.timestamp) {
        const token = await getToken(item.timestamp, item.wallet)
        header = { 'access-token': token }
      } else if (item.token) {
        header = { 'access-token': item.token }
      }

      if (item.result) {
        const pairs = await jsonrpc.get(localConfig.server.url, header, 'dex.getPairList', [{ market: 'Tokenlon' }])
        expect(pairs.length).toBeGreaterThan(0)
        expect(pairs.some(p => {
          return _.isEqual(p.base.contractAddress, sntWethPairData.base.contractAddress) &&
            _.isEqual(p.quote.contractAddress, sntWethPairData.quote.contractAddress)
        })).toBe(true)

      } else {
        let errorMsg = ''
        try {
          await jsonrpc.get(localConfig.server.url, header, 'dex.getPairList', [{ market: 'Tokenlon' }])
        } catch (e) {
          errorMsg = e.message
        }
        if (item.errorMsg) {
          expect(errorMsg).toMatch(item.errorMsg)
        } else {
          expect(errorMsg).toBeTruthy()
        }
      }
    })
  })
})