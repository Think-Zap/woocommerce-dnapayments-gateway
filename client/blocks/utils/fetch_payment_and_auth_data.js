import { getPaymentData } from './get_payment_data'

export async function fetchPaymentAndAuthData(props) {
    const paymentData = getPaymentData(props)

    const formData = new FormData()
    formData.append('order_id', paymentData.invoiceId)
    formData.append('total', paymentData.amount)

    const response = await fetch('/wp-admin/admin-ajax.php?action=get_payment_and_auth_data', {
        method: 'POST',
        body: formData,
    })

    const result = await response.json()

    return {
        auth: result.auth,
        paymentData: {
            ...result.paymentData,
            ...paymentData,
            invoiceId: result.paymentData.invoiceId,
            paymentSettings: result.paymentData.paymentSettings,
        },
    }
}
