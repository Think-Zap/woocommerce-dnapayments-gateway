<?php

class WC_DNA_Component_Payments_Gateway extends WC_Payment_Gateway {

    public function __construct() {
        $this->init_settings();
        $this->init_form_fields();

        $this->method_description = sprintf(
            /* translators: 1) HTML anchor open tag 2) HTML anchor closing tag */
                __( 'All other general DNA Payments settings can be adjusted %1$shere%2$s ', 'woocommerce-gateway-dna' ),
                '<a href="' . esc_url( admin_url( 'admin.php?page=wc-settings&tab=checkout&section=dnapayments' ) ) . '">',
                '</a>'
            );

        $this->title = $this->get_option( 'title' );
        $this->description = $this->get_option( 'description' );
        $this->enabled = $this->get_option( 'enabled' );

        add_action( 'woocommerce_update_options_payment_gateways_' . $this->id, array( $this, 'process_admin_options' ) );
    }

    public function init_form_fields() {
        $this->form_fields = array(
            'enabled' => array(
               'title'       => __( 'Enable/Disable', 'woocommerce-gateway-dna' ),
               'label'       => __( 'Enabled ' . $this->method_title, 'woocommerce-gateway-dna' ),
               'type'        => 'checkbox',
               'description' => '',
               'default'     => 'no'
            ),
            'title' => array(
               'title'       => __( 'Title', 'woocommerce-gateway-dna' ),
               'type'        => 'text',
               'description' => __( 'This controls the title which the user sees during checkout.', 'woocommerce-gateway-dna' ),
               'default'     => $this->method_title,
               'desc_tip'    => true,
            ),
            'description' => array(
               'title'       => __( 'Description', 'woocommerce-gateway-dna' ),
               'type'        => 'text',
               'desc_tip'    => true,
               'description' => __( 'This controls the description which the user sees during checkout.', 'woocommerce-gateway-dna' ),
               'default'     => '',
            )
         );
    }

    public function process_payment( $order_id ) {
        global $woocommerce;

        try {
            $gateway = WC()->payment_gateways->payment_gateways()[WC_DNA_ID];
            // Check if the gateway instance exists and has the process_payment() method
            if (is_object($gateway) && method_exists($gateway, 'process_payment')) {
                return $gateway->process_payment($order_id);
            }

            throw new Error();
        } catch (Error $e) {
            return array(
                'result' => 'failure',
                'messages' => [
                    __('Could not process payment', 'woocommerce-gateway-dna')
                 ]
            );
        }
    }
}
