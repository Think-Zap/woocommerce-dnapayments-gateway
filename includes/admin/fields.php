<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

return array(
        'enabled' => array(
           'title'       => __( 'Enable/Disable', 'woocommerce-gateway-dna' ),
           'label'       => __( 'Enabled DNA Payments Gateway', 'woocommerce-gateway-dna' ),
           'type'        => 'checkbox',
           'description' => '',
           'default'     => 'no'
        ),
        'title' => array(
           'title'       => __( 'Title', 'woocommerce-gateway-dna' ),
           'type'        => 'text',
           'description' => __( 'This controls the title which the user sees during checkout.', 'woocommerce-gateway-dna' ),
           'default'     => 'Visa / Mastercard / American Express / Diners Club / Other',
           'desc_tip'    => true,
        ),
        'description' => array(
           'title'       => __( 'Description', 'woocommerce-gateway-dna' ),
           'type'        => 'text',
           'desc_tip'    => true,
           'description' => __( 'This controls the description which the user sees during checkout.', 'woocommerce-gateway-dna' ),
           'default'     => 'Card payment method',
        ),
        'client_id' => array(
           'title'       => __( 'LIVE Client ID', 'woocommerce-gateway-dna' ),
           'type'        => 'text'
        ),
        'client_secret' => array(
           'title'       => __( 'LIVE Secret ', 'woocommerce-gateway-dna' ),
           'type'        => 'password'
        ),
        'terminal' => array(
           'title'       => __( 'LIVE Terminal ID', 'woocommerce-gateway-dna' ),
           'type'        => 'text'
        ),
        'transactionType' => array(
            'title'       => __( 'Transaction type', 'woocommerce-gateway-dna' ),
            'type'        => 'select',
            'class'       => 'wc-enhanced-select',
            'description' => __( 'Choose whether you wish to capture funds immediately or authorize payment only.', 'woocommerce-gateway-dna' ),
            'default'     => 'default',
            'desc_tip'    => true,
            'options'     => array(
                'default' => __( 'Default', 'woocommerce-gateway-dna' ),
                'sale' => __( 'Sale', 'woocommerce-gateway-dna' ),
                'auth' => __( 'Authorisation', 'woocommerce-gateway-dna' )
            ),
        ),
        'integration_type' => array(
            'title'       => __( 'Payment form integration type', 'woocommerce-gateway-dna' ),
            'type'        => 'select',
            'class'       => 'wc-enhanced-select',
            'default'     => 'hosted',
            'desc_tip'    => true,
            'options'     => array(
               'hosted' => __( 'Full Redirect', 'woocommerce-gateway-dna' ),
               'embedded' => __( 'iFrame LightBox', 'woocommerce-gateway-dna' )
            ),
         ),
        'is_test_mode' => array(
           'title'       => __( 'Test mode', 'woocommerce-gateway-dna' ),
           'label'       => 'Enable Test Mode',
           'type'        => 'checkbox',
           'description' => __( 'Place the payment gateway in test mode using test API keys.', 'woocommerce-gateway-dna' ),
           'default'     => 'no',
           'desc_tip'    => true,
        ),
        'test_client_id' => array(
           'title'       => __( 'Test Client ID', 'woocommerce-gateway-dna' ),
           'type'        => 'text'
        ),
        'test_client_secret' => array(
           'title'       => __( 'Test Client secret', 'woocommerce-gateway-dna' ),
           'type'        => 'password'
        ) ,
        'test_terminal' => array(
           'title'       => __( 'Test Terminal ID', 'woocommerce-gateway-dna' ),
           'type'        => 'text',
        ),
        'backLink' => array(
           'title'       => __( 'Back link', 'woocommerce-gateway-dna' ),
           'type'        => 'textarea',
           'description' => __( 'URL for success page.', 'woocommerce-gateway-dna' ), //: TODO: change
           'desc_tip'    => true
        ),
        'failureBackLink' => array(
           'title'       => __( 'Failure back link', 'woocommerce-gateway-dna' ),
           'type'        => 'textarea',
           'description' => __( 'URL for failure page.', 'woocommerce-gateway-dna' ), //: TODO: change
           'desc_tip'    => true
        ),
        'gatewayOrderDescription' => array(
           'title'       => __( 'Gateway order description', 'woocommerce-gateway-dna' ),
           'type'        => 'textarea',
           'default'     => 'Pay with your credit card via our payment gateway',
        )
);
