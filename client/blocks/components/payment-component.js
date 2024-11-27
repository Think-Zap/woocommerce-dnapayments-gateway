import { useEffect, useRef, useState } from '@wordpress/element'
import { __ } from '@wordpress/i18n'

import { TEXT_DOMAIN } from '../constants'
import { ErrorMessage } from './error-message'
import { fetchPaymentAndAuthData } from '../utils/fetch_payment_and_auth_data'
import { logData, logError } from '../utils/log'
import { setPlaceOrderButtonDisabled, triggerPlaceOrderButtonClick } from '../utils/place-order-button'

export const PaymentComponent = ({ containerId, componentInstance, gatewayId, errorMessage, props }) => {
    const {
        components: { LoadingMask },
    } = props

    const [loadingState, setLoadingState] = useState('idle')
    const [messages, setMessages] = useState([])

    // pay button container
    const containerRef = useRef(null)
    // process payment result
    const paymentResultRef = useRef()

    const {
        emitResponse,
        eventRegistration: { onPaymentSetup },
    } = props

    useEffect(() => {
        const handler = async () => {
            if (paymentResultRef.current?.success) {
                return {
                    type: emitResponse.responseTypes.SUCCESS,
                    meta: {
                        paymentMethodData: {
                            [`wc-${gatewayId}-result`]: JSON.stringify(paymentResultRef.current),
                        },
                    },
                }
            }

            return {
                type: emitResponse.responseTypes.ERROR,
                message: __('Your payment proccess has been failed.', TEXT_DOMAIN),
                messageContext: emitResponse.noticeContexts.PAYMENTS,
            }
        }

        return onPaymentSetup(handler)
    }, [onPaymentSetup, emitResponse])

    useEffect(() => {
        const setupIntegration = async () => {
            setLoadingState('loading')
            const { paymentData, auth } = await fetchPaymentAndAuthData(props)

            paymentResultRef.current = null

            containerRef.current.innerHTML = ''

            componentInstance.create(
                containerRef.current,
                paymentData,
                {
                    onClick: () => {
                        setLoadingState('loading')
                    },
                    onPaymentSuccess: (result) => {
                        setLoadingState('done')
                        logData('onPaymentSuccess', result)
                        paymentResultRef.current = result
                        triggerPlaceOrderButtonClick()
                    },
                    onCancel: () => {
                        setLoadingState('done')
                    },
                    onError: (err) => {
                        logError('onError', err)

                        let message =
                            err.message ||
                            __(
                                'Your card has not been authorised, please check the details and retry or contact your bank.',
                                TEXT_DOMAIN,
                            )

                        if (
                            errorMessage &&
                            (err.code === 1002 || // Failed to initialize the Google / Apple Pay button
                                err.code === 1003) // Failed to validate the Google / Apple Pay button
                        ) {
                            message = errorMessage
                        }

                        setLoadingState('failed')
                        setMessages([message])
                    },
                    onLoad: () => {
                        setLoadingState('done')
                    },
                },
                auth.access_token,
            )
        }

        if (containerRef.current && componentInstance) {
            setupIntegration()
        }
    }, [componentInstance, containerRef, props.billing.cartTotal.value])

    // if payment gateway selected, disable place order button
    useEffect(() => {
        setPlaceOrderButtonDisabled(true)
        return () => setPlaceOrderButtonDisabled(false)
    }, [])

    return (
        <>
            <ErrorMessage messages={messages} />
            <LoadingMask isLoading={loadingState === 'loading'} showSpinner={true}>
                <div ref={containerRef} id={containerId}></div>
            </LoadingMask>
        </>
    )
}
