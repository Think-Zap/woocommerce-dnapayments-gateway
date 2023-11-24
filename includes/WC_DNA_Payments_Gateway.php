<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly
}

if ( is_readable( WC_DNA_PLUGIN_PATH . '/vendor/autoload.php' ) ) {
    require WC_DNA_PLUGIN_PATH . '/vendor/autoload.php';
}

require_once WC_DNA_PLUGIN_PATH . '/includes/admin/fields.php';


class WC_DNA_Payments_Gateway extends WC_Payment_Gateway {

    /**
	 * True if the gateway shows fields on the checkout.
	 *
	 * @var bool
	 */
	public $has_fields;
    /**
     * @var bool
     */
    public $is_test_mode;
    /**
     * @var string
     */
    public $terminal;
    /**
     * @var string
     */
    public $client_id;
    /**
     * @var string
     */
    public $client_secret;
    /**
     * @var boolean
     */
    public $enabled_saved_cards;
    /**
     * @var string
     */
    public $integration_type;
    /**
     * @var \DNAPayments\DNAPayments
     */
    public $dnaPayment;

    public function __construct() {

        $this->id = 'dnapayments';
        $this->icon = '';
        $this->method_title = 'DNA Payments Gateway';
        $this->method_description = 'Card payment method';

        $this->init_form_fields();
        $this->init_settings();
        $this->title = $this->get_option( 'title' );
        $this->description = $this->get_option( 'description' );
        $this->enabled = $this->get_option( 'enabled' );
        $this->is_test_mode = 'yes' === $this->get_option( 'is_test_mode' );
        $this->integration_type = $this->get_option( 'integration_type' );
        $this->has_fields = $this->integration_type == 'hosted-fields';
        $this->enabled_saved_cards = 'yes' === $this->get_option( 'enabled_saved_cards' );
        $this->client_id = $this->is_test_mode ? $this->get_option( 'test_client_id' ) : $this->get_option( 'client_id' );
        $this->client_secret = $this->is_test_mode ? $this->get_option( 'test_client_secret' ) : $this->get_option( 'client_secret' );
        $this->terminal = $this->is_test_mode ? $this->get_option( 'test_terminal' ) : $this->get_option('terminal');
        add_action( 'woocommerce_update_options_payment_gateways_' . $this->id, array( $this, 'process_admin_options' ) );
        add_action( 'wp_enqueue_scripts', array( $this, 'payment_scripts') );
        load_plugin_textdomain( 'woocommerce-gateway-dna', false, dirname( plugin_basename( __FILE__ ) ) . '/languages/' );
        add_action( 'rest_api_init', array( $this, 'register_routes' ));
        $this->dnaPayment = new DNAPayments\DNAPayments($this->get_config());

        $this->supports = array( 'products', 'refunds', 'tokenization' );

    }

    public function get_config() {
        return [
            'isTestMode' => $this->is_test_mode,
            'scopes' => [
                'allowHosted' => true,
                'allowEmbedded' => $this->integration_type == 'embedded'
            ]
        ];
    }

    public function save_payment_method_requested() {
		$payment_method = isset( $_POST['payment_method'] ) ? wc_clean( wp_unslash( $_POST['payment_method'] ) ) : $this->id;

		return isset( $_POST[ 'wc-' . $payment_method . '-new-payment-method' ] ) && ! empty( $_POST[ 'wc-' . $payment_method . '-new-payment-method' ] );
	}

    /**
     * Cancel a charge.
     *
     * @param  WC_Order $order
     * @return bool
     */
    public function process_cancel($order) {
        $logger = wc_get_logger();
        try {
            $result = $this->dnaPayment->cancel([
                'client_id' => $this->client_id,
                'client_secret' => $this->client_secret,
                'terminal' => $this->terminal,
                'invoiceId' => strval($order->get_order_number()),
                'amount' => $order->get_total(),
                'currency' => $order->get_currency(),
                'transaction_id' => $order->get_transaction_id()
            ]);

            return !empty($result) && $result['success'];
        } catch (Exception $e) {
            $logger->error('Code: ' . $e->getCode() . '; Message: ' . $e->getMessage());
            return false;
        }

        return false;
    }

    /**
     * Can the order be refunded via DNA
     *
     * @param  WC_Order $order Order object.
     * @return bool
     */
    public function can_refund_order( $order ) {
        $paymentMethod = $order->get_meta( 'payment_method', true );
        if($paymentMethod === 'paypal' && !WC_DNA_Payments_Order_Admin_Helpers::isValidStatusPayPalStatus($order)) {
            return false;
        }
        return true;
    }

    /**
     * Refund a charge.
     *
     * @param  int $order_id
     * @param  float $amount
     * @return bool
     */
    public function process_refund( $order_id, $amount = null, $reason = '') {
        $logger = wc_get_logger();
        $order = wc_get_order($order_id);

        if ( ! $order ) {
            return false;
        }

        if ( ! $order->get_transaction_id() ) {
            return false;
        }

        if( $order->get_meta('is_finished_payment', true) === 'no' ) {
            return $this->process_cancel($order);
        }

        try {
            $result = $this->dnaPayment->refund([
                'client_id' => $this->client_id,
                'client_secret' => $this->client_secret,
                'terminal' => $this->terminal,
                'invoiceId' => strval($order->get_order_number()),
                'amount' => $amount,
                'currency' => $order->get_currency(),
                'transaction_id' => $order->get_transaction_id()
            ]);

            return !empty($result) && $result['success'];
        } catch (Exception $e) {
            $logger->error('Code: ' . $e->getCode() . '; Message: ' . $e->getMessage());
            return false;
        }

        return false;
    }

    public function register_routes() {
        register_rest_route( 'dnapayments', 'success', array(
            'methods'  => WP_REST_Server::CREATABLE,
            'callback' => array( $this, 'success_webhook'),
            'permission_callback' => '__return_true'
        ) );

        register_rest_route( 'dnapayments', 'failure', array(
            'methods'  => WP_REST_Server::CREATABLE,
            'callback' => array( $this, 'fail_webhook'),
            'permission_callback' => '__return_true'
        ) );

        register_rest_route( 'dnapayments', 'failure-page', array(
            'methods'  => WP_REST_Server::READABLE,
            'callback' => array( $this, 'fail_page_webhook'),
            'permission_callback' => '__return_true'
        ) );
    }

    private function savePayPalOrderDetail(WC_Order $order, $input, $isAddOrderNode) {
        $status = $input['paypalOrderStatus'];
        $сapture_status = $input['paypalCaptureStatus'];
        $reason = isset($input['paypalCaptureStatusReason']) ? $input['paypalCaptureStatusReason'] : null;

        if ($isAddOrderNode) {
            $errorText = '';

            if($order->get_meta('paypal_status', true) !== $input['paypalOrderStatus']) {
                $errorText .= sprintf(__( 'DNA Payments paypal status was changed from "%s" to "%s". ', 'woocommerce-gateway-dna'), $order->get_meta('paypal_status', true));
            }

            if($order->get_meta('paypal_capture_status', true) !== $input['paypalCaptureStatus']) {
                if($errorText === '') {
                    $errorText .= sprintf(__( 'DNA Payments paypal capture status was changed from "%s" to "%s". ', 'woocommerce-gateway-dna'), $order->get_meta('paypal_capture_status', true), $input['paypalCaptureStatus']);
                } else {
                    $errorText .= sprintf(__( 'Capture status was changed from "%s" to "%s". ', 'woocommerce-gateway-dna'), $order->get_meta('paypal_capture_status', true), $input['paypalCaptureStatus']);
                }
            }

            if($order->get_meta('paypal_capture_status_reason', true) !== $input['paypalCaptureStatusReason']) {
                if($errorText === '') {
                    $errorText .= ($reason ? __( 'DNA Payments paypal capture status reason was changed: ', 'woocommerce-gateway-dna'). $reason . '.' : '');
                } else {
                    $errorText .= ($reason ? __( 'Reason:  ', 'woocommerce-gateway-dna'). $reason . '.' : '');
                }
            }

            if(strlen($errorText) > 0) {
                $order->add_order_note($errorText);
            }
        }

        $order->update_meta_data( 'paypal_status',  $status);
        $order->update_meta_data( 'paypal_capture_status',  $сapture_status);

        if ($reason) {
            $order->update_meta_data( 'paypal_capture_status_reason',  $input['paypalCaptureStatusReason']);
        }
        $order->save();
    }

     public function success_webhook( WP_REST_Request $input ) {

        if (!empty($input) && !empty($input['invoiceId']) && $input['success'] && $this->dnaPayment::isValidSignature($input, $this->client_secret)) {
            
            $orderId = $input->get_query_params()['orderId'];
            if (!isset($orderId) || empty($orderId)) {
                $orderId = WC_DNA_Payments_Order_Admin_Helpers::findOrderByOrderNumber($input['invoiceId']);
            }

            $order = wc_get_order( $orderId );
            $status = $order->get_status();

            if (!$order) {
                throw new Error('Not found order by id ' . $orderId);
            }

            if(!WC_DNA_Payments_Order_Client_Helpers::isDNAPaymentOrder($order)) {
                throw new Error('Order processed by payment method ' . $order->get_payment_method());
            }

            $isCompletedOrder = $status !== 'pending' && $status !== 'failed';;
            if($isCompletedOrder && !empty($input['paypalCaptureStatus'])) {
                $this->savePayPalOrderDetail($order, $input, true);
            } else {
                $order->set_transaction_id($input['id']);
                if($input['settled']) {
                    $order->payment_complete();
                    $order->add_order_note( sprintf( __( 'DNA Payments transaction complete (Transaction ID: %s)', 'woocommerce-gateway-dna' ), $input['id']) );
                } else {
                    $order->update_status('on-hold');
                    $order->add_order_note( sprintf( __( 'DNA Payments awaiting payment complete (Transaction ID: %s)', 'woocommerce-gateway-dna' ), $input['id']) );
                }

                $order->update_meta_data('rrn', $input['rrn']);
                $order->update_meta_data('payment_method', $input['paymentMethod']);
                $order->update_meta_data('is_finished_payment', $input['settled'] ? 'yes' : 'no');

                if(!empty($input['paypalCaptureStatus'])) {
                    $this->savePayPalOrderDetail($order, $input, false);
                }

                $manage_stock_option = get_option('woocommerce_manage_stock');
                // if the order status changed from pending to processing (on-hold), woocommerce automatically reduces stock
                if ($manage_stock_option !== 'yes' || $status !== 'pending') {
                    $order->reduce_order_stock();
                    $order->add_order_note( sprintf( __( 'DNA Payments reduced order stock by transaction (Transaction ID: %s)', 'woocommerce-gateway-dna' ), $input['id']) );
                }

                $order->save();
            }

            if ($this->enabled_saved_cards && $order->get_meta('save_payment_method_requested', true) == 'yes') {
                WC_DNA_Payments_Order_Client_Helpers::saveCardToken( $input, $this->id );
            }
        } else {
            return;
        }
    }

    public function fail_webhook( WP_REST_Request $input ) {

        if ($input && !empty($input['invoiceId']) && !$input['success'] && $this->dnaPayment::isValidSignature($input, $this->client_secret)) {

            $orderId = $input->get_query_params()['orderId'];
            if (!isset($orderId) || empty($orderId)) {
                $orderId = WC_DNA_Payments_Order_Admin_Helpers::findOrderByOrderNumber($input['invoiceId']);
            }

            $order = wc_get_order( $orderId );

            if (!$order) {
                throw new Error('Not found order by id ' . $orderId);
            }

            if(!WC_DNA_Payments_Order_Client_Helpers::isDNAPaymentOrder($order)) {
                throw new Error('Order processed by payment method ' . $order->get_payment_method());
            }

            $isCompletedOrder = $order->get_status() !== 'pending';
            if($isCompletedOrder && !empty($input['paypalCaptureStatus'])) {
                $this->savePayPalOrderDetail($order, $input, true);
            } else {
                $order->update_status('failed', 'Payment failed');
                if(!empty($input['paypalCaptureStatus'])) {
                    $this->savePayPalOrderDetail($order, $input, false);
                }
                $order->save();
            }

        } else {
            return;
        }
    }

    public function add_notice($message, $notice_type = 'success', $data = array()) {
        if(function_exists('wc_add_notice')) {
            wc_add_notice($message, $notice_type, $data);
        }
    }

    public function fail_page_webhook() {
        $this->add_notice( __('Oups! Payment failed! Please, try later...', 'woocommerce-gateway-dna'), 'error');
        wp_redirect( get_permalink( wc_get_page_id( 'cart' ) ) );
        exit();
    }

    public function init_form_fields(){
        $this->form_fields = get_dnapayments_admin_fields();
    }

    public function payment_scripts() {
        $prefix = $this->is_test_mode ? 'test-' : '';
        
        if ( ! is_cart() && ! is_checkout() && ! isset( $_GET['pay_for_order'] ) ) {
            return;
        }

        if ( 'no' === $this->enabled ) {
            return;
        }

        if ( empty( $this->client_id ) || empty( $this->client_secret ) ) {
            return;
        }

        wp_register_style( 'dna_styles', plugins_url( 'assets/css/dna-payment.css', WC_DNA_MAIN_FILE ), [], WC_DNA_VERSION );
		wp_enqueue_style( 'dna_styles' );

        wp_enqueue_script( 'dna-hosted-fields', 'https://cdn.dnapayments.com/js/hosted-fields/hosted-fields.js' , array('jquery'), WC_DNA_VERSION, true );
        wp_enqueue_script( 'dna-payment-api', 'https://pay.dnapayments.com/checkout/payment-api.js' , array('jquery'), WC_DNA_VERSION, true );
        wp_enqueue_script( 'dna-google-pay', 'https://' . $prefix . 'pay.dnapayments.com/components/google-pay/google-pay-component.js', array('dna-payment-api'), WC_DNA_VERSION, true );
        wp_enqueue_script( 'dna-apple-pay', 'https://' . $prefix . 'pay.dnapayments.com/components/apple-pay/apple-pay-component.js', array('dna-payment-api'), WC_DNA_VERSION, true );
        
        wp_register_script('woocommerce_dna_payment', plugins_url('assets/js/dna-payment.js', WC_DNA_MAIN_FILE), array('jquery', 'dna-hosted-fields', 'dna-google-pay', 'dna-apple-pay', 'dna-payment-api') , WC_DNA_VERSION, true);


        $dna_params = array(
            'is_test_mode' => $this->is_test_mode,
            'integration_type' => $this->integration_type,
            'temp_token' => $this->temp_token(),
            'terminal_id' => $this->terminal,
            'current_currency_code' => get_woocommerce_currency(),
            'available_gateways' => WC()->payment_gateways->get_available_payment_gateways(),
            'cards' => $this->enabled_saved_cards ? WC_DNA_Payments_Order_Client_Helpers::getCardTokens( get_current_user_id(), $this->id ) : []
        );

        wp_localize_script( 'woocommerce_dna_payment', 'wc_dna_params', apply_filters( 'wc_dna_params', $dna_params ) );
        wp_enqueue_script('woocommerce_dna_payment');
    }

    public function validate_fields() {
        if( strlen ( $_POST[ 'billing_country' ]) > 2 ) {
            $this->add_notice(__('Country must be less than 2 symbols', 'woocommerce-gateway-dna' ), 'error');
            return false;
        } else if( strlen ( $_POST[ 'billing_city' ]) > 50 ) {
            $this->add_notice(__ ('City must be less than 50 symbols', 'woocommerce-gateway-dna' ), 'error');
            return false;
        } else if( strlen ( $_POST[ 'billing_address_1' ]) > 50 ) {
            $this->add_notice( __('Address must be less than 50 symbols', 'woocommerce-gateway-dna' ), 'error');
            return false;
        }  else if( strlen ( $_POST[ 'billing_email' ]) > 256 ) {
            $this->add_notice( __('Email must be less than 256 symbols', 'woocommerce-gateway-dna' ), 'error');
            return false;
        } else if( strlen ( $_POST[ 'billing_last_name' ]) > 32 ) {
            $this->add_notice(__('Lastname must be less than 32 symbols', 'woocommerce-gateway-dna' ), 'error');
            return false;
        } else if( strlen ( $_POST[ 'billing_first_name' ]) > 32 ) {
            $this->add_notice(__( 'Firstname must be less than 32 symbols', 'woocommerce-gateway-dna' ), 'error');
            return false;
        } else if( strlen ( $_POST[ 'billing_postcode' ]) > 13 ) {
            $this->add_notice(__('Postcode must be less than 13 symbols', 'woocommerce-gateway-dna' ), 'error');
            return false;
        }

        return true;
    }

    public function isAbsolute($url)
    {
        $pattern = "/^(?:ftp|https?|feed):\/\/(?:(?:(?:[\w\.\-\+!$&'\(\)*\+,;=]|%[0-9a-f]{2})+:)*
    (?:[\w\.\-\+%!$&'\(\)*\+,;=]|%[0-9a-f]{2})+@)?(?:
    (?:[a-z0-9\-\.]|%[0-9a-f]{2})+|(?:\[(?:[0-9a-f]{0,4}:)*(?:[0-9a-f]{0,4})\]))(?::[0-9]+)?(?:[\/|\?]
    (?:[\w#!:\.\?\+=&@$'~*,;\/\(\)\[\]\-]|%[0-9a-f]{2})*)?$/xi";

        return (bool) preg_match($pattern, $url);
    }

    public function getBackLink($order) {
        $backLink = $this->get_option( 'backLink' );
        if (empty($backLink)) {
            return $this->get_return_url( $order );
        } elseif (!$this->isAbsolute($backLink)) {
            return get_site_url(null, $backLink);
        }
        return $backLink;
    }

    public function getFailureBackLink() {
        $failureBackLink = $this->get_option( 'failureBackLink' );
        if (empty($failureBackLink)) {
            return get_rest_url(null, 'dnapayments/failure-page');
        } elseif (!$this->isAbsolute($failureBackLink)) {
            return get_site_url(null, $failureBackLink);
        }
        return $failureBackLink;
    }

    public function getAuthData(WC_Abstract_order $order) {
        return array(
            'client_id' => $this->client_id,
            'client_secret' => $this->client_secret,
            'terminal' => $this->terminal,
            'invoiceId' => strval($order->get_order_number()),
            'amount' => floatval($order->get_total()),
            'currency' => $order->get_currency()
        );
    }

    public function process_payment( $order_id ) {
        global $woocommerce;
        $order = wc_get_order( $order_id );

        try {
            \DNAPayments\DNAPayments::configure($this->get_config());
            $auth = \DNAPayments\DNAPayments::auth($this->getAuthData($order));
        } catch (Error $e) {
            return array(
                'result' => 'failure',
                'messages' => [
                    __('Invalid auth data', 'woocommerce-gateway-dna')
                 ]
            );
        }

        $isForcePayment = !WC_DNA_Payments_Order_Client_Helpers::isPaypalLineItemsValid($order);
        $orderLines = WC_DNA_Payments_Order_Client_Helpers::getOrderLines($order, $isForcePayment);
        $transactionType = $this->get_option('transactionType');

        $order->update_meta_data('save_payment_method_requested', $this->save_payment_method_requested() ? 'yes' : 'no');
        $order->save();

        $paymentData = [
            'invoiceId' => strval($order->get_order_number()),
            'description' => $this->get_option('gatewayOrderDescription'),
            'amount' => floatval($order->get_total()),
            'currency' => $order->get_currency(),
            'language' => 'en-gb',
            'paymentSettings' => [
                'terminalId' => $this->terminal,
                'returnUrl' => $this->getBackLink($order),
                'failureReturnUrl' => $this->getFailureBackLink(),
                'callbackUrl' => add_query_arg( array('orderId' => $order_id), get_rest_url(null, 'dnapayments/success') ),
                'failureCallbackUrl' => add_query_arg( array('orderId' => $order_id), get_rest_url(null, 'dnapayments/failure') )
            ],
            'customerDetails' => [
                'email' => $order->get_billing_email(),
                'accountDetails' => [
                    'accountId' => $order->get_customer_id() ? strval($order->get_customer_id()) : '',
                ],
                'billingAddress' => WC_DNA_Payments_Order_Client_Helpers::getBillingAddress($order),
                'deliveryDetails' => [
                    'deliveryAddress' => WC_DNA_Payments_Order_Client_Helpers::getShippingAddress($order),
                ]
            ],
            'amountBreakdown' => WC_DNA_Payments_Order_Client_Helpers::getAmountBreakdown($order),
            'orderLines' => $orderLines
        ];

        if ( isset($transactionType) && !empty($transactionType) && $transactionType != 'default' ) {
            $paymentData['transactionType'] = $transactionType;
        }

        return array(
            'paymentData' => $paymentData,            
            'auth' => $auth,
            'result' => 'success'
        );

    }

    /**
	 * Payment form on checkout page
	 */
	public function payment_fields() {
		global $wp;
		ob_start();

        $description = $this->get_description();
        if ( $description ) {
            echo wpautop( wptexturize( $description ) );
        }

        if ($this->integration_type == 'hosted-fields') {
            $temp_token = $this->temp_token();

            echo '<div id="wc-' . esc_attr( $this->id ) . '-form" data-token="' . $temp_token . '">';

            $display_tokenization = $this->supports( 'tokenization' ) && is_checkout() && $this->enabled_saved_cards;

            if ( $display_tokenization ) {
                $this->tokenization_script();
                $this->saved_payment_methods();
            }

            $this->elements_form();

            if ( $display_tokenization && ! is_add_payment_method_page() ) {
                $this->save_payment_method_checkbox();
            }

            echo '</div>';
        }

		ob_end_flush();
	}

    public function temp_token() {
        try {
            \DNAPayments\DNAPayments::configure($this->get_config());
            $auth = \DNAPayments\DNAPayments::auth(array(
                'client_id' => $this->client_id,
                'client_secret' => $this->client_secret,
                'terminal' => $this->terminal,
                'invoiceId' => date('d-m-y h:i:s'),
                'amount' => 0,
                'currency' => 'GBP'
            ));

            return $auth['access_token'];
        } catch (Error $e) {
            return null;
        }
    }

    /**
	 * Renders the Hosted fields form.
	 */
	public function elements_form() {
		?>

        <div id="dna-card-cvc-token-container" class="form-row">
            <label for="dna-card-cvc-token"><?php esc_html_e( 'Card code (CVC)', 'woocommerce-gateway-dna' ); ?> <span class="required">*</span></label>
            <div id="dna-card-cvc-token" class="wc-dna-elements-field"></div>
        </div>

		<fieldset id="wc-<?php echo esc_attr( $this->id ); ?>-cc-form" class="wc-credit-card-form wc-payment-form" style="background:transparent;">
			<?php do_action( 'woocommerce_credit_card_form_start', $this->id ); ?>

            <div class="form-row form-row-wide">
                <label for="dna-card-number"><?php esc_html_e( 'Card number', 'woocommerce-gateway-dna' ); ?> <span class="required">*</span></label>

                <div id="dna-card-number" class="wc-dna-elements-field"></div>
            </div>

            <div class="form-row form-row-wide">
                <label for="dna-card-name"><?php esc_html_e( 'Cardholder name', 'woocommerce-gateway-dna' ); ?> <span class="required">*</span></label>

                <div id="dna-card-name" class="wc-dna-elements-field"></div>
            </div>

            <div class="form-row form-row-first">
                <label for="dna-card-exp"><?php esc_html_e( 'Expiry date', 'woocommerce-gateway-dna' ); ?> <span class="required">*</span></label>

                <div id="dna-card-exp" class="wc-dna-elements-field"></div>
            </div>

            <div class="form-row form-row-last">
                <label for="dna-card-cvc"><?php esc_html_e( 'Card code (CVC)', 'woocommerce-gateway-dna' ); ?> <span class="required">*</span></label>
                <div id="dna-card-cvc" class="wc-dna-elements-field"></div>
            </div>

            <div class="clear"></div>

			<?php do_action( 'woocommerce_credit_card_form_end', $this->id ); ?>

            <div class="clear"></div>
		</fieldset>

        <!-- Used to display form errors -->
        <div class="dna-source-errors" role="alert"></div>

		<?php
	}
}
