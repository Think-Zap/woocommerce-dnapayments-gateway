/* global wc_checkout_params */
/* global wc_dna_params */

const gateway_id = 'dnapayments'

jQuery( function( $ ) {
	'use strict';

    let orderId = Number(wc_dna_params.order_id) || 0;
    let sessionOrderId = Number(wc_dna_params.session_order_id) || 0;

    const isPayForOrderPage = Boolean(orderId);
    const $checkout_form = isPayForOrderPage ?  $( 'form#order_review' ) : $( 'form.woocommerce-checkout' );

    const isTestMode = wc_dna_params.is_test_mode === '1';
    const allowSavingCards = wc_dna_params.allowSavingCards === '1';
    const isHostedFields = wc_dna_params.integration_type === 'hosted-fields';
    const availableGateways = wc_dna_params.available_gateways || [];
    const cards = Object.values(wc_dna_params.cards || {});

    let hostedFieldsInstance, hostedFieldsInstanceId;

    const threeDSecureModal = createModal('three-d-secure');
    const formLoader = createFormLoader();
    const cardError = createCardError();
    const googlePay = createPaymentComponent({
        paymentMethodId: 'dnapayments_google_pay',
        paymentMethodObject: window.DNAPayments.GooglePayComponent,
        errorMessage: 'Google Pay payments are not supported in your current browser.'
    });
    const applePay = createPaymentComponent({
        paymentMethodId: 'dnapayments_apple_pay',
        paymentMethodObject: window.DNAPayments.ApplePayComponent,
        errorMessage: 'Apple Pay payments are not supported in your current browser. Please use Safari on a compatible Apple device to complete your transaction.'
    });

    $checkout_form.on('change', 'input[name="payment_method"]', function() {
        selectGateway($(this).val());
    });

    $checkout_form.on(isPayForOrderPage ? 'submit' : 'checkout_place_order_dnapayments', onSubmit);

    function selectGateway(selectedGateway) {
        const placeOrderBtn = document.getElementById('place_order');

        googlePay && debounce(googlePay.renderButton.bind(googlePay), 200)();
        applePay && debounce(applePay.renderButton.bind(applePay), 200)();

        if (['dnapayments', 'dnapayments_google_pay', 'dnapayments_apple_pay'].includes(selectedGateway)) {
            $checkout_form.find('.dnapayments-footer').show();
        } else {
            $checkout_form.find('.dnapayments-footer').hide();
        }

        switch (selectedGateway) {
            case 'dnapayments_google_pay':
            case 'dnapayments_apple_pay':
                placeOrderBtn.setAttribute('disabled', 'disabled');
                break;
            default:
                placeOrderBtn.removeAttribute('disabled');
        }
    }    

    $( document.body ).on( 'updated_checkout', init);

    // On the Pay for Order page, ensure initialization
    if ($('body').hasClass('woocommerce-order-pay')) {
        init();
    }

    function init() {
        selectGateway($('input[name="payment_method"]:checked').val());

        if (isHostedFields) {
            debounce(createHostedFields, 200)();
        }
    }

    function onSubmit(e) {
        // wc_checkout_params is required to continue, ensure the object exists
        if ( typeof wc_checkout_params === 'undefined' || getSelectedGateway() !== gateway_id ) {
            return false;
        }

        debounce(handlePlaceOrder, 200)();

        return false;
    }

    async function handlePlaceOrder() {
        if ( isHostedFields ) {
            const { isValid } = await hostedFieldsInstance.validate();
            if ( ! isValid ) {
                cardError.show('Invalid card data.');
                return;
            }
        }

        const result = await processPayment();
        pay(result);
    }

    function processPayment() {
        return new Promise(function (resolve, reject) {
            try {
                formLoader.show();
                const url = isPayForOrderPage ? '/wp-admin/admin-ajax.php?action=get_payment_and_auth_data' : wc_checkout_params.checkout_url;
                const data = isPayForOrderPage ? 'order_id=' + orderId : $( 'form.checkout' ).serialize() + '&' + serializeObject({ [gateway_id + '_session_order_id']: sessionOrderId });

                $.ajax({
                    type: 'POST',
                    url: url,
                    data: data,
                    dataType: 'json',
                    success: function(result) {
                        if(result.result == 'success') {
                            try {
                                if (typeof result.paymentData === 'string') {
                                    result.paymentData = JSON.parse(result.paymentData);
                                }
                                if (typeof result.auth === 'string') {
                                    result.auth = JSON.parse(result.auth);
                                }
                            } catch ( err) {
                                console.error(err);
                            }
                            
                            if (result.paymentData.invoiceId) {
                                sessionOrderId = result.paymentData.invoiceId;
                            }
                            resolve(result);
                            return;
                        } else {
                            reject()
                        }
    
                        if ( true === result.reload ) {
                            window.location.reload();
                            return;
                        }
    
                        if ( true === result.refresh ) {
                            $(document.body).trigger( 'update_checkout' );
                        }
    
                        if ( result.messages ) {
                            showError( result.messages );
                        } else {
                            showError( '<div class="woocommerce-error">' + wc_checkout_params.i18n_checkout_error + '</div>' );
                        }
                    },
                    error:	function( jqXHR, textStatus, errorThrown ) {
                        showError( '<div class="woocommerce-error">' + errorThrown + '</div>' );
                        reject()
                    }
                });
            } catch (e) {
                reject()
                console.error(e)
            }
        })
    }

    function pay({ paymentData, auth }) {
        window.DNAPayments.configure({ isTestMode, cards, allowSavingCards });

        switch (wc_dna_params.integration_type) {
            case 'hosted-fields':
                const { returnUrl, failureReturnUrl } = paymentData.paymentSettings
                hostedFieldsInstance.submit({
                    paymentData,
                    token: auth.access_token
                }).then(() => {
                    window.location.href = returnUrl;
                }).catch((err) => {
                    if (err.code !== 'NOT_VALID_CARD_DATA') {
                        hostedFieldsInstance.clear()
                        cardError.show('Your card has not been authorised, please check the details and retry or contact your bank.');
                    } else {
                        cardError.show(err.message)
                    }
                    
                    if (String(err.code).includes('CLOSE_TRANSACTION')) {
                        window.location.href = failureReturnUrl
                    }
                }).finally(() => {
                    formLoader.hide();
                });
                break;
            case 'embedded':
                formLoader.hide();
                window.DNAPayments.openPaymentIframeWidget({ ...paymentData, auth });
                break;
            default:
                formLoader.hide();
                window.DNAPayments.openPaymentPage({ ...paymentData, auth });
        }
    }

    function createPaymentComponent({
        paymentMethodId,
        paymentMethodObject,
        errorMessage
    }) {

        if ( ! availableGateways?.includes(paymentMethodId)) {
            return null
        }

        return {
            paymentData: null,
            token: null,
            renderButton: async function() {
                const $container = $checkout_form.find('#' + paymentMethodId + '_container');

                // clear container HTML element
                $container.css('height', '0px').html('');

                if (paymentMethodId !== getSelectedGateway()) {
                    return;
                }

                $container.css('height', '46px');
                setLoading($container, true);

                const totalAmount = getTotalAmount();

                if (!this.paymentData || this.paymentData.amount !== totalAmount) {
                    try {
                        const response = await processPayment();
                        this.paymentData = response.paymentData;
                        this.token = response.auth.access_token;
                        formLoader.hide();
                    } catch (err) {
                        console.error(err);
                        setLoading($container, false);
                        formLoader.hide();
                        return;
                    }
                }

                const events = {
                    onClick: () => {
                        formLoader.show();
                    },
                    onPaymentSuccess: (result) => {
                        formLoader.hide();
                        const returnUrl = this.paymentData?.paymentSettings?.returnUrl;
                        if (returnUrl) {
                            window.location.href = returnUrl;
                        }
                    },
                    onCancel: (err) => {
                        formLoader.hide();
                    },
                    onError: (err) => {
                        console.error(err)
                        formLoader.hide();

                        if ([
                            1002, // Failed to initialize the Google / Apple Pay button
                            1003  // Failed to validate the Google / Apple Pay session
                        ].indexOf(err.code) < 0) {
                            const message = err.message || 'Your card has not been authorised, please check the details and retry or contact your bank.'
                            showError( '<div class="woocommerce-error">' + message + '</div>' );
                        } else {
                            $container.html('<div class="woocommerce-error">' + errorMessage + '</div>');
                            $container.css('height', 'auto');                          
                        }
                    },
                    onLoad: () => {
                        $container.find('div').css('height', '40px');
                    }
                }
               
                paymentMethodObject.create(
                    $container[0],
                    this.paymentData,
                    events,
                    this.token
                );

                setLoading($container, false);
            }
        }
    }

    async function createHostedFields() {
        const $card_form = $('#wc-' + gateway_id + '-form');
        const $cc_form = $('#wc-' + gateway_id + '-cc-form');
        const $payment_token = $('input[name="wc-' + gateway_id + '-payment-token"]');
        const $tokenized_cvc = $('#dna-card-cvc-token-container')

        // if already iframe inserted
        if ($card_form.find('#dna-card-number').has('iframe').length) {
            return;
        }
        const instanceId = (new Date()).getTime()
        hostedFieldsInstanceId = instanceId

        const options = {
            isTest: isTestMode,
            accessToken: $card_form.data('token'),
            styles: {
                'input': {
                    'font-size': '14px',
                    'font-family': 'Open Sans'
                },
                '::placeholder': {
                    'opacity': '0.5'
                }
            },
            threeDSecure: {
                container: threeDSecureModal.body
            },
            fontNames: ['Open Sans'],
            sendCallbackEveryFailedAttempt: Number(wc_dna_params.send_callback_every_failed_attempt),
            fields: {
                cardholderName: {
                    container: $card_form.find('#dna-card-name')[0],
                    placeholder: 'ABC'
                },
                cardNumber: {
                    container: $card_form.find('#dna-card-number')[0],
                    placeholder: '1234 1234 1234 1234'
                },
                expirationDate: {
                    container: $card_form.find('#dna-card-exp')[0],
                    placeholder: 'MM / YY'
                },
                cvv: {
                    container: $card_form.find('#dna-card-cvc')[0],
                    placeholder: 'CVC'
                },
                tokenizedCardCvv: {
                    container: $card_form.find('#dna-card-cvc-token')[0],
                    placeholder: 'CVC'
                }
            }
        }
        
        try {
            hostedFieldsInstance = await window.dnaPayments.hostedFields.create(options);
            if (instanceId !== hostedFieldsInstanceId) return

            hostedFieldsInstance.on('dna-payments-three-d-secure-show', (data) => {
                formLoader.hide();
                threeDSecureModal.show();
            });
        
            hostedFieldsInstance.on('dna-payments-three-d-secure-hide', () => {
                threeDSecureModal.hide();
                formLoader.show();
            });

            function onPaymentTokenChange(selected) {
                if (!selected || selected === 'new') {
                    $tokenized_cvc.hide();
                    $cc_form.show();
                    hostedFieldsInstance.selectCard(null);
                } else {
                    const card = cards.find((c) => String(c.id) === String(selected));
                    const cvvState = hostedFieldsInstance.getTokenizedCardCvvState(card);

                    if (cvvState === 'required') {
                        $tokenized_cvc.show();
                    } else {
                        $tokenized_cvc.hide();
                    }
                    hostedFieldsInstance.selectCard(card);
                    $cc_form.hide();
                }
            }
    
            onPaymentTokenChange($payment_token.filter(':checked').val());
            $payment_token.change(function() {
                onPaymentTokenChange($(this).val());
            });

        } catch (err) {
            if (instanceId !== hostedFieldsInstanceId) return
            console.error(err);
            cardError.show('Your card has not been authorised, please check the details and retry or contact your bank.');
        }

    }

    function debounce(func, delay) {
        let timeoutId

        return function () {
            const context = this
            const args = arguments
            clearTimeout(timeoutId)
            timeoutId = setTimeout(() => {
                func.apply(context, args)
            }, delay)
        }
    }

    function createModal(id) {
        $( document.body ).append(`
            <div class="dna-modal-container" id="${id}">
                <div class="dna-modal">
                    <div class="dna-modal-body"></div>                
                </div>
            </div>
        `);

        const $modal = $(`.dna-modal-container#${id}`);

        return {
            show: () => $modal.addClass('open'),
            hide: () => $modal.removeClass('open'),
            body: $modal.find('.dna-modal-body')[0]
        }
    }

    function createFormLoader() {
        return {
            hide: () => {
                $checkout_form.removeClass( 'processing' ).unblock();
                $.unblockUI();
            },
            show: () => {
                $checkout_form.addClass( 'processing' );
                const form_data = $checkout_form.data();
    
                if ( 1 !== form_data['blockUI.isBlocked'] ) {
                    setLoading($checkout_form, true);
                }
            }
        }
    }

    function createCardError() {
        return {
            hide: () => $('.dna-source-errors').empty(),
            show: (message) => $('.dna-source-errors').html('<div class="woocommerce-error">' + message + '</div>')
        }
    }

    function scrollToNotices() {
        let scrollElement = $( '.woocommerce-NoticeGroup-updateOrderReview, .woocommerce-NoticeGroup-checkout' );

        if ( ! scrollElement.length ) {
            scrollElement = $( '.form.checkout' );
        }
        $.scroll_to_notices( scrollElement );
    }

    function showError( error_message ) {
        $( '.woocommerce-NoticeGroup-checkout, .woocommerce-error, .woocommerce-message' ).remove();
        $checkout_form.prepend( '<div class="woocommerce-NoticeGroup woocommerce-NoticeGroup-checkout">' + error_message + '</div>' );
        $checkout_form.removeClass( 'processing' ).unblock();
        $.unblockUI();
        $checkout_form.find( '.input-text, select, input:checkbox' ).trigger( 'validate' ).blur();
        scrollToNotices();
        $( document.body ).trigger( 'checkout_error' );
    }
} );

function setLoading($elem, isLoading) {
    if (isLoading) {
        $elem.block({
            message: null,
            overlayCSS: {
                background: '#fff',
                opacity: 0.6
            }
        });
    } else {
        $elem.unblock();
    }
}

function serializeObject(data) {
    return Object.keys(data)
        .map((key) => encodeURIComponent(key) + '=' + encodeURIComponent(data[key]))
        .join('&');
}

function getTotalAmount() {
    try {
        const obj = jQuery('#wc-' + gateway_id + '-totals').data('totals')
        return Number(obj.total);
    } catch (err) {
        console.error(err);
        return 0;
    }
}

function getSelectedGateway() {
    return jQuery('input[name="payment_method"]:checked').val();
}