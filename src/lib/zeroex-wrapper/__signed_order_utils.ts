// TODO remove
// waiting 0x.js update to latest version

import { SignedOrder } from '0x.js'
import { BigNumber } from '@0xproject/utils'

export const signedOrderUtils = {
    createFill: (
        signedOrder: SignedOrder,
        shouldThrowOnInsufficientBalanceOrAllowance?: boolean,
        fillTakerTokenAmount?: BigNumber,
    ) => {
        const fill = {
            ...signedOrderUtils.getOrderAddressesAndValues(signedOrder),
            fillTakerTokenAmount: fillTakerTokenAmount || signedOrder.takerTokenAmount,
            shouldThrowOnInsufficientBalanceOrAllowance: !!shouldThrowOnInsufficientBalanceOrAllowance,
            ...signedOrder.ecSignature,
        }
        return fill
    },
    createCancel(signedOrder: SignedOrder, cancelTakerTokenAmount?: BigNumber) {
        const cancel = {
            ...signedOrderUtils.getOrderAddressesAndValues(signedOrder),
            cancelTakerTokenAmount: cancelTakerTokenAmount || signedOrder.takerTokenAmount,
        }
        return cancel
    },
    getOrderAddressesAndValues(signedOrder: SignedOrder) {
        return {
            orderAddresses: [
                signedOrder.maker,
                signedOrder.taker,
                signedOrder.makerTokenAddress,
                signedOrder.takerTokenAddress,
                signedOrder.feeRecipient,
            ],
            orderValues: [
                signedOrder.makerTokenAmount,
                signedOrder.takerTokenAmount,
                signedOrder.makerFee,
                signedOrder.takerFee,
                signedOrder.expirationUnixTimestampSec,
                signedOrder.salt,
            ],
        }
    },
}