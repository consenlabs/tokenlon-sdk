import { thousandCommas, decimal, formatMoney, formatNumHelper, fromUnitToDecimalBN, fromDecimalToUnit, fromUnitToDecimal } from '../../src/utils/format'
import { BigNumber } from '@0xproject/utils'

describe('test thousandCommas', () => {
  const testData = [{
    num: 1,
    min: undefined,
    max: undefined,
    result: '1.0000',
  }, {
    num: 1,
    min: undefined,
    max: 4,
    result: '1.0000',
  }, {
    num: 1,
    min: 4,
    max: undefined,
    result: '1.0000',
  }, {
    num: '123456789',
    min: 4,
    max: 8,
    result: '123,456,789.0000',
  }]

  const testInvalidData = [{
    num: 1,
    min: 2,
    max: 1,
    result: 'maximumFractionDigits value is out of range',
  }, {
    num: 1,
    min: undefined,
    max: 1,
    result: 'maximumFractionDigits value is out of range',
  }, {
    num: 1,
    min: 9,
    max: undefined,
    result: 'maximumFractionDigits value is out of range',
  }]

  testData.forEach(data => {
    it(`thousandCommas(${data.num}, ${data.min}, ${data.max}) => ${data.result}`, () => {
      expect(thousandCommas(data.num, data.min, data.max)).toBe(data.result)
    })
  })

  testInvalidData.forEach(data => {
    it(`thousandCommas(${data.num}, ${data.min}, ${data.max}) => ${data.result}`, () => {
      expect(() => thousandCommas(data.num, data.min, data.max)).toThrow(data.result)
    })
  })
})

describe('test decimal', () => {
  const testData = [{
    num: '',
    place: undefined,
    result: '0',
  }, {
    num: 0,
    place: undefined,
    result: '0',
  }, {
    num: 0,
    place: 4,
    result: '0',
  }, {
    num: '1',
    place: 4,
    result: '1.0000',
  }]

  testData.forEach(data => {
    it(`decimal(${data.num}, ${data.place}) => ${data.result}`, () => {
      expect(decimal(data.num, data.place)).toBe(data.result)
    })
  })
})

describe('test formatMoney', () => {
  const testData = [{
    num: '1',
    place: undefined,
    result: '1.0000',
  }, {
    num: 1,
    place: undefined,
    result: '1.0000',
  }, {
    num: 1,
    place: 4,
    result: '1.0000',
  }, {
    num: '0',
    place: 4,
    result: '0.0000',
  }, {
    num: 0,
    place: 4,
    result: '0.0000',
  }, {
    num: '-1',
    place: 4,
    result: '-1.0000',
  }]

  testData.forEach(data => {
    it(`formatMoney(${data.num}, ${data.place}) => ${data.result}`, () => {
      expect(formatMoney(data.num, data.place)).toBe(data.result)
    })
  })
})

describe('test formatNumHelper', () => {
  const testData = [{
    num: '1',
    place: undefined,
    fill: undefined,
    result: '1.00000000',
  }, {
    num: 1,
    place: undefined,
    fill: undefined,
    result: '1.00000000',
  }, {
    num: 1,
    place: 4,
    fill: false,
    result: '1.00',
  }, {
    num: '0',
    place: 4,
    fill: false,
    result: '0.00',
  }, {
    num: 0,
    place: 4,
    fill: true,
    result: '0.0000',
  }, {
    num: '-1',
    place: 4,
    fill: true,
    result: '-1.0000',
  }]

  testData.forEach(data => {
    it(`formatNumHelper(${data.place})(${data.num}, ${data.fill}) => ${data.result}`, () => {
      expect(formatNumHelper(data.place)(data.num, data.fill)).toBe(data.result)
    })
  })
})

describe('decimal unit test', () => {
  const testData = [{
    balance: '259806613708406784',
    decimal: 18,
    unit: '0.259806613708406784',
  }, {
    balance: '1000000000000000000000000000',
    decimal: 18,
    unit: '1000000000',
  }]

  // fromDecimalToUnit
  testData.forEach(asset => {
    it(`${asset.balance} from decimal ${asset.decimal} to unit is ${asset.unit}`, () => {
      expect(fromDecimalToUnit(asset.balance, asset.decimal).toString()).toBe(asset.unit)
    })
  })

  // fromUnitToDecimal
  testData.forEach(asset => {
    it(`${asset.unit} from decimal ${asset.decimal} to unit is ${asset.balance}`, () => {
      const decimalBN = fromUnitToDecimalBN(asset.balance, asset.decimal)
      expect(decimalBN instanceof BigNumber).toBe(true)
      // fromUnitToDecimalBN
      expect(fromUnitToDecimalBN(asset.unit, asset.decimal).toString()).toBe(asset.balance)
      // fromUnitToDecimal
      expect(fromUnitToDecimal(asset.unit, asset.decimal, 10)).toBe(asset.balance)
    })
  })
})