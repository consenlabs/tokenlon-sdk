import { isBigNumber, isNumberLike, toBN, toFixed } from '../../src/utils/math'
import { BigNumber } from '@0xproject/utils'
import * as _ from 'lodash'

describe('test isNumberLike', () => {
  const testData = [{
    value: 1,
    result: true,
  }, {
    value: Infinity,
    result: false,
  }, {
    value: {},
    result: false,
  }, {
    value: ' ',
    result: false,
  }, {
    value: undefined,
    result: false,
  }, {
    value: null,
    result: false,
  }, {
    value: NaN,
    result: false,
  }, {
    value: 'a',
    result: false,
  }]

  testData.forEach(data => {
    it(`isNumberLike(${data.value}) => ${data.result}`, () => {
      expect(isNumberLike(data.value)).toEqual(data.result)
    })
  })
})

describe('test isBigNumber', () => {
  const testData = [{
    value: 1,
    result: false,
  }, {
    value: Infinity,
    result: false,
  }, {
    value: {},
    result: false,
  }, {
    value: ' ',
    result: false,
  }, {
    value: undefined,
    result: false,
  }, {
    value: null,
    result: false,
  }, {
    value: NaN,
    result: false,
  }, {
    value: 'a',
    result: false,
  }]

  testData.forEach(data => {
    it(`isBigNumber(${data.value}) => ${data.result}`, () => {
      expect(isBigNumber(data.value)).toEqual(data.result)
    })
  })

  testData.filter(item => (_.isString(item.value) && +item.value) || _.isNumber(item.value)).forEach(data => {
    const v = new BigNumber(data.value as string | number)
    const r = !data.result
    it(`isBigNumber(${v}) => ${r}`, () => {
      expect(isBigNumber(v)).toEqual(r)
    })
  })
})

describe('test toBN', () => {
  const testData = [{
    value: 10.012312313,
    result: '10.012312313',
  }, {
    value: Infinity,
    result: '0',
  }, {
    value: '-10.012312313',
    result: '-10.012312313',
  }, {
    value: '0xaa',
    result: '170',
  }, {
    value: '-0xaa',
    result: '-170',
  }]

  testData.forEach(data => {
    it(`toBN(${data.value}).toString() => ${data.result}`, () => {
      expect(toBN(data.value).toString()).toEqual(data.result)
    })
  })
})

// TODO more test case for toFixed rm params
describe('test toFixed', () => {
  const testData = [{
    value: 10.012312313,
    dp: 4,
    rm: 4,
    result: '10.0123',
  }, {
    value: Infinity,
    dp: 4,
    result: '0.0000',
  }, {
    value: 10.012312313,
    dp: 4,
    result: '10.0123',
  }, {
    value: '-0xaa',
    dp: 8,
    result: '-170.00000000',
  }]

  testData.forEach(data => {
    it(`toFixed(${data.value}) => ${data.result}`, () => {
      expect(toFixed(data.value, data.dp, data.rm)).toEqual(data.result)
    })
  })
})