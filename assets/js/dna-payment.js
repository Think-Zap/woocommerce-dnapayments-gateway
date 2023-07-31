/* global wc_checkout_params */
/* global wc_dna_params */

const gateway_id = 'dnapayments'

jQuery( function( $ ) {
	'use strict';

    const $checkout_form = $( 'form.woocommerce-checkout' );

    const isTestMode = wc_dna_params.is_test_mode === '1';
    const isHostedFields = wc_dna_params.integration_type === 'hosted-fields';
    const tempToken = wc_dna_params.temp_token;
    const currencyCode = wc_dna_params.current_currency_code;
    const terminalId = wc_dna_params.terminal_id;
    const availableGateways = Object.keys(wc_dna_params.available_gateways || {})
    const cards = Object.values(wc_dna_params.cards || {});

    let hostedFieldsInstance

    const threeDSecureModal = createModal('three-d-secure');
    const formLoader = createFormLoader();
    const cardError = createCardError();
    const googlePay = createPaymentComponent({
        paymentMethodId: 'dnapayments_google_pay',
        paymentMethodObject: window.DNAPayments.GooglePayComponent
    });
    const applePay = createPaymentComponent({
        paymentMethodId: 'dnapayments_apple_pay',
        paymentMethodObject: window.DNAPayments.ApplePayComponent
    });

    googlePay && googlePay.$listItem.hide();
    applePay && applePay.$listItem.hide();

    $checkout_form.on('change', 'input[name="payment_method"]', function() {
        selectGateway($(this).val());
    });

    $checkout_form.on('checkout_place_order_dnapayments', onSubmit);

    function selectGateway(selectedGateway) {
        const $placeOrderBtn = $checkout_form.find('#place_order');
        $placeOrderBtn.show();
        googlePay && googlePay.$container.hide();
        applePay && applePay.$container.hide();

        if (['dnapayments', 'dnapayments_google_pay', 'dnapayments_apple_pay'].includes(selectedGateway)) {
            $checkout_form.find('.dnapayments-footer').show();
        } else {
            $checkout_form.find('.dnapayments-footer').hide();
        }

        switch (selectedGateway) {
            case 'dnapayments_google_pay':
                $placeOrderBtn.hide();
                googlePay && googlePay.$container.show();
                break;
            case 'dnapayments_apple_pay':
                $placeOrderBtn.hide();
                applePay && applePay.$container.show();
                break;
        }
    }    

    $( document.body ).on( 'updated_checkout', function() {

        googlePay && googlePay.renderButton();
        applePay && applePay.renderButton();
        selectGateway($('input[name="payment_method"]:checked').val());

        if (isHostedFields) {
            createHostedFields();
        }
    });

    function onSubmit(e) {
        // wc_checkout_params is required to continue, ensure the object exists
        if ( typeof wc_checkout_params === 'undefined' ) {
            return false;
        }

        handlePlaceOrder();

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
                $.ajax({
                    type: 'POST',
                    url: wc_checkout_params.checkout_url,
                    data: $( 'form.checkout' ).serialize(),
                    dataType: 'json',
                    success: function(result) {
                        if(result.result == 'success') {
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
                console.log(e)
            }
        })
    }

    function pay({ paymentData, auth }) {
        window.DNAPayments.configure({ isTestMode, cards });

        switch (wc_dna_params.integration_type) {
            case 'hosted-fields':
                const { returnUrl } = paymentData.paymentSettings
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
        paymentMethodId, paymentMethodObject
    }) {
        const findContainer = () => $checkout_form.find('#' + paymentMethodId + '_container');
        const findInList = () => $checkout_form.find('.payment_method_' + paymentMethodId);

        if ( ! availableGateways?.includes(paymentMethodId)) {
            return null
        }

        return {
            isLoaded: false,
            returnUrl: '',
            $listItem: findInList(),
            $container: findContainer(),
            renderButton: function() {

                this.$listItem = findInList();
                this.$container = findContainer();

                this.$listItem.hide();
                this.$container.html('');

                const fetchPaymentData = async () => {
                    const { paymentData, auth } = await processPayment();
                    this.returnUrl = paymentData.paymentSettings.returnUrl;
                    return { paymentData, token: auth.access_token };
                }

                const events = {
                    onClick: () => {
                        const amount = parseFloat(jQuery('.order-total .woocommerce-Price-amount.amount').first().text().replace(/[^\d.-]/g, ''));
                        return {
                            paymentData: {
                                amount,
                                currency: currencyCode,
                                paymentSettings: {
                                    terminalId,
                                },
                            }
                        }
                    },
                    onBeforeProccessPayment: fetchPaymentData,
                    onPaymentSuccess: (result) => {
                        formLoader.hide();
                        if (this.returnUrl) {
                            window.location.href = this.returnUrl;
                        }
                    },
                    onCancel: (err) => {
                        formLoader.hide();
                    },
                    onError: (err) => {
                        console.error(err)
                        formLoader.hide();
                        if (err.code !== 1002) {
                            const message = err.message || 'Your card has not been authorised, please check the details and retry or contact your bank.'
                            showError( '<div class="woocommerce-error">' + message + '</div>' );
                        }
                    },
                    onLoad: () => {
                        this.isLoaded = true;
                        this.$listItem.show();
                        this.$container.find('div').css('height', '40px');
                    }
                }
                
                paymentMethodObject.create(
                    this.$container[0],
                    {
                        amount: 0,
                        paymentSettings: {
                            terminalId,
                        }
                    },
                    events,
                    tempToken
                );
            }
        }
    }

    async function createHostedFields() {
        const $card_form = $('#wc-' + gateway_id + '-form');
        const $payment_token = $('input[name="wc-' + gateway_id + '-payment-token"]');
        const $tokenized_cvc = $('#dna-card-cvc-token-container')

        // if already iframe inserted
        if ($card_form.find('#dna-card-number').has('iframe').length) {
            return;
        }

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
                }
            }
    
            onPaymentTokenChange($payment_token.filter(':checked').val());
            $payment_token.change(function() {
                onPaymentTokenChange($(this).val());
            });

        } catch (err) {
            cardError.show('Your card has not been authorised, please check the details and retry or contact your bank.');
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
                    $checkout_form.block({
                        message: null,
                        overlayCSS: {
                            background: '#fff',
                            opacity: 0.6
                        }
                    });
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
