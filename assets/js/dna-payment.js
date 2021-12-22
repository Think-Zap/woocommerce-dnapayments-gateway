/* global wc_checkout_params */
/* global wc_dna_params */
const $checkout_form = jQuery('form.checkout');

// wc_checkout_params is required to continue, ensure the object exists
$checkout_form.on( 'checkout_place_order', function() {

    if ( typeof wc_checkout_params === 'undefined' ) {
        return false;
    }

    let config = {};
    const $payment_method = jQuery( 'form.checkout input[name="payment_method"]:checked' ).val();

    function scrollToNotices() {
        let scrollElement = jQuery( '.woocommerce-NoticeGroup-updateOrderReview, .woocommerce-NoticeGroup-checkout' );

        if ( ! scrollElement.length ) {
            scrollElement = jQuery( '.form.checkout' );
        }
        jQuery.scroll_to_notices( scrollElement );
    }

    function showError( error_message ) {
        jQuery( '.woocommerce-NoticeGroup-checkout, .woocommerce-error, .woocommerce-message' ).remove();
        $checkout_form.prepend( '<div class="woocommerce-NoticeGroup woocommerce-NoticeGroup-checkout">' + error_message + '</div>' );
        $checkout_form.removeClass( 'processing' ).unblock();
        jQuery.unblockUI();
        $checkout_form.find( '.input-text, select, input:checkbox' ).trigger( 'validate' ).blur();
        scrollToNotices();
        jQuery( document.body ).trigger( 'checkout_error' );
    }

    function blockOnSubmit() {
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

    function getPaymentRequestData() {
        const {
            invoiceId,
            amount,
            currency,
            accountId,
            accountCountry,
            accountCity,
            accountStreet1,
            accountEmail,
            accountFirstName,
            accountLastName,
            accountPostalCode,
            phone,
            backLink,
            failureBackLink,
            postLink,
            failurePostLink,
            language,
            transactionType,
            description,
            terminal,
            shippingAddress,
            orderLines,
            amountBreakdown,
            auth
        } = config;
        return {
            accountCountry: accountCountry,
            accountCity: accountCity,
            accountStreet1: accountStreet1,
            accountEmail: accountEmail,
            accountFirstName: accountFirstName,
            accountLastName: accountLastName,
            accountPostalCode: accountPostalCode,
            phone: phone,
            invoiceId: invoiceId,
            backLink: backLink,
            failureBackLink: failureBackLink,
            postLink: postLink,
            failurePostLink: failurePostLink,
            language: language,
            description: description,
            accountId: accountId,
            terminal: terminal,
            currency: currency,
            amount: amount,
            shippingAddress: shippingAddress,
            orderLines: orderLines,
            amountBreakdown: amountBreakdown,
            ...(transactionType !== 'default' ? { transactionType: transactionType } : {}),
            auth: auth
        };
    }

    function pay() {
        window.DNAPayments.configure({
            isTestMode: wc_dna_params.is_test_mode === '1'
        });

        if (wc_dna_params.integration_type === 'embedded') {
            window.DNAPayments.openPaymentIframeWidget(getPaymentRequestData());
        } else {
            window.DNAPayments.openPaymentPage(getPaymentRequestData());
        }
    }

    if ($payment_method == 'dnapayments') {
        try {
            $checkout_form.addClass( 'processing' );
            blockOnSubmit();
            jQuery.ajax({
                type: 'POST',
                url: wc_checkout_params.checkout_url,
                data: jQuery( 'form.checkout' ).serialize(),
                dataType: 'json',
                success: function(result) {
                    if(result.result == 'success') {
                        config = result;
                        $checkout_form.removeClass( 'processing' ).unblock();
                        jQuery.unblockUI();
                        pay();
                        return;
                    }

                    if ( true === result.reload ) {
                        window.location.reload();
                        return;
                    }

                    if ( true === result.refresh ) {
                        jQuery(document.body).trigger( 'update_checkout' );
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
        return false;
    }
    return true;
});
