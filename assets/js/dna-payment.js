/* global wc_checkout_params */
/* global wc_dna_params */

jQuery( function( $ ) {
	'use strict';

    const $checkout_form = $( 'form.woocommerce-checkout' );

    const isTestMode = wc_dna_params.is_test_mode === '1';
    const isHostedFields = wc_dna_params.integration_type === 'hosted-fields'
    let hostedFieldsInstance

    const threeDSecureModal = createModal('three-d-secure');
    const formLoader = createFormLoader();
    const cardError = createCardError();

    $checkout_form.on('checkout_place_order_dnapayments', onSubmit);

    $( document.body ).on( 'updated_checkout', function() {
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

        try {
            formLoader.show();
            $.ajax({
                type: 'POST',
                url: wc_checkout_params.checkout_url,
                data: $( 'form.checkout' ).serialize(),
                dataType: 'json',
                success: function(result) {
                    if(result.result == 'success') {
                        pay(result);
                        return;
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
                }
            });
        } catch (e) {
            console.log(e)
        }
    }

    function pay({ paymentData, auth }) {
        window.DNAPayments.configure({
            isTestMode
        });

        switch (wc_dna_params.integration_type) {
            case 'hosted-fields':
                const { returnUrl } = paymentData.paymentSettings
                hostedFieldsInstance.submit({
                    paymentData,
                    token: auth.access_token
                }).then(() => {
                    window.location.href = returnUrl;
                }).catch((err) => {
                    cardError.show(err.message);
                    if (err.code !== 'NOT_VALID_CARD_DATA') {
                        hostedFieldsInstance.clear()
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
        const $card_form = $('#wc-dnapayments-cc-form');

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
        } catch (err) {
            cardError.show(err.message);
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
