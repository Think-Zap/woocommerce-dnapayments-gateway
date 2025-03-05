/* global wc_dna_params */

const gateway_id = 'dnapayments'

jQuery( function( $ ) {
	'use strict';

    const $add_form = $('form#add_payment_method');

    const isTestMode = wc_dna_params.is_test_mode === '1';
    const isHostedFields = wc_dna_params.integration_type === 'hosted-fields';
    const cards = Object.values(wc_dna_params.cards || {});

    let hostedFieldsInstance, hostedFieldsInstanceId

    const threeDSecureModal = createModal('three-d-secure');
    const formLoader = createFormLoader($add_form);
    const formError = createFormError($add_form);
    const message = createMessage()

    if ( $add_form.length ) {
        $add_form.on('submit', onSubmit);

        if (isHostedFields) {
            createHostedFields()
        }
    } else {
        const result = getQueryParam('result')

        if (!result) {
            message.hide()
        } else if (result === 'success') {
            message.success('Successfully added payment method to your account.')
        } else if (result === 'failure') {
            message.error('Unable to add payment method to your account.')
        }
    }

    function onSubmit(e) {
        if (isDnaChoosen($add_form)) {
            e.preventDefault();

            formLoader.hide();
            
            handlePlaceOrder();

            return false;
        }
        
    }

    async function handlePlaceOrder() {
        try {
            if ( isHostedFields ) {
                const { isValid } = await hostedFieldsInstance.validate();
                if ( ! isValid ) {
                    throw new Error('Invalid card data.')
                }
            }
    
            const result = await processPayment();
            pay(result);
        } catch (err) {
            formLoader.hide()
            if (err) {
                formError.show(String(err))
            }
        }        
    }

    function processPayment() {
        return new Promise(function (resolve, reject) {
            try {
                formLoader.show();
                $.ajax({
                    type: 'GET',
                    url: '/wp-admin/admin-ajax.php?action=add_card_payment_data',
                    dataType: 'json',
                    success: function(result) {
                        if(result.result == 'success') {
                            resolve(result);
                        } else {
                            reject()
                        }   

                    },
                    error:	function( jqXHR, textStatus, errorThrown ) {
                        reject(errorThrown)
                    }
                });
            } catch (e) {
                reject()
                console.error(e)
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
                        formError.show('Your card has not been authorised, please check the details and retry or contact your bank.');
                    } else {
                        formError.show(err.message)
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

    async function createHostedFields() {
        const $card_form = $('#wc-' + gateway_id + '-form');

        // if already iframe inserted
        if ($card_form.find('#dna-card-number').has('iframe').length) {
            return;
        }
        const instanceId = (new Date()).getTime()
        hostedFieldsInstanceId = instanceId

        const options = {
            isTestMode: isTestMode,
            accessToken: $card_form.data('token'),
            styles: {
                'input': {
                    'font-size': '16px',
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
            if (instanceId !== hostedFieldsInstanceId) return

            hostedFieldsInstance.on('dna-payments-three-d-secure-show', (data) => {
                formLoader.hide();
                threeDSecureModal.show();
            });
        
            hostedFieldsInstance.on('dna-payments-three-d-secure-hide', () => {
                threeDSecureModal.hide();
                formLoader.show();
            });

            hostedFieldsInstance.on('change', () => {
                const state = hostedFieldsInstance.getState();
                const scheme = state.cardInfo && state.cardInfo.type || 'none';
                const img = document.getElementById('dna-card-selected');
                if (img) {
                    img.setAttribute('src', wc_dna_params.card_scheme_icon_path + '/' + scheme + '.png');
                }
            });

        } catch (err) {
            if (instanceId !== hostedFieldsInstanceId) return
            console.error(err);
            formError.show('Your card has not been authorised, please check the details and retry or contact your bank.');
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

    function createFormLoader($form) {
        return {
            hide: () => $form.unblock(),
            show: () => {
                $form.block({
                    message: null,
                    overlayCSS: {
                        background: '#fff',
                        opacity: 0.6
                    }
                });
            }
        }
    }

    function createFormError($form) {
        return {
            hide: () => $form.find('.dna-source-errors').empty(),
            show: (message) => $form.find('.dna-source-errors').html('<div class="woocommerce-error">' + message + '</div>')
        }
    }

    function createMessage() {
        let $woo = $('#content #primary').prev('.woocommerce')
        if ( ! $woo.length ) {
            $woo = $(`<div class="woocommerce"></div>`)
            $('#content #primary').prepend($woo)
        }

        const hide = () => $woo.html('')
        return {
            hide: () => console.log($woo),
            success: (msg) => {
                hide()
                $woo.html(`<div class="woocommerce-message" role="alert">${msg}</div>`)
            },
            error: (msg) => {
                hide()
                $woo.html(`<div class="woocommerce-error" role="alert">${msg}</div>`)
            },
        }
    }

    function isDnaChoosen($form) {
        return $form.find('#payment_method_dnapayments').is(':checked')
    }

    function getQueryParam(name) {
        var currentUrl = window.location.href;    
        var url = new URL(currentUrl);    
        var searchParams = url.searchParams;
    
        if (searchParams.has(name)) {
            var value = searchParams.get(name)
            searchParams.delete(name);
            history.replaceState(null, null, url.href);
            return value
        }
    }
} );
