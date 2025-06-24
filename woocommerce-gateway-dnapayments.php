<?php
/**
 * Plugin Name: WooCommerce DNA Payments Gateway by Zap
 * Plugin URI: https://www.dnapayments.com
 * Description: Take credit card payments on your store.
 * Version: 3.0.15_ZAP
 *
 * Author: DNA Payments Integration
 * Author URI: https://www.dnapayments.com
 *
 * Text Domain: woocommerce-gateway-dna
 * Domain Path: /languages/
 *
 * Requires at least: 4.2
 * Tested up to: 6.5
 * WC requires at least: 4.8
 * WC tested up to: 9.4
 * Requires PHP: 7.4
 * PHP tested up to: 8.3
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'WC_DNA_PLUGIN_PATH', untrailingslashit( plugin_dir_path( __FILE__ ) ) );
define( 'WC_DNA_MAIN_FILE', __FILE__ );
define( 'WC_DNA_ID', 'dnapayments' );
define( 'WC_DNA_VERSION', '3.0.14' );
define( 'WC_DNA_MIN_PHP_VER', '5.6.0' );
define( 'WC_DNA_MIN_WC_VER', '3.0' );

/**
 * WC DnaPayments payment gateway plugin class.
 *
 * @class WC_DNA_Payments
 */
class WC_DNA_Payments {

	// Main DNA Payments gateway id / name
	public static $id = 'dnapayments';

	// Plugin version
	public static $version = '3.0.14';

	// Wordpress supported min version
	public static $wp_min_version = '';

	// WooCommerce supported min version
	public static $wc_min_version = '';

	// PHP supported min version
	public static $php_min_version = '5.6.0';

	// Text Domain
	public static $text_domain = 'woocommerce-gateway-dna';

	/**
	 * Plugin bootstrapping.
	 */
	public static function init() {

		add_action( 'before_woocommerce_init', array( __CLASS__, 'before_woocommerce_hpos' ) );

		// The init action ensures that all WordPress core functions and hooks are fully loaded, making it safe to load translations.
		add_action( 'init', function() {
			// Load translations
			load_plugin_textdomain( self::$text_domain, false, self::plugin_abspath() . '/languages' );
		} );

		// This hook is used to execute code after all active plugins have fully loaded,
		// ensuring that WooCommerce is loaded before executing WooCommerce-specific code.
		add_action( 'plugins_loaded', array( __CLASS__, 'includes' ), 0 );

		// This hook registers our PHP classes as a WooCommerce payment gateways
		add_filter( 'woocommerce_payment_gateways', array( __CLASS__, 'add_gateway' ) );

		// Registers WooCommerce Blocks integration.
		add_action( 'woocommerce_blocks_loaded', array( __CLASS__, 'woocommerce_gateway_block_support' ) );

		// Add custom dom elements after "Place Order" button (Works only in CLASSIC theme)
		add_action('woocommerce_review_order_after_submit', array( __CLASS__, 'add_custom_elements' ));

		// Change "Thank you" ("Order received") page title when order status failed
		add_filter( 'woocommerce_endpoint_order-received_title', array( __CLASS__, 'custom_woocommerce_endpoint_order_received_title' ), 10, 3 );

		// Change "Thank you" ("Order received") page text when order status failed
		add_filter('woocommerce_thankyou_order_received_text', array( __CLASS__, 'custom_order_received_text' ), 10, 3);
	}

	public static function before_woocommerce_hpos() {
		if ( class_exists( \Automattic\WooCommerce\Utilities\FeaturesUtil::class ) ) {
			\Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility( 'custom_order_tables', __FILE__, true );
		}
	}

	public static function custom_woocommerce_endpoint_order_received_title( $title, $endpoint, $action ) {
		if ($endpoint == 'order-received') {
			global $wp;

			// Order status is sent via query string because the user might be redirected to the thank you page before the status is updated in the database.
			$status = isset($_GET['status']) ? sanitize_text_field($_GET['status']) : '';
			$order_id  = apply_filters( 'woocommerce_thankyou_order_id', absint( $wp->query_vars['order-received'] ) );

			if ($order_id) {
				$order = wc_get_order($order_id);
				if ( ($order && $order->get_status() == 'failed') || ($status == 'failed')) {
					return __( 'Order failed!', WC_DNA_Payments::$text_domain );
				}
			}
		}
		return $title;
	}

	public static function custom_order_received_text($text, $order) {
		$status = isset($_GET['status']) ? sanitize_text_field($_GET['status']) : '';
		if ($order && ($order->get_status() == 'failed' || $status == 'failed')) {
			return __( 'Unfortunately your order cannot be processed as the originating bank/merchant has declined your transaction. Please attempt your purchase again.', WC_DNA_Payments::$text_domain );
		}
		return $text;
	}

	/**
	 * Add the DNA Payments gateways to the list of available gateways.
	 *
	 * @param array
	 */
	public static function add_gateway( $gateways ) {
		$gateways[] = 'WC_DNA_Payments_Gateway';
		$gateways[] = 'WC_Gateway_DNA_GooglePay';
		$gateways[] = 'WC_Gateway_DNA_ApplePay';
		return $gateways;
	}

	/**
	 * Plugin includes.
	 */
	public static function includes() {
		require_once 'includes/class-wc-dna-payments-helpers.php';
		require_once 'includes/admin/helpers.php';
		require_once 'includes/client/helpers.php';
		require_once 'includes/WC_DNA_Payments_Gateway.php';
		require_once 'includes/gateways/class-wc-gateway-dna-base-component.php';
		require_once 'includes/gateways/class-wc-gateway-dna-googlepay.php';
		require_once 'includes/gateways/class-wc-gateway-dna-applepay.php';
		require_once 'includes/admin/handlers.php';
	}

	/**
	 * Plugin url.
	 *
	 * @return string
	 */
	public static function plugin_url() {
		return untrailingslashit( plugins_url( '/', __FILE__ ) );
	}

	/**
	 * Plugin absolute path.
	 *
	 * @return string
	 */
	public static function plugin_abspath() {
		return trailingslashit( plugin_dir_path( __FILE__ ) );
	}

	/**
	 * Registers WooCommerce Blocks integration.
	 */
	public static function woocommerce_gateway_block_support() {
		if ( class_exists( 'Automattic\WooCommerce\Blocks\Payments\Integrations\AbstractPaymentMethodType' ) ) {
			require_once 'includes/blocks/class-wc-gateway-base-dnapayments-blocks-support.php';
			require_once 'includes/blocks/class-wc-gateway-dnapayments-blocks-support.php';
			require_once 'includes/blocks/class-wc-gateway-dnapayments-googlepay-blocks-support.php';
			require_once 'includes/blocks/class-wc-gateway-dnapayments-applepay-blocks-support.php';

			add_action(
				'woocommerce_blocks_payment_method_type_registration',
				function( Automattic\WooCommerce\Blocks\Payments\PaymentMethodRegistry $payment_method_registry ) {
					$payment_method_registry->register( new WC_Gateway_DNA_Payments_Blocks_Support() );
					$payment_method_registry->register( new WC_Gateway_DNA_Payments_GooglePay_Blocks_Support() );
					$payment_method_registry->register( new WC_Gateway_DNA_Payments_ApplePay_Blocks_Support() );
				}
			);
		}
	}

	public static function add_custom_elements() {
		echo '<div class="dnapayments-footer" style="display: none"><p>Powered by </p><img src="' . plugins_url('assets/img/dnapayments-logo.svg', WC_DNA_MAIN_FILE) .'" /></div>';
	}
}

WC_DNA_Payments::init();
