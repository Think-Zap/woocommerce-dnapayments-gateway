import { getPaymentMethodData } from '@woocommerce/settings'

import { GATEWAY_ID } from '../constants'

export const getDnaPaymentsSettingsData = () => {
    const settings = getPaymentMethodData(GATEWAY_ID, {})
    return {
        isTestMode: settings.is_test_mode,
        integrationType: settings.integration_type,
        tempToken: settings.temp_token,
        terminalId: settings.terminal_id,
        allowSavingCards: settings.allow_saving_cards,
        sendCallbackEveryFailedAttempt: Number(settings.send_callback_every_failed_attempt),
        cards: settings.cards,
        cardSchemeIconPath: settings.card_scheme_icon_path
    }
}
