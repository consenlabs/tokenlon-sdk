import * as _ from 'lodash'
import { toBN, toFixed } from './math'
import { BigNumber } from '@0xproject/utils'

const toLocaleStringSupportsLocales = () => {
  const num = 0

  try {
    num.toLocaleString('i')
  } catch (e) {
    return e.name === 'RangeError'
  }
  return false
}

export const thousandCommas = (num, min = 4, max = 8) => {
  if (min > max) {
    throw new Error('maximumFractionDigits value is out of range')
  }

  if (!toLocaleStringSupportsLocales()) {
    const n = Number(num).toFixed(max) // 限制小数位长度 3.14159000265359 => 3.14159000
    const parts = Number(n).toString().split('.') // 小数位去零 3.14159000 => ["3", "14159"]
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    return parts.join('.')
  }
  return Number(num).toLocaleString('en-US', { minimumFractionDigits: min, maximumFractionDigits: max })
}

export const decimal = (num, place = 4) => {
  if (!num || Number(num) === 0) return '0'
  return toFixed(num, place)
}

export const formatMoney = (value, place = 4) => {
  return +value > 0.0001 ? decimal(value, place) : thousandCommas(value, +place, 8)
}

const fillHelper = (v, fill) => {
  if (_.isUndefined(fill) || fill) {
    return v
  }
  const result = toBN(v).toString()
  if (result.indexOf('.') !== -1) {
    return result
  }
  return toBN(v).toFixed(2)
}

// 统一小数点后位数量 fill 传递 false 表示如果后面都是 0，会移除
export const formatNumHelper = (place) => {
  return (value, fill) => fillHelper(formatMoney(value, place), fill)
}

export const fromUnitToDecimalBN = (balance, decimal): BigNumber => {
  const amountBN = toBN(balance || 0)
  const decimalBN = toBN(10).toPower(decimal)
  return amountBN.times(decimalBN)
}

export const fromDecimalToUnit = (balance, decimal) => {
  return toBN(balance).dividedBy(Math.pow(10, decimal))
}

export const fromUnitToDecimal = (balance, decimal, base) => {
  return fromUnitToDecimalBN(balance, decimal).toString(base)
}