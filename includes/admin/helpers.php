<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class WC_DNA_Payments_Order_Admin_Helpers {
    public static function isValidStatusPayPalStatus($order): bool {
        $paypalCaptureStatus = $order->get_meta( 'paypal_capture_status', true );

        if(empty($paypalCaptureStatus)) return true;

        return !(
            stripos($paypalCaptureStatus, 'PENDING') !== false ||
            stripos($paypalCaptureStatus, 'CUSTOMER.DISPUTE.CREATED') !== false ||
            stripos($paypalCaptureStatus, 'CUSTOMER.DISPUTE.UPDATED') !== false ||
            stripos($paypalCaptureStatus, 'RISK.DISPUTE.CREATED') !== false
        );
    }

    /**
     * Search for an order with order_number $order_number
     *
     * @param string $order_number order number to search for
     * @return int post_id for the order identified by $order_number, or 0
     */
    public static function findOrderByOrderNumber( $order_number ) {

        // search for the order by custom order number
        $query_args = array(
            'numberposts' => 1,
            'meta_key'    => '_order_number',
            'meta_value'  => $order_number,
            'post_type'   => 'shop_order',
            'post_status' => 'any',
            'fields'      => 'ids',
        );

        $posts            = get_posts( $query_args );
        list( $order_id ) = ! empty( $posts ) ? $posts : null;

        // order was found
        if ( $order_id !== null ) {
            return $order_id;
        }

        // if we didn't find the order, then it may be that this plugin was disabled and an order was placed in the interim
        $order = wc_get_order( $order_number );

        if ( ! $order ) {
            return 0;
        }

        // _order_number was set, so this is not an old order, it's a new one that just happened to have post_id that matched the searched-for order_number
        if ( $order->get_meta( '_order_number', true, 'edit' ) ) {
            return 0;
        }

        return $order->get_id();
    }
}
