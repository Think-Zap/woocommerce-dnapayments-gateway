<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class WC_DNA_Payments_Order_Client_Helpers {
    public static function numberFormat( $price ) {
        return floatval(number_format( $price, 2, '.', '' ));
    }

    public static function round( $price ) {
        $precision = 2;
        return round( $price, $precision );
    }

    public static function isPaypalLineItemsValid( $order ) {
        $negativeItemAmount = false;
        $calculatedTotal     = 0;

        // Products.
        foreach ( $order->get_items( array( 'line_item', 'fee' ) ) as $item ) {
            if ( 'fee' === $item['type'] ) {
                $itemLineTotal   = self::numberFormat( $item['line_total'] );
                $calculatedTotal += $itemLineTotal;
            } else {
                $itemLineTotal   = self::numberFormat( $order->get_item_subtotal( $item, false ) );
                $calculatedTotal += $itemLineTotal * $item->get_quantity();
            }

            if ( $itemLineTotal < 0 ) {
                $negativeItemAmount = true;
            }
        }

        $mismatched_totals = self::numberFormat( $calculatedTotal + $order->get_total_tax() + self::round( $order->get_shipping_total() ) - self::round( $order->get_total_discount() ) ) !== self::numberFormat( $order->get_total() );
        return ! $negativeItemAmount && ! $mismatched_totals;
    }

    /**
     * Limit length of an arg.
     *
     * @param  string  $string Argument to limit.
     * @param  integer $limit Limit size in characters.
     * @return string
     */
    protected function limitLength( $string, $limit = 127 ) {
        $str_limit = $limit - 3;
        if ( function_exists( 'mb_strimwidth' ) ) {
            if ( mb_strlen( $string ) > $limit ) {
                $string = mb_strimwidth( $string, 0, $str_limit ) . '...';
            }
        } else {
            if ( strlen( $string ) > $limit ) {
                $string = substr( $string, 0, $str_limit ) . '...';
            }
        }
        return $string;
    }


    /**
     * Get order item names as a string.
     *
     * @param  WC_Order $order Order object.
     * @return string
     */
    protected function getOrderItemNames( $order ) {
        $item_names = array();

        foreach ( $order->get_items() as $item ) {
            $item_name = $item->get_name();
            $item_meta = wp_strip_all_tags(
                wc_display_item_meta(
                    $item,
                    array(
                        'before'    => '',
                        'separator' => ', ',
                        'after'     => '',
                        'echo'      => false,
                        'autop'     => false,
                    )
                )
            );

            if ( $item_meta ) {
                $item_name .= ' (' . $item_meta . ')';
            }

            $item_names[] = $item_name . ' x ' . $item->get_quantity();
        }

        return apply_filters( 'woocommerce_paypal_get_order_item_names', implode( ', ', $item_names ), $order );
    }

    public static function getAmountBreakdown(WC_Abstract_order $order) {
        return array(
            'itemTotal' => array('totalAmount' => self::numberFormat($order->get_subtotal())),
            'shipping' => array('totalAmount' => self::numberFormat($order->get_shipping_total())),
            'taxTotal' => array('totalAmount' => self::numberFormat($order->get_total_tax())),
            'discount' => array('totalAmount' => self::numberFormat($order->get_total_discount()))
        );
    }

    public static function getShippingAddress(WC_Abstract_order $order) {
        if(!$order->needs_shipping_address()) return null;
        $state = $order->get_shipping_state();
        return array(
            'firstName' => $order->get_shipping_first_name(),
            'lastName'  => $order->get_shipping_last_name(),
            'streetAddress1'  => $order->get_shipping_address_1(),
            'streetAddress2'  => $order->get_shipping_address_2(),
            'city'       => $order->get_shipping_city(),
            'region'      => strlen($state) >= 0 && strlen($state) <= 3 ? $state : '',
            'postalCode'   => $order->get_shipping_postcode(),
            'phone'      => self::getShippingPhone($order),
            'country'    => $order->get_shipping_country()
        );
    }

    public static function getShippingPhone(WC_Abstract_order $order) {
        if (version_compare( WC_VERSION, '5.6.0', '<' )) {
            return $order->get_meta('_shipping_phone');
        } else {
            return $order->get_shipping_phone();
        }
    }

    public static function getSingItemOrderLines(WC_Abstract_order $order) {
        return array(
            array(
                'name' => self::limitLength(self::getOrderItemNames($order)),
                'quantity' => 1,
                'unitPrice' => self::numberFormat($order->get_subtotal()),
                'totalAmount' => self::numberFormat($order->get_subtotal())
            )
        );
    }

    public static function getOrderLines(WC_Abstract_order $order, $forceOneItem = false) {
        if($forceOneItem) {
            return self::getSingItemOrderLines($order);
        }
        $orderLines = [];

        foreach ($order->get_items() as $item_id => $item) {
            $total = self::numberFormat($item->get_total());
            $product = $item->get_product();
            $image_id  = $product->get_image_id();
            $image_url = $image_id ? wp_get_attachment_image_url( $image_id, 'full' ) : '';
            
            $orderLines[] = array(
                'reference' => strval($item->get_id()),
                'name' => html_entity_decode( wc_trim_string( $item->get_name() ? wp_strip_all_tags( $item->get_name() ) : __( 'Item', 'woocommerce' ), 127 ), ENT_NOQUOTES, 'UTF-8' ),
                'quantity' => $item->get_quantity(),
                'unitPrice' => self::numberFormat(($item->get_total()/$item->get_quantity())),
                'imageUrl' => $image_url,
                'productUrl' => $product->get_permalink(),
                'totalAmount' => $total
            );
        }

        return $orderLines;
    }

    public static function isDNAPaymentOrder(WC_Order $order): bool {
        return 'dnapayments' === $order->get_payment_method();
    }
}
