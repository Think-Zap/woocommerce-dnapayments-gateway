import { logError } from './log'

export async function createHostedFields({
    isTest,
    accessToken,
    threeDSModal,
    domElements: { number, name, expDate, cvv, cvvToken },
}) {
    const fields = {
        cardholderName: {
            container: name,
            placeholder: 'ABC',
        },
        cardNumber: {
            container: number,
            placeholder: '1234 1234 1234 1234',
        },
        expirationDate: {
            container: expDate,
            placeholder: 'MM / YY',
        },
        cvv: {
            container: cvv,
            placeholder: 'CVC',
        },
        tokenizedCardCvv: {
            container: cvvToken,
            placeholder: 'CVC',
        },
    }

    const options = {
        isTest,
        accessToken,
        styles: {
            input: {
                'font-size': '14px',
                'font-family': 'Open Sans',
            },
            '::placeholder': {
                opacity: '0',
            },
            'input:focus::placeholder': {
                opacity: '0.5',
            },
        },
        styleConfig: {
            containerClasses: {
                FOCUSED: 'focused',
                INVALID: 'has-error',
            },
        },
        fontNames: ['Open Sans'],
        threeDSecure: {
            container: threeDSModal.body,
        },
        fields,
    }

    try {
        const hostedFieldsInstance = await window.dnaPayments.hostedFields.create(options)

        hostedFieldsInstance.on('blur', function ({ fieldKey, fieldsState }) {
            const fieldContainer = fields[fieldKey]?.container
            const isEmpty = fieldsState[fieldKey]?.isEmpty

            if (fieldContainer) {
                fieldContainer.classList.toggle('empty', isEmpty)
            }
        })

        hostedFieldsInstance.on('dna-payments-three-d-secure-show', (data) => {
            if (threeDSModal) {
                threeDSModal.show()
            }
        })

        hostedFieldsInstance.on('dna-payments-three-d-secure-hide', () => {
            if (threeDSModal) {
                threeDSModal.hide()
            }
        })

        return hostedFieldsInstance
    } catch (err) {
        logError(err)
        throw new Error('Your card has not been authorised, please check the details and retry or contact your bank.')
    }
}
