import { BigNumber as BN } from '@0xproject/utils'
import * as _ from 'lodash'

export const isBigNumber = (v: any) => {
  return v instanceof BN ||
  (v && v.isBigNumber === true) ||
  (v && v._isBigNumber === true) ||
  false
}

export const isNumberLike = (n) => {
  // if use Number(n), 'toBN(-0xaa) will not pass this condition, will received only 0'
  // if you set params with empty string like ' ', it will return false, just like new BigNumber(' ') will throw error
  const num = parseFloat(n)
  return _.isNumber(num) && _.isFinite(num) && !_.isNaN(num)
}

export const toBN = (value): BN => {
  value = value || 0
  if (isBigNumber(value)) {
    return value
  }
  if (!isNumberLike(value)) {
    return new BN(0)
  }
  if (_.isString(value) && ((value).indexOf('0x') === 0 || (value).indexOf('-0x') === 0)) {
    return new BN((value).replace('0x', ''), 16)
  }

  return new BN((value).toString(10), 10)
}

/**
 * Returns a string representing the value of this BigNumber in normal (fixed-point) notation rounded to dp decimal places using rounding mode rm.
 * @param  {Number} n
 * @param  {Number} dp [decimal places, 0 to 1e+9]
 * @param  {Number} rm [rounding modes 0 to 6, Default value: 1 ROUND_DOWN ] http://mikemcl.github.io/bignumber.js/#round
 * @return {String}
 */
export const toFixed = (n, dp = 4, rm = 1): string => {
  return toBN(n).toFixed(dp, rm)
}