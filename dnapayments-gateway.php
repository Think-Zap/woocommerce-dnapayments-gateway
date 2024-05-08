<?php

/*
 * Plugin Name: WooCommerce DNA Payments Gateway
 * Plugin URI: https://www.dnapayments.com
 * Description: Take credit card payments on your store.
 * Author: DNA Payments Integration
 * Author URI: https://www.dnapayments.com
 * Version: 2.3.1
*/

define( 'WC_DNA_PLUGIN_PATH', untrailingslashit( plugin_dir_path( __FILE__ ) ) );
define( 'WC_DNA_MAIN_FILE', __FILE__ );
define( 'WC_DNA_ID', 'dnapayments' );
define( 'WC_DNA_VERSION', '2.3.1' );
define( 'WC_DNA_MIN_PHP_VER', '5.6.0' );
define( 'WC_DNA_MIN_WC_VER', '3.0' );

add_filter( 'woocommerce_payment_gateways', 'dnapayments_add_gateway_class' );
function dnapayments_add_gateway_class( $gateways ) {
	$gateways[] = 'WC_DNA_Payments_Gateway';
    $gateways[] = 'WC_DNA_GooglePay_Payments_Gateway';
    $gateways[] = 'WC_DNA_ApplePay_Payments_Gateway';
	return $gateways;
}

add_action( 'plugins_loaded', 'dnapayments_init_gateway_class' );

/**
 * WooCommerce fallback notice.
 *
 * @since 1.0.1
 * @return string
 */
function woocommerce_dna_missing_wc_notice() {
    echo '<div class="error"><p><strong>' . sprintf( esc_html__( 'DNA Payments require WooCommerce to be installed and active. You can download %s here.', 'woocommerce-gateway-dna' ), '<a href="https://woocommerce.com/" target="_blank">WooCommerce</a>' ) . '</strong></p></div>';
}

/**
 * WooCommerce not supported fallback notice.
 *
 * @since 1.0.1
 * @return string
 */
function woocommerce_dna_wc_not_supported_notice() {
    echo '<div class="error"><p><strong>' . sprintf( esc_html__( 'DNA Payments require WooCommerce %1$s or greater to be installed and active. WooCommerce %2$s is no longer supported.', 'woocommerce-gateway-dna' ), WC_DNA_MIN_WC_VER, WC_VERSION ) . '</strong></p></div>';
}

function woocommerce_dna_php_not_supported_notice()
{
    echo '<div class="error"><p><strong>' . sprintf( esc_html____( 'WooCommerce DNA Payments - The minimum PHP version required for this plugin is %1$s. You are running %2$s.', 'woocommerce-gateway-dna' ), WC_DNA_MIN_PHP_VER, phpversion() ) . '</strong></p></div>';
}


function dnapayments_init_gateway_class() {

    load_plugin_textdomain( 'woocommerce-gateway-dna', false, plugin_basename( dirname( __FILE__ ) ) . '/languages' );

    if ( ! class_exists( 'WooCommerce' ) ) {
        add_action( 'admin_notices', 'woocommerce_dna_missing_wc_notice' );
        return;
    }

    if ( version_compare( WC_VERSION, WC_DNA_MIN_WC_VER, '<' ) ) {
        add_action( 'admin_notices', 'woocommerce_dna_wc_not_supported_notice' );
        return;
    }

    if (version_compare(PHP_VERSION, WC_DNA_MIN_PHP_VER, '<')) {
        add_action('admin_notices', 'woocommerce_dna_php_not_supported_notice');
        return;
    }

    // Add custom dom elements after "Place Order" button
    add_action('woocommerce_review_order_after_submit', 'add_custom_elements');

    function add_custom_elements() {
        echo '<div id="dnapayments_apple_pay_container" style="display: none"></div>' .
            '<div id="dnapayments_google_pay_container" style="display: none"></div>' .
            '<div class="dnapayments-footer" style="display: none"><p>Powered by </p><img src="' . plugins_url('assets/img/dnapayments-logo.svg', WC_DNA_MAIN_FILE) .'" /></div>';
    }

    require_once( WC_DNA_PLUGIN_PATH . '/includes/WC_DNA_Payments_Gateway.php' );
    require_once( WC_DNA_PLUGIN_PATH . '/includes/payment_methods/WC_DNA_Component_Payments_Gateway.php' );
    require_once( WC_DNA_PLUGIN_PATH . '/includes/payment_methods/WC_DNA_GooglePay_Payments_Gateway.php' );
    require_once( WC_DNA_PLUGIN_PATH . '/includes/payment_methods/WC_DNA_ApplePay_Payments_Gateway.php' );
    require_once( WC_DNA_PLUGIN_PATH . '/includes/admin/helpers.php' );
    require_once( WC_DNA_PLUGIN_PATH . '/includes/client/helpers.php' );
    require_once( WC_DNA_PLUGIN_PATH . '/includes/admin/handlers.php' );
}

