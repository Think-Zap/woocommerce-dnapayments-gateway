export function setPlaceOrderButtonDisabled(isDisabled) {
    const placeOrderButton = getPlaceOrderButton()

    if (!placeOrderButton) {
        return
    }

    if (isDisabled) {
        placeOrderButton.setAttribute('disabled', 'disabled')
    } else {
        placeOrderButton.removeAttribute('disabled')
    }
}

export function triggerPlaceOrderButtonClick() {
    const placeOrderButton = getPlaceOrderButton()

    if (placeOrderButton) {
        placeOrderButton.removeAttribute('disabled')
        placeOrderButton.click()
    }
}

export function getPlaceOrderButton() {
    return document.querySelector('button.wc-block-components-checkout-place-order-button')
}
