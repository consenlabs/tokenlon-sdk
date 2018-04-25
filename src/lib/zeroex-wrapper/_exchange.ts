import {
  SignedOrder,
  OrderFillRequest,
  OrderTransactionOpts,
  OrderCancellationRequest,
} from '0x.js'
import { BigNumber } from '@0xproject/utils'
import helper from './helper'
import * as _ from 'lodash'

import { signedOrderUtils } from './__signed_order_utils'
import { formatters } from './__formatters'

// using signedOrderUtils and formatters from
// https://github.com/0xProject/0x.js/blob/7aa070f9eaef734274df6e6eaa4590fe30d52899/packages/contracts/util/exchange_wrapper.ts
// to cover zeroEx.exchange's methods with transaction
const fillOrderAsync = (
  signedOrder: SignedOrder,
  fillTakerTokenAmount: BigNumber,
  shouldThrowOnInsufficientBalanceOrAllowance: boolean,
  _takerAddress: string,
  _orderTransactionOpts: OrderTransactionOpts,
) => {
  const params = signedOrderUtils.createFill(
    signedOrder,
    shouldThrowOnInsufficientBalanceOrAllowance,
    fillTakerTokenAmount,
  )
  return helper.exchangeSendTransaction('fillOrder', [
    params.orderAddresses,
    params.orderValues,
    params.fillTakerTokenAmount,
    params.shouldThrowOnInsufficientBalanceOrAllowance,
    params.v,
    params.r,
    params.s,
  ])
}

const cancelOrderAsync = (
  signedOrder: SignedOrder,
  cancelTakerTokenAmount: BigNumber,
  _orderTransactionOpts: OrderTransactionOpts,
) => {
  const params = signedOrderUtils.createCancel(signedOrder, cancelTakerTokenAmount)
  return helper.exchangeSendTransaction('cancelOrder', [
    params.orderAddresses,
    params.orderValues,
    params.cancelTakerTokenAmount,
  ])
}

const fillOrKillOrderAsync = (
  signedOrder: SignedOrder,
  fillTakerTokenAmount: BigNumber,
  _takerAddress: string,
  _orderTransactionOpts: OrderTransactionOpts,
) => {
  const shouldThrowOnInsufficientBalanceOrAllowance = true
  const params = signedOrderUtils.createFill(
    signedOrder,
    shouldThrowOnInsufficientBalanceOrAllowance,
    fillTakerTokenAmount,
  )
  return helper.exchangeSendTransaction('fillOrKillOrder', [
    params.orderAddresses,
    params.orderValues,
    params.fillTakerTokenAmount,
    params.v,
    params.r,
    params.s,
  ])
}

const batchFillOrdersAsync = (
  orderFillRequests: OrderFillRequest[],
  shouldThrowOnInsufficientBalanceOrAllowance: boolean,
  _takerAddress: string,
  _orderTransactionOpts: OrderTransactionOpts,
) => {
  const params = formatters.createBatchFill(
    orderFillRequests.map(r => r.signedOrder),
    shouldThrowOnInsufficientBalanceOrAllowance,
    orderFillRequests.map(r => r.takerTokenFillAmount),
  )
  return helper.exchangeSendTransaction('batchFillOrders', [
    params.orderAddresses,
    params.orderValues,
    params.fillTakerTokenAmounts,
    params.shouldThrowOnInsufficientBalanceOrAllowance,
    params.v,
    params.r,
    params.s,
  ])
}

const batchFillOrKillAsync = (
  orderFillRequests: OrderFillRequest[],
  _takerAddress: string,
  _orderTransactionOpts: OrderTransactionOpts = {},
) => {
  const params = formatters.createBatchFill(
    orderFillRequests.map(r => r.signedOrder),
    false,
    orderFillRequests.map(r => r.takerTokenFillAmount),
  )
  return helper.exchangeSendTransaction('batchFillOrKillOrders', [
    params.orderAddresses,
    params.orderValues,
    params.fillTakerTokenAmounts,
    params.v,
    params.r,
    params.s,
  ])
}

const fillOrdersUpToAsync = (
  signedOrders: SignedOrder[],
  fillTakerTokenAmount: BigNumber,
  shouldThrowOnInsufficientBalanceOrAllowance: boolean,
  _takerAddress: string,
  _orderTransactionOpts: OrderTransactionOpts,
) => {
  const params = formatters.createFillUpTo(
    signedOrders,
    shouldThrowOnInsufficientBalanceOrAllowance,
    fillTakerTokenAmount,
  )
  return helper.exchangeSendTransaction('fillOrdersUpTo', [
    params.orderAddresses,
    params.orderValues,
    params.fillTakerTokenAmount,
    params.shouldThrowOnInsufficientBalanceOrAllowance,
    params.v,
    params.r,
    params.s,
  ])
}

const batchCancelOrdersAsync = (
  orderCancellationRequests: OrderCancellationRequest[],
  _orderTransactionOpts: OrderTransactionOpts,
) => {
  const orders = orderCancellationRequests.map(r => r.order) as SignedOrder[]
  const cancelTakerTokenAmounts = orderCancellationRequests.map(r => r.takerTokenCancelAmount)
  const params = formatters.createBatchCancel(orders, cancelTakerTokenAmounts)
  return helper.exchangeSendTransaction('batchCancelOrders', [
    params.orderAddresses,
    params.orderValues,
    params.cancelTakerTokenAmounts,
  ])
}

export const coverageExchange = (exchange) => {
  // use _.extends to shallow extend
  return _.extend(exchange, {
    fillOrderAsync,
    cancelOrderAsync,
    fillOrKillOrderAsync,
    batchFillOrdersAsync,
    batchFillOrKillAsync,
    fillOrdersUpToAsync,
    batchCancelOrdersAsync,
  })
}