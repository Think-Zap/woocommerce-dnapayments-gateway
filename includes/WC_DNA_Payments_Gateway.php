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

        // This action hook saves the settings
        add_action( 'woocommerce_update_options_payment_gateways_' . $this->id, array( $this, 'process_admin_options' ) );
        add_action( 'wp_enqueue_scripts', array( $this, 'payment_scripts') );

        // update order if cart updates (coupon added, shipping address changed)
        add_action('woocommerce_cart_updated', array( $this, 'update_order_after_cart_changes' ));

        add_action( 'rest_api_init', array( $this, 'register_routes' ));
        add_action('wp_ajax_add_card_payment_data', array($this, 'add_card_payment_data'));
        add_action('wp_ajax_get_payment_and_auth_data', array($this, 'get_payment_and_auth_data'));
        add_action('wp_ajax_nopriv_get_payment_and_auth_data', array($this, 'get_payment_and_auth_data'));

        $this->dnaPayment = new DNAPayments\DNAPayments($this->get_config());

        $this->supports = array( 'products', 'refunds' );
        if ( $this->enabled_saved_cards ) {
            array_push($this->supports, 'tokenization' );
        }        
    }

    public function get_config() {
        return [
            'isTestMode' => $this->is_test_mode,
            'scopes' => [
                'allowHosted' => true,
                'allowEmbedded' => in_array($this->integration_type, ['embedded', 'hosted-fields']),
                'allowSeamless' => $this->integration_type == 'hosted-fields'
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
            $logger->error('Code: ' . $e->getCode() . '; Message: ' . $e->getMessage(), [ 'source' => $this->id ]);
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
            if ($order->get_total() == $amount) {
                return $this->process_cancel($order);
            }

            $message = __( 'Partial cancellation of this transaction is not allowed.', 'woocommerce-gateway-dna' );
			throw new Exception( $message );
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
            $logger->error('Code: ' . $e->getCode() . '; Message: ' . $e->getMessage(), [ 'source' => $this->id ]);
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

        register_rest_route( 'dnapayments', 'success-add-card', array(
            'methods'  => WP_REST_Server::CREATABLE,
            'callback' => array( $this, 'success_webhook_add_card'),
            'permission_callback' => '__return_true'
        ) );

        register_rest_route( 'dnapayments', 'failure', array(
            'methods'  => WP_REST_Server::CREATABLE,
            'callback' => array( $this, 'fail_webhook'),
            'permission_callback' => '__return_true'
        ) );

    }

    private function savePayPalOrderDetail(WC_Order $order, $input, $isAddOrderNode) {
        $status = $input['paypalOrderStatus'];
        $capture_status = $input['paypalCaptureStatus'];
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
        $order->update_meta_data( 'paypal_capture_status',  $capture_status);

        if ($reason) {
            $order->update_meta_data( 'paypal_capture_status_reason',  $input['paypalCaptureStatusReason']);
        }
        $order->save();
    }

    public function success_webhook($input) {
        $data = $input->get_params();
        $logger = wc_get_logger();
        $log_source = $this->id;

        try {
            // Validate input
            if (empty($input) || empty($input['invoiceId'])) {
                throw new Exception('Invoice ID is missing or invalid.', 400);
            }

            if (!$input['success']) {
                throw new Exception('Transaction was not successful.', 400);
            }

            if (!$this->dnaPayment::isValidSignature($input, $this->client_secret)) {
                throw new Exception('Invalid signature.', 403);
            }

            // Initialize variables
            $orderId = null;
            $storeCardOnFile = false;

            // Parse merchant custom data
            if (isset($input['merchantCustomData'])) {
                try {
                    $customData = json_decode($input['merchantCustomData']);
                    $orderId = $customData->orderId;
                    $storeCardOnFile = $customData->storeCardOnFile ?? false;
                } catch (Exception $e) {
                    $orderId = null;
                    $logger->warning('Error parsing merchantCustomData: ' . $e->getMessage(), ['source' => $log_source]);
                }
            }

            // Find order ID if not already set
            if (empty($orderId)) {
                $orderId = WC_DNA_Payments_Order_Admin_Helpers::findOrderByOrderNumber($input['invoiceId']);
                if (empty($orderId)) {
                    throw new Exception('Order ID could not be determined for invoiceId: ' . $input['invoiceId'], 400);
                }
            }

            // Fetch order
            $order = wc_get_order($orderId);
            if (!$order) {
                throw new Exception('Order not found for ID: ' . $orderId, 400);
            }
    
            $status = $order->get_status();
            $new_status = 'processing';
    
            $logger->info('Processing success webhook for order ID ' . $orderId . ' with status ' . $status, ['source' => $log_source]);
    
            // Validate order
            if (!WC_DNA_Payments_Order_Client_Helpers::isDNAPaymentOrder($order)) {
                throw new Exception('Order processed by a different payment method: ' . $order->get_payment_method(), 400);
            }
    
            if (!in_array($status, ['pending', 'failed'])) {
                if (!empty($input['paypalCaptureStatus'])) {
                    $this->savePayPalOrderDetail($order, $input, true);
                }
                throw new Exception('Order with ID ' . $orderId . ' is already processed with status: ' . $status, 400);
            }

            // Update order transaction ID
            $order->set_transaction_id($input['id']);

            // Handle settlement
            if ($input['settled']) {
                $order->payment_complete();
                $order->add_order_note(sprintf(__('DNA Payments transaction complete (Transaction ID: %s)', 'woocommerce-gateway-dna'), $input['id']));

                if ('yes' === $this->get_option('enable_order_complete')) {
                    $order->update_status('completed');
                    $new_status = 'completed';
                }
            } else {
                $order->update_status('on-hold');
                $new_status = 'on-hold';
                $order->add_order_note(sprintf(__('DNA Payments awaiting payment completion (Transaction ID: %s)', 'woocommerce-gateway-dna'), $input['id']));
            }

            // Log status change
            $order->add_order_note(sprintf(__('DNA Payments updated order status from %s to %s.', 'woocommerce-gateway-dna'), ucfirst($status), ucfirst($new_status)));
    
            // Update metadata
            $order->update_meta_data('rrn', $input['rrn'] ?? '');
            $order->update_meta_data('payment_method', $input['paymentMethod'] ?? '');
            $order->update_meta_data('is_finished_payment', $input['settled'] ? 'yes' : 'no');
    
            if (!empty($input['paypalCaptureStatus'])) {
                $this->savePayPalOrderDetail($order, $input, false);
            }
    
            // Handle stock reduction
            $manage_stock_option = get_option('woocommerce_manage_stock');
            if ($manage_stock_option !== 'yes' || $status !== 'pending') {
                $order->reduce_order_stock();
                $order->add_order_note(sprintf(__('DNA Payments reduced order stock (Transaction ID: %s)', 'woocommerce-gateway-dna'), $input['id']));
            }
    
            $order->save();
            $logger->info('Processed success webhook for order ID ' . $orderId . ' with status ' . $status, ['source' => $log_source]);
    
            // Handle saving card tokens
            if ($this->enabled_saved_cards && ($order->get_meta('save_payment_method_requested', true) === 'yes' || $input['storeCardOnFile'] || $storeCardOnFile)) {
                WC_DNA_Payments_Order_Client_Helpers::saveCardToken($input, $this->id);
                $logger->info('Card token saved for order ID ' . $orderId, ['source' => $log_source]);
            }

            return rest_ensure_response([
                'success' => true,
                'message' => 'Success webhook processed successfully.',
            ]);
        } catch (Exception $e) {
            $logger->error('Error in success_webhook: ' . $e->getMessage(), ['source' => $log_source]);
            $logger->error('Input: ' . json_encode($data), ['source' => $log_source]);
            $logger->error('Stack trace: ' . $e->getTraceAsString(), ['source' => $log_source]);
            
            // Respond with the error message and code
            return new WP_Error(
                $this->id . '_error',
                $e->getMessage(),
                array(
                    'status' => $e->getCode() ? $e->getCode() : 500,
                    'stack_trace' => $e->getTraceAsString(),
                )
            );
        }
    }

    public function fail_webhook( WP_REST_Request $input ) {
        $data = $input->get_params();
        $logger = wc_get_logger();
        $log_source = $this->id;

        try {
            // Validate input
            if (empty($input) || empty($input['invoiceId'])) {
                throw new Exception('Invoice ID is missing or invalid.', 400);
            }

            if ($input['success']) {
                throw new Exception('Transaction was successful.', 400);
            }

            if (!$this->dnaPayment::isValidSignature($input, $this->client_secret)) {
                throw new Exception('Invalid signature.', 403);
            }

            // Initialize variables
            $orderId = null;
            $storeCardOnFile = false;

            // Parse merchant custom data
            if (isset($input['merchantCustomData'])) {
                try {
                    $customData = json_decode($input['merchantCustomData']);
                    $orderId = $customData->orderId;
                    $storeCardOnFile = $customData->storeCardOnFile ?? false;
                } catch (Exception $e) {
                    $orderId = null;
                    $logger->warning('Error parsing merchantCustomData: ' . $e->getMessage(), ['source' => $log_source]);
                }
            }

            // Find order ID if not already set
            if (empty($orderId)) {
                $orderId = WC_DNA_Payments_Order_Admin_Helpers::findOrderByOrderNumber($input['invoiceId']);
                if (empty($orderId)) {
                    throw new Exception('Order ID could not be determined for invoiceId: ' . $input['invoiceId'], 400);
                }
            }

            // Fetch order
            $order = wc_get_order($orderId);
            if (!$order) {
                throw new Exception('Order not found for ID: ' . $orderId, 400);
            }

            if(!empty($input['paypalCaptureStatus'])) {
                $this->savePayPalOrderDetail($order, $input, false);
            }
            
            if ($order->get_status() !== 'pending') {
                throw new Exception('Order with ID ' . $orderId . ' is already processed with status: ' . $order->get_status(), 400);
            }

            $order->update_status('failed', 'Payment failed');
            $order->save();
        
            return rest_ensure_response([
                'success' => true,
                'message' => 'Failure webhook processed successfully.',
            ]);
        } catch (Exception $e) {
            $logger->error('Error in fail_webhook: ' . $e->getMessage(), ['source' => $log_source]);
            $logger->error('Input: ' . json_encode($data), ['source' => $log_source]);
            $logger->error('Stack trace: ' . $e->getTraceAsString(), ['source' => $log_source]);
            
            // Respond with the error message and code
            return new WP_Error(
                $this->id . '_error',
                $e->getMessage(),
                array(
                    'status' => $e->getCode() ? $e->getCode() : 500,
                    'stack_trace' => $e->getTraceAsString(),
                )
            );
        }
    }

    public function success_webhook_add_card( WP_REST_Request $input ) {
        $data = $input->get_params();
        $logger = wc_get_logger();
        $log_source = $this->id;

        try {
            // Validate input
            if (empty($input)) {
                throw new Exception('Input data is empty.', 400);
            }

            if (!$input['success']) {
                throw new Exception('Transaction was not successful.', 400);
            }

            if (!$this->dnaPayment::isValidSignature($input, $this->client_secret)) {
                throw new Exception('Invalid signature.', 403);
            }

            WC_DNA_Payments_Order_Client_Helpers::saveCardToken( $input, $this->id );

            return rest_ensure_response([
                'success' => true,
                'message' => 'Add card webhook processed successfully.',
            ]);
        } catch (Exception $e) {
            $logger->error('Error in success_webhook_add_card: ' . $e->getMessage(), ['source' => $log_source]);
            $logger->error('Input: ' . json_encode($data), ['source' => $log_source]);
            $logger->error('Stack trace: ' . $e->getTraceAsString(), ['source' => $log_source]);
            
            // Respond with the error message and code
            return new WP_Error(
                $this->id . '_error',
                $e->getMessage(),
                array(
                    'status' => $e->getCode() ? $e->getCode() : 500,
                    'stack_trace' => $e->getTraceAsString(),
                )
            );
        }
    }

    public function add_notice($message, $notice_type = 'success', $data = array()) {
        if(function_exists('wc_add_notice')) {
            wc_add_notice($message, $notice_type, $data);
        }
    }

    public function init_form_fields(){
        $this->form_fields = get_dnapayments_admin_fields();
    }

    public function get_settings_for_frontend() {
        $current_user_id = get_current_user_id();
        $is_guest = !isset($current_user_id) || empty($current_user_id) || $current_user_id === '0';

        return array(
            'is_test_mode' => $this->is_test_mode,
            'integration_type' => $this->integration_type,
            'temp_token' => $this->temp_token(),
            'terminal_id' => $this->terminal,
            'current_currency_code' => get_woocommerce_currency(),
            'available_gateways' => WC()->payment_gateways->get_available_payment_gateways(),
            'allow_saving_cards' => $this->enabled_saved_cards && !$is_guest,
            'send_callback_every_failed_attempt' => $this->get_option( 'failed_attempts_limit' ),
            'cards' => WC_DNA_Payments_Order_Client_Helpers::getCardTokens( $current_user_id, $this->id )
        );
    }

    public function payment_scripts() {
        $prefix = $this->is_test_mode ? 'test-' : '';
        $current_user_id = get_current_user_id();
        $is_guest = !isset($current_user_id) || empty($current_user_id) || $current_user_id === '0';

        wp_register_script( 'dna-payment-api', 'https://' . $prefix . 'pay.dnapayments.com/checkout/payment-api.js' , array(), WC_DNA_VERSION, true );
        wp_register_script( 'dna-hosted-fields', 'https://' . $prefix . 'cdn.dnapayments.com/js/hosted-fields/hosted-fields.js' , array(), WC_DNA_VERSION, true );
        wp_register_script( 'dna-google-pay', 'https://' . $prefix . 'pay.dnapayments.com/components/google-pay/google-pay-component.js', array('dna-payment-api'), WC_DNA_VERSION, true );
        wp_register_script( 'dna-apple-pay', 'https://' . $prefix . 'pay.dnapayments.com/components/apple-pay/apple-pay-component.js', array('dna-payment-api'), WC_DNA_VERSION, true );
        
        if ( ! is_cart() && ! is_checkout() && ! isset( $_GET['pay_for_order'] ) && ! is_add_payment_method_page()) {
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


        if (is_add_payment_method_page()) {
            wp_register_script('woocommerce_dna_payment', plugins_url('assets/js/dna-add-payment-method.js', WC_DNA_MAIN_FILE), array('jquery', 'dna-payment-api', 'dna-hosted-fields') , WC_DNA_VERSION, true);

            $dna_params = array(
                'is_test_mode' => $this->is_test_mode,
                'integration_type' => $this->integration_type,
                'allowSavingCards' => $this->enabled_saved_cards && !$is_guest,
                'cards' => $this->enabled_saved_cards ? WC_DNA_Payments_Order_Client_Helpers::getCardTokens( $current_user_id, $this->id ) : []
            );
        } else {            
            wp_register_script('woocommerce_dna_payment', plugins_url('assets/js/dna-payment.js', WC_DNA_MAIN_FILE), array('jquery', 'dna-hosted-fields', 'dna-google-pay', 'dna-apple-pay', 'dna-payment-api') , WC_DNA_VERSION, true);

            $dna_params = array(
                'is_test_mode' => $this->is_test_mode,
                'integration_type' => $this->integration_type,
                'temp_token' => $this->temp_token(),
                'terminal_id' => $this->terminal,
                'order_id' => absint(get_query_var('order-pay')),
                'session_order_id' => WC()->session->get('order_awaiting_payment'),
                'current_currency_code' => get_woocommerce_currency(),
                'available_gateways' => array_keys(WC()->payment_gateways->get_available_payment_gateways()),
                'allowSavingCards' => $this->enabled_saved_cards && !$is_guest,
                'send_callback_every_failed_attempt' => $this->get_option( 'failed_attempts_limit' ),
                'cards' => $this->enabled_saved_cards ? WC_DNA_Payments_Order_Client_Helpers::getCardTokens( $current_user_id, $this->id ) : []
            );
        }        

        wp_localize_script( 'woocommerce_dna_payment', 'wc_dna_params', apply_filters( 'wc_dna_params', $dna_params ) );
        wp_enqueue_script('woocommerce_dna_payment');
    }

    public function validate_fields() {

        // Check if this is the Pay for Order page
        if (isset($_GET['pay_for_order']) && isset($_GET['key'])) {
            // Skip validation on Pay for Order page
            return true;
        }
        
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

    public function getBackLink($order, $is_failure = false) {
        $backLink = $this->get_option( $is_failure ? 'failureBackLink' : 'backLink' );
        if (empty($backLink)) {
            $return_url = $this->get_return_url( $order );
            return $is_failure ? add_query_arg( 'status', 'failed', $return_url ) : $return_url;

        } elseif (!$this->isAbsolute($backLink)) {
            return get_site_url(null, $backLink);
        }
        return $backLink;
    }

    public function process_payment( $order_id ) {
        global $woocommerce;

        $order = wc_get_order( $order_id );

        $response = $this->get_payment_and_auth_data_from_order( $order_id );

        if ( $response['result'] == 'success' ) {

            $response['paymentData'] = json_encode($response['paymentData']);
            $response['auth'] = json_encode($response['auth']);

            $order->update_meta_data('save_payment_method_requested', $this->save_payment_method_requested() ? 'yes' : 'no');
            $order->save();    
        }

        return $response;
    }

    public function add_card_payment_data() {

        $user_id    = get_current_user_id();
        $meta       = get_user_meta($user_id);
        $invoice_id = date('d-m-y h:i:s');
        $auth       = $this->get_auth_data($invoice_id, 0, 'GBP');

        function get_return_url($success) {
            $result = $success ? 'success' : 'failure';
            return get_site_url( null, add_query_arg( array('result' => $result), 'my-account/payment-methods' ) );
        }

        function get_field($meta, $field) {
            if ( isset( $meta [ $field ] ) ) {
                return $meta [ $field ][0];
            }
            return '';
        }

        function get_address($meta, $prefix) {
            return array(
                'firstName'     => get_field( $meta, $prefix . '_first_name' ),
                'lastName'      => get_field( $meta, $prefix . '_last_name' ),
                'addressLine1'  => get_field( $meta, $prefix . '_address_1' ),
                'addressLine2'  => get_field( $meta, $prefix . '_address_2' ),
                'city'          => get_field( $meta, $prefix . '_city' ),
                'postalCode'    => get_field( $meta, $prefix . '_postcode' ),
                'phone'         => get_field( $meta, $prefix . '_phone' ),
                'country'       => get_field( $meta, $prefix . '_country' ), 
            );
        }

        $paymentData = [
            'transactionType'   => 'VERIFICATION',
            'invoiceId'         => $invoice_id,
            'description'       => 'Add card to ' . get_bloginfo('name'),
            'amount'            => 0,
            'currency'          => 'GBP',
            'language'          => 'en-gb',
            'paymentSettings' => [
                'terminalId'        => $this->terminal,
                'returnUrl'         => get_return_url(true),
                'failureReturnUrl'  => get_return_url(false),
                'callbackUrl'       => get_rest_url(null, 'dnapayments/success-add-card')
            ],
            'customerDetails' => [
                'email'             => get_field( $meta, 'billing_email' ),
                'accountDetails' => [
                    'accountId'     => strval($user_id)
                ],
                'billingAddress'    => get_address($meta, 'billing'),
                'deliveryDetails' => [
                    'deliveryAddress' => get_address($meta, 'shipping'),
                ]
            ]
        ];

        echo json_encode(array(
            'paymentData'   => $paymentData,            
            'auth'          => $auth,
            'result'        => is_null($auth['access_token']) ? 'failure' : 'success'
        ));

        wp_die();
    }

    public function get_payment_and_auth_data() {
        global $woocommerce;

        $order_id       = $_POST['order_id'];
        $total_amount   = $_POST['total'];

        wp_send_json( $this->get_payment_and_auth_data_from_order( $order_id, $total_amount ) );

        wp_die();
    }

    public function get_payment_and_auth_data_from_order($order_id, $total_amount = null) {
        global $woocommerce;

        $order = wc_get_order( $order_id );

        if (empty($total_amount)) {
            $total_amount = floatval($order->get_total());
        }

        $auth = $this->get_auth_data(
            strval( $order->get_order_number() ),
            floatval( $total_amount ),
            $order->get_currency()
        );

        if ($auth['access_token'] == null) {
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

        $paymentData = [
            'invoiceId' => strval($order->get_order_number()),
            'description' => $this->get_option('gatewayOrderDescription'),
            'amount' => floatval($total_amount),
            'currency' => $order->get_currency(),
            'language' => 'en-gb',
            'paymentSettings' => [
                'terminalId' => $this->terminal,
                'returnUrl' => $this->getBackLink($order),
                'failureReturnUrl' => $this->getBackLink($order, true),
                'callbackUrl' => get_rest_url(null, 'dnapayments/success'),
                'failureCallbackUrl' => get_rest_url(null, 'dnapayments/failure')
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
            'orderLines' => $orderLines,
            'merchantCustomData' => json_encode(array(
                'orderId' => $order_id
            ))
        ];

        if ( isset($transactionType) && !empty($transactionType) && $transactionType != 'default' ) {
            $paymentData['transactionType'] = $transactionType;
        }

        return array(
            'result'        => 'success',
            'paymentData'   => $paymentData,
            'auth'          => $auth
        );
    }

    /**
	 * Payment form on checkout page
	 */
	public function payment_fields() {
		global $wp;
		ob_start();

        $cart = WC()->cart;
        $total = $cart->is_empty() ? [ 'total' => 0 ] : $cart->get_totals();

        echo '<div id="wc-' . esc_attr( $this->id ) . '-totals"  data-totals="' . htmlspecialchars(json_encode($total), ENT_QUOTES, 'UTF-8') . '"></div>';

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

    public function get_auth_data($invoiceId, $amount, $currency) {
        try {
            \DNAPayments\DNAPayments::configure($this->get_config());
            $auth = \DNAPayments\DNAPayments::auth(array(
                'client_id' => $this->client_id,
                'client_secret' => $this->client_secret,
                'terminal' => $this->terminal,
                'invoiceId' => $invoiceId,
                'amount' => $amount,
                'currency' => $currency
            ));

            return $auth;
        } catch (Error $e) {
            return array(
                'access_token' => null
            );
        }
    }

    public function temp_token() {
        return $this->get_auth_data(date('d-m-y h:i:s'), 0, 'GBP')['access_token'];
    }

    /**
	 * Renders the Hosted fields form.
	 */
	public function elements_form() {
		?>

        <div id="dna-card-cvc-token-container" class="form-row" style="display: none">
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

    public function update_order_after_cart_changes() {
        $order_id = WC()->session->get('order_awaiting_payment');
        $order = $order_id ? wc_get_order($order_id) : null;

        if ($order) {
            // Update shipping, discounts, and total
            $order->set_shipping_total(WC()->cart->get_shipping_total());
            $order->set_discount_total(WC()->cart->get_discount_total());
            $order->set_total(WC()->cart->get_total());

            $order->save();
        }    
    }
}
