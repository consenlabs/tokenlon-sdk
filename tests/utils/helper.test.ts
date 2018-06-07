import * as _ from 'lodash'
import { newError, lowerCase, getTimestamp, helpCompareStr, lowerCaseObj0xValue, leftPadWith0 } from '../../src/utils/helper'

describe('newError', () => {
  const msg = 'foo'
  it(`Should get an error with a message ${msg}`, () => {
    const err = newError(msg)
    expect(err instanceof Error).toBe(true)
    expect(err.toString()).toBe(`Error: ${msg}`)
  })
})

describe('lowerCase', () => {
  it('lowerCase', () => {
    const x = 'xxXX'
    expect(lowerCase(x)).toBe(x.toLowerCase())
  })
})

describe('getTimestamp', () => {
  it('getTimestamp', () => {
    const nowWithDecimalPoint = Date.now() / 1000
    const nowTimestamp = getTimestamp()
    expect(nowTimestamp).toBeLessThanOrEqual(Math.ceil(nowWithDecimalPoint))
    expect(nowTimestamp).toBeGreaterThanOrEqual(Math.floor(nowWithDecimalPoint))
  })
})

describe('helpCompareStr', () => {
  it('helpCompareStr', () => {
    const x = 'xxXX'
    expect(helpCompareStr(x, x.toUpperCase())).toBe(true)
    expect(helpCompareStr(x, x.toLowerCase())).toBe(true)
  })
})

describe('lowerCaseObj0xValue - 0x string', () => {
  const x = {
    a: {
      b: {
        c: {
          d: '0X',
        },
      },
    },
  }
  const xTobeLowerCase = lowerCaseObj0xValue(x)
  it('lowerCaseObj0xValue', () => {
    expect(x.a.b.c.d.toLowerCase()).toBe(xTobeLowerCase.a.b.c.d)
  })
})

describe('lowerCaseObj0xValue - not 0x string', () => {
  const x = {
    a: {
      b: {
        c: {
          d: 'X',
        },
      },
    },
  }
  const converted = lowerCaseObj0xValue(x)
  it('lowerCaseObj0xValue', () => {
    expect(x.a.b.c.d).toBe(converted.a.b.c.d)
    expect(x.a.b.c.d.toLowerCase()).toBe(converted.a.b.c.d.toLowerCase())
  })
})

describe('leftPadWith0', () => {
  [
    {
      str: '1',
      len: 54,
      result: '0'.repeat(53) + '1',
    },
    {
      str: 'aa',
      len: 54,
      result: '0'.repeat(52) + 'aa',
    },
    {
      str: '1',
      len: -1,
      result: '1',
    },
    {
      str: '1',
      len: 1,
      result: '1',
    },
    {
      str: '1',
      len: 3,
      result: '001',
    },
  ].forEach(item => {
    it(`leftPadWith0(${item.str}, ${item.len}) should be ${item.result}`, () => {
      expect(leftPadWith0(item.str, item.len)).toBe(item.result)
    })
  })
})