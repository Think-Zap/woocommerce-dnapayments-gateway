import { select } from '@wordpress/data'

import { getDnaPaymentsSettingsData } from './get_settings'

export function getPaymentData(props) {
    const { billing, shippingData } = props
    const { terminalId } = getDnaPaymentsSettingsData()

    return {
        invoiceId: getOrderId(),
        amount: getAmount(billing.cartTotal.value, props),
        customerDetails: {
            email: billing.billingAddress.email,
            accountDetails: {
                accountId: billing.customerId ? String(billing.customerId) : undefined,
            },
            billingAddress: getAddress(billing.billingAddress),
            deliveryDetails: {
                deliveryAddress: getAddress(shippingData.shippingAddress),
            },
        },
        paymentSettings: {
            terminalId,
        },
    }
}

export function getAmount(amount, { billing }) {
    return amount / 10 ** billing.currency.minorUnit
}

export function getAddress(address) {
    return {
        firstName: address.first_name,
        lastName: address.last_name,
        addressLine1: address.address_1,
        addressLine2: address.address_2,
        city: address.city,
        postalCode: address.postcode,
        phone: address.phone,
        country: address.country,
    }
}

export function getOrderId() {
    const { CHECKOUT_STORE_KEY } = window.wc.wcBlocksData
    const store = select(CHECKOUT_STORE_KEY)

    return store.getOrderId()
}
