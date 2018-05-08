import { getTimestamp } from '../../src/utils/helper'
import { Side } from '../../src/types'
export const validSimpleOrder = [
  {
    side: 'BUY',
    price: 0.00002,
    amount: 0.01,
  },
  {
    side: 'SELL',
    price: 0.01,
    amount: 100,
    expirationUnixTimestampSec: getTimestamp() + 60 * 60,
  },
]

export const invalidSimpleOrder = [
  {
    side: 'BUY',
    price: '0.00002',
    amount: 0.01,
  },
  {
    side: 'sell',
    price: 0.01,
    amount: 100,
    expirationUnixTimestampSec: getTimestamp() + 60 * 60,
  },
  {
    side: 'SELL',
    price: '0.01',
    amount: 100,
    expirationUnixTimestampSec: getTimestamp() + 60 * 60,
  },
  {
    side: 'SELL',
    price: 0.01,
    amount: 100,
    expirationUnixTimestampSec: getTimestamp() - 10,
  },
]

export const simpleOrders = [
  {
    price: 0.00019999,
    amount: 20.27873423,
    side: 'BUY' as Side,
    expirationUnixTimestampSec: getTimestamp() + 10 * 60,
  },
  {
    price: 0.00020256,
    amount: 666.562562,
    side: 'BUY' as Side,
    expirationUnixTimestampSec: getTimestamp() + 10 * 60,
  },
  {
    price: 0.00020257,
    amount: 908.24535291,
    side: 'SELL' as Side,
    expirationUnixTimestampSec: getTimestamp() + 10 * 60,
  },
  {
    price: 0.00020257,
    amount: 562.56256256,
    side: 'SELL' as Side,
    expirationUnixTimestampSec: getTimestamp() + 10 * 60,
  },
  {
    price: 0.0003333,
    amount: 562.56256256,
    side: 'SELL' as Side,
    expirationUnixTimestampSec: getTimestamp() + 20 * 60,
  },
]