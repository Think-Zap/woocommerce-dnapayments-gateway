<?php

class WC_Gateway_DNA_Base_Payment_Component extends WC_Payment_Gateway {

    public function __construct() {

        $this->init_settings();
        $this->init_form_fields();

        $this->method_description = sprintf(
            /* translators: 1) HTML anchor open tag 2) HTML anchor closing tag */
                __( 'All other general DNA Payments settings can be adjusted %1$shere%2$s ', WC_DNA_Payments::$text_domain ),
                '<a href="' . esc_url( admin_url( 'admin.php?page=wc-settings&tab=checkout&section=dnapayments' ) ) . '">',
                '</a>'
            );

        $this->title        = $this->get_option( 'title' );
        $this->description  = $this->get_option( 'description' );
        $this->enabled      = $this->get_option( 'enabled' );

        add_action( 'woocommerce_update_options_payment_gateways_' . $this->id, array( $this, 'process_admin_options' ) );
    }

    public function init_form_fields() {
        $this->form_fields = array(
            'enabled' => array(
               'title'       => __( 'Enable/Disable', WC_DNA_Payments::$text_domain ),
               'label'       => __( 'Enabled ' . $this->method_title, WC_DNA_Payments::$text_domain ),
               'type'        => 'checkbox',
               'description' => '',
               'default'     => 'no'
            ),
            'title' => array(
               'title'       => __( 'Title', WC_DNA_Payments::$text_domain ),
               'type'        => 'text',
               'description' => __( 'This controls the title which the user sees during checkout.', WC_DNA_Payments::$text_domain ),
               'default'     => $this->method_title,
               'desc_tip'    => true,
            ),
            'description' => array(
               'title'       => __( 'Description', WC_DNA_Payments::$text_domain ),
               'type'        => 'text',
               'desc_tip'    => true,
               'description' => __( 'This controls the description which the user sees during checkout.', WC_DNA_Payments::$text_domain ),
               'default'     => '',
            )
         );
    }

    // Returns settings data used in frontend (js file)
    public function get_settings_for_frontend() {
        return array();
    }

    /**
	 * Process the payment and return the result.
	 *
	 * @param  int  $order_id
	 * @return array
	 */
	public function process_payment( $order_id ) {
        global $woocommerce;

        $dnapayments_gateway = WC()->payment_gateways->payment_gateways()[WC_DNA_Payments::$id];

        $result_string = WC_DNA_Payments_Helpers::get_posted_value('wc-' . $this->id . '-result');
        
        if ( empty ($result_string) ) {
            return $dnapayments_gateway->process_payment( $order_id );
        }

		$order = wc_get_order( $order_id );
        $input = json_decode($result_string, true);

        if (!$input['success']) {
            $message = __( 'Could not process payment.', WC_DNA_Payments::$text_domain );
			$order->update_status( 'failed', $message );
			throw new Exception( $message );
        }

        $order->set_transaction_id($input['id']);
        if($input['settled']) {
            $order->payment_complete();
            $order->add_order_note( sprintf( __( 'DNA Payments transaction complete (Transaction ID: %s)', 'woocommerce-gateway-dna' ), $input['id']) );

            if ( 'yes' === $dnapayments_gateway->get_option( 'enable_order_complete' ) ) {
                $order->update_status('completed');
            }
        } else {
            $order->update_status('on-hold');
            $order->add_order_note( sprintf( __( 'DNA Payments awaiting payment complete (Transaction ID: %s)', 'woocommerce-gateway-dna' ), $input['id']) );
        }

        $order->update_meta_data('rrn', $input['rrn']);
        $order->update_meta_data('payment_method', $input['paymentMethod']);
        $order->update_meta_data('is_finished_payment', $input['settled'] ? 'yes' : 'no');

        $manage_stock_option = get_option('woocommerce_manage_stock');
        // if the order status changed from pending to processing (on-hold), woocommerce automatically reduces stock
        if ($manage_stock_option !== 'yes' || $status !== 'pending') {
            $order->reduce_order_stock();
            $order->add_order_note( sprintf( __( 'DNA Payments reduced order stock by transaction (Transaction ID: %s)', 'woocommerce-gateway-dna' ), $input['id']) );
        }

        $order->save();

        // Remove cart
        WC()->cart->empty_cart();


        // Return thankyou redirect
        return array(
            'result' 	=> 'success',
            'redirect'	=> $this->get_return_url( $order )
        );
        
	}

}
