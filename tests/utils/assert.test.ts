import { getTimestamp } from '../../src/utils/helper'
import { assert as assertUtils } from '0x.js/lib/src/utils/assert'
import { assert, rewriteAssertUtils } from '../../src/utils/assert'
import Web3 from 'web3'
import { Web3Wrapper } from '@0xproject/web3-wrapper'
import { SimpleOrder } from '../../src/types'
import { Server } from '../../src/lib/server'

import { validSimpleOrder, invalidSimpleOrder } from '../__mock__/simpleOrder'
import { wallet, localServerUrl, web3ProviderUrl, localConfig } from '../__mock__/config'

let pairs = []
const server = new Server(localServerUrl, wallet)
const web3 = new Web3Wrapper(new Web3.providers.HttpProvider(web3ProviderUrl))

jasmine.DEFAULT_TIMEOUT_INTERVAL = 120000

beforeAll(async () => {
  pairs = await server.getPairList()
  return pairs
})

describe('our assert utils', () => {
  describe('assert', () => {
    describe('assert.isValidSide', () => {
      ['BUY', 'SELL'].forEach(side => {
        it(`${side} is valid`, () => {
          expect(assert.isValidSide(side)).toBeUndefined()
        })
      });

      ['', 'buy', 'sell'].forEach(side => {
        it(`${side} is invalid`, () => {
          expect(() => {
            assert.isValidSide(side)
          }).toThrow()
        })
      })
    })

    describe('assert.isValidPrecision', () => {
      const arr = [0.001, 23123.2223]
      arr.forEach((amount) => {
        it(`amount ${amount} is valid`, () => {
          expect(assert.isValidPrecision('amount', amount, 4)).toBeUndefined()
        })
      })
      arr.forEach((amount) => {
        it(`amount ${amount} is invalid`, () => {
          expect(() => {
            assert.isValidPrecision('amount', amount, 2)
          }).toThrow()
        })
      })
    })

    describe('assert.isValidExpirationUnixTimestampSec', () => {
      const now = getTimestamp()
      it(`undefined is valid`, () => {
        expect(assert.isValidExpirationUnixTimestampSec()).toBeUndefined()
      })
      it(`now + 10s is valid`, () => {
        expect(assert.isValidExpirationUnixTimestampSec(now + 10)).toBeUndefined()
      })
      it(`now - 10s is invalid`, () => {
        expect(() => {
          assert.isValidExpirationUnixTimestampSec(now - 10)
        }).toThrow()
      })
    })

    describe('assert.isValidAmount', () => {
      const datas = [
        {
          params: [{
            price: 1,
            amount: 1,
          }, 1],
          result: true,
        },
        {
          params: [{
            price: 1,
            amount: 1,
          }, 0.2],
          result: true,
        },
        {
          params: [{
            price: 0.1,
            amount: 1,
          }, 0.2],
          result: false,
        },
      ]

      datas.forEach(data => {
        if (data.result) {
          it(`${JSON.stringify(data.params)}is valid`, () => {
            expect(assert.isValidAmount.apply(assert.isValidAmount, data.params)).toBeUndefined()
          })
        } else {
          it(`${JSON.stringify(data.params)}is invalid`, () => {
            expect(() => {
              assert.isValidAmount.apply(assert.isValidAmount, data.params)
            }).toThrow()
          })
        }
      })
    })

    describe('assert.isValidSimpleOrder', () => {
      it('these simple orders are valid', () => {
        validSimpleOrder.forEach(o => expect(assert.isValidSimpleOrder(o as SimpleOrder, 8)).toBeUndefined())
      })

      it('these simple orders are invalid', () => {
        invalidSimpleOrder.forEach(o => {
          expect(() => {
            assert.isValidSimpleOrder(o as SimpleOrder, 8)
          }).toThrow()
        })
      })
    })

    describe('assert.isValidrawOrder', () => {
      it('string {} is valid rawOrder', () => {
        expect(assert.isValidrawOrder('{}')).toBeUndefined()
      });

      ['', null, undefined, '[]'].forEach(item => {
        it(`${item} is invalid`, () => {
          expect(() => {
            assert.isValidrawOrder(item as string)
          }).toThrow()
        })
      })
    })

    describe('assert.isValidTokenNameString', () => {
      const arr = ['', 'SNT ', 'snt']
      arr
        .filter(item => item.trim())
        .map(item => item.trim().toUpperCase())
        .forEach(item => {
          it(`${item} is valid`, () => {
            expect(assert.isValidTokenNameString('token name', item)).toBeUndefined()
          })
        })

      arr.forEach(item => {
        it(`${item} is invalid`, () => {
          expect(() => {
            assert.isValidTokenNameString('token name', item)
          }).toThrow()
        })
      })
    })

    describe('assert.isValidWallet', () => {
      it('wallet is valid', () => {
        expect(assert.isValidWallet(wallet)).toBeUndefined()
      })

      it('wallet is invalid', () => {
        expect(() => {
          assert.isValidWallet({
            ...wallet,
            address: wallet.address.slice(1),
          })
        }).toThrow()
      })
    })

    describe('assert.isValidConfig', () => {
      it('config is valid', () => {
        expect(assert.isValidConfig(localConfig)).toBeUndefined()
      })

      it('config is invalid', () => {
        expect(() => {
          assert.isValidConfig({
            ...localConfig,
            web3: {
              providerUrl: '',
            },
          })
        }).toThrow()
      })

      it('config is invalid', () => {
        expect(() => {
          assert.isValidConfig({
            ...localConfig,
            server: {
              url: '',
            },
          })
        }).toThrow()
      })
    })

    describe('assert.isValidTokenName', () => {
      const arr = ['snt', 'weth']

      arr
        .map(t => t.trim().toUpperCase())
        .forEach(t => {
          it(`${t} is valid`, () => {
            expect(assert.isValidTokenName(t, pairs)).toBeUndefined()
          })
      })

      arr
        .concat('CREDO')
        .forEach(t => {
          it(`${t} is invalid`, () => {
            expect(() => {
              assert.isValidTokenName(t, pairs)
            }).toThrow()
          })
        })
    })

    describe('assert.isValidBaseQuote', () => {
      it(`SNT-WETH pair is valid`, () => {
        expect(assert.isValidBaseQuote({
          base: 'SNT',
          quote: 'WETH',
        }, pairs)).toBeUndefined()
      })

      it(`SNT-WETH pair is valid`, () => {
        expect(() => {
          assert.isValidBaseQuote({
            base: 'CREDO',
            quote: 'SNT',
          }, pairs)
        }).toThrow()
      })
    })
  })
})

describe('rewrite 0x.js AssertUtils', () => {
  it('original 0x.js asset utils isSenderAddressAsync should thorw error', async () => {
    try {
      await assertUtils.isSenderAddressAsync('address', wallet.address.toLowerCase(), web3)
    } catch (e) {
      expect(e.toString()).toMatch(/Error/)
    }
  })

  it('overwrited 0x.js asset utils isSenderAddressAsync should skip check sender address', async () => {
    rewriteAssertUtils(assertUtils)
    const res = await assertUtils.isSenderAddressAsync('address', wallet.address, web3)
    expect(res).toBeUndefined()
  })
})