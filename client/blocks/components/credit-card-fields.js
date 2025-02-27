/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n'
import { useState, useEffect, useRef } from '@wordpress/element'
import { ValidationInputError } from '@woocommerce/blocks-checkout'

/**
 * Internal dependencies
 */
import { HOSTED_FIELD_IDS, TEXT_DOMAIN } from '../constants'
import { getDnaPaymentsSettingsData } from '../utils/get_settings'
import { createHostedFields } from '../utils/create-hosted-fields'
import { createModal } from '../utils/create-modal'
import { setPlaceOrderButtonDisabled } from '../utils/place-order-button'
import { logData } from '../utils/log'

/**
 * Render the credit card fields.
 *
 * @param {Object} props Incoming props
 */
export const DnapaymentsCreditCardFields = ({
    props,
    isLoaded = false,
    hostedFieldsInstance = null,
    onLoad = () => {},
}) => {
    const {
        components: { LoadingMask },
        token = null,
    } = props

    const { cardSchemeIconPath } = getDnaPaymentsSettingsData()

    const mounted = useRef(false)
    const threeDSRef = useRef()
    const [isCvvTokenVisible, setIsCvvTokenVisible] = useState(false)
    const [cardScheme, setCardScheme] = useState('')

    const [error, setError] = useState({
        name: '',
        number: '',
        expirationDate: '',
        cvv: '',
    })

    const setupIntegration = async () => {
        const { isTestMode, tempToken, cards, sendCallbackEveryFailedAttempt } = getDnaPaymentsSettingsData()
        const selectedCard = cards.find((c) => String(c.id) === String(token))

        setPlaceOrderButtonDisabled(true)

        threeDSRef.current = createModal(HOSTED_FIELD_IDS.threeDS)
        hostedFieldsInstance = await createHostedFields({
            isTest: isTestMode,
            accessToken: tempToken,
            threeDSModal: threeDSRef.current,
            domElements: {
                number: document.getElementById(HOSTED_FIELD_IDS.number),
                name: document.getElementById(HOSTED_FIELD_IDS.name),
                expDate: document.getElementById(HOSTED_FIELD_IDS.expDate),
                cvv: document.getElementById(HOSTED_FIELD_IDS.cvv),
                cvvToken: document.getElementById(HOSTED_FIELD_IDS.cvvToken),
            },
            sendCallbackEveryFailedAttempt
        })

        hostedFieldsInstance.on('change', () => {
            const state = hostedFieldsInstance.getState()
            setCardScheme(state.cardInfo?.type || '')
            logData('card scheme:', state.cardInfo?.type)
        })

        if (selectedCard) {
            const cvvState = hostedFieldsInstance.getTokenizedCardCvvState(selectedCard)
            setIsCvvTokenVisible(cvvState === 'required')
            hostedFieldsInstance.selectCard(selectedCard)
        }

        setPlaceOrderButtonDisabled(false)

        onLoad(hostedFieldsInstance)
    }

    useEffect(() => {
        const { cards } = getDnaPaymentsSettingsData()
        if (token && hostedFieldsInstance) {
            const selectedCard = cards.find((c) => String(c.id) === String(token))
            if (selectedCard) {
                const cvvState = hostedFieldsInstance.getTokenizedCardCvvState(selectedCard)
                setIsCvvTokenVisible(cvvState === 'required')
                hostedFieldsInstance.selectCard(selectedCard)
            }
        }
    }, [token])

    useEffect(() => {
        mounted.current = true

        setTimeout(() => {
            if (mounted.current) {
                setupIntegration()
            }
        }, 100)

        return () => {
            mounted.current = false
            if (hostedFieldsInstance) {
                hostedFieldsInstance.destroy()
            }
            if (threeDSRef.current) {
                threeDSRef.current.remove()
                threeDSRef.current = null
            }
            onLoad(null)
        }
    }, [])

    return (
        <LoadingMask isLoading={!isLoaded} showSpinner={true}>
            <div className='wc-block-dnapayments-card-elements' style={{ display: !token ? 'flex' : 'none' }}>
                <div className='wc-block-gateway-container'>
                    <div id={HOSTED_FIELD_IDS.number} className={`wc-block-gateway-input empty`} />
                    <label htmlFor={HOSTED_FIELD_IDS.number}>{__('Card number', TEXT_DOMAIN)}</label>
                    <img className='wc-dnapayments-card-selected' src={`${cardSchemeIconPath}/${cardScheme || 'none'}.png`} />            
                    <ValidationInputError errorMessage={error.number} />
                </div>

                <div className='wc-block-gateway-container'>
                    <div id={HOSTED_FIELD_IDS.name} className={`wc-block-gateway-input empty`} />
                    <label htmlFor={HOSTED_FIELD_IDS.name}>{__('Cardholder name', TEXT_DOMAIN)}</label>
                    <ValidationInputError errorMessage={error.name} />
                </div>

                <div className='wc-block-gateway-container wc-block-dnapayments-card-element-small'>
                    <div id={HOSTED_FIELD_IDS.expDate} className='wc-block-gateway-input empty' />
                    <label htmlFor={HOSTED_FIELD_IDS.expDate}>{__('Expiry date (MMYY)', TEXT_DOMAIN)}</label>
                    <ValidationInputError errorMessage={error.expirationDate} />
                </div>

                <div className='wc-block-gateway-container wc-block-dnapayments-card-element-small'>
                    <div id={HOSTED_FIELD_IDS.cvv} className='wc-block-gateway-input empty' />
                    <label htmlFor={HOSTED_FIELD_IDS.cvv}>{__('Card code (CVC)', TEXT_DOMAIN)}</label>
                    <ValidationInputError errorMessage={error.cvv} />
                </div>
            </div>

            <div
                className='wc-block-dnapayments-card-elements'
                style={{ display: isCvvTokenVisible ? 'flex' : 'none' }}
            >
                <div className='wc-block-gateway-container wc-block-dnapayments-card-element-small'>
                    <div id={HOSTED_FIELD_IDS.cvvToken} className='wc-block-gateway-input empty' />
                    <label htmlFor={HOSTED_FIELD_IDS.cvvToken}>{__('Card code (CVC)', TEXT_DOMAIN)}</label>
                    <ValidationInputError errorMessage={error.cvv} />
                </div>
            </div>
        </LoadingMask>
    )
}
