/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n'
import { useEffect } from '@wordpress/element'

/**
 * Internal dependencies
 */
import { TEXT_DOMAIN } from '../constants'
import { getDnaPaymentsSettingsData } from '../utils/get_settings'
import { logError } from '../utils/log'
import { tryParse } from '../utils/try-parse'

export const usePaymentForm = ({ props, hostedFieldsInstance }) => {
    const {
        emitResponse,
        eventRegistration: { onCheckoutSuccess },
        shouldSavePayment,
    } = props
    const { isTestMode, integrationType, allowSavingCards, cards: _cards } = getDnaPaymentsSettingsData()
    const cards = allowSavingCards ? _cards : []

    useEffect(() => {
        const handler = ({ processingResponse: { paymentDetails } }) =>
            new Promise((resolve) => {
                const paymentData = tryParse(paymentDetails.paymentData)
                const auth = tryParse(paymentDetails.auth)
                const merchantCustomData = tryParse(paymentData.merchantCustomData) || {}
                const { returnUrl, failureReturnUrl } = paymentData.paymentSettings

                switch (integrationType) {
                    case 'hosted-fields': {
                        window.DNAPayments.configure({ isTestMode, cards, allowSavingCards })

                        hostedFieldsInstance
                            .submit({
                                paymentData: {
                                    ...paymentData,
                                    merchantCustomData: JSON.stringify({
                                        ...merchantCustomData,
                                        storeCardOnFile: shouldSavePayment,
                                    }),
                                },
                                token: auth.access_token,
                            })
                            .then(() => {
                                resolve({
                                    type: emitResponse.responseTypes.SUCCESS,
                                    messageContext: emitResponse.noticeContexts.PAYMENTS,
                                })

                                window.location.href = returnUrl
                            })
                            .catch((err) => {
                                logError(err)
                                let message = err.message

                                if (err.code !== 'INVALID_CARD_DATA') {
                                    hostedFieldsInstance.clear()
                                    message = __(
                                        'Your card has not been authorised, please check the details and retry or contact your bank.',
                                        TEXT_DOMAIN,
                                    )
                                }

                                resolve({
                                    type: emitResponse.responseTypes.ERROR,
                                    message,
                                    messageContext: emitResponse.noticeContexts.PAYMENTS,
                                })

                                if (String(err.code).includes('CLOSE_TRANSACTION')) {
                                    window.location.href = failureReturnUrl
                                }
                            })
                        break
                    }
                    case 'embedded': {
                        window.DNAPayments.configure({
                            isTestMode,
                            cards,
                            allowSavingCards,
                            events: {
                                cancelled: () =>
                                    resolve({
                                        type: emitResponse.responseTypes.ERROR,
                                        message: __(
                                            'You have cancelled the payment process. Please try again if you wish to complete the order.',
                                            TEXT_DOMAIN,
                                        ),
                                        messageContext: emitResponse.noticeContexts.PAYMENTS,
                                    }),
                                paid: () =>
                                    resolve({
                                        type: emitResponse.responseTypes.SUCCESS,
                                        messageContext: emitResponse.noticeContexts.PAYMENTS,
                                    }),
                                declined: () =>
                                    resolve({
                                        type: emitResponse.responseTypes.ERROR,
                                        message: __('Your payment proccess has been failed.', TEXT_DOMAIN),
                                        messageContext: emitResponse.noticeContexts.PAYMENTS,
                                    }),
                            },
                        })

                        window.DNAPayments.openPaymentIframeWidget({ ...paymentData, auth })
                        break
                    }
                    default: {
                        window.DNAPayments.configure({ isTestMode, cards, allowSavingCards })
                        window.DNAPayments.openPaymentPage({ ...paymentData, auth })
                    }
                }
            })

        return onCheckoutSuccess(handler)
    }, [onCheckoutSuccess, hostedFieldsInstance])
}
