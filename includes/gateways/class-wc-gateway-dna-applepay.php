<?php

class WC_Gateway_DNA_ApplePay extends WC_Gateway_DNA_Base_Payment_Component {

    public function __construct() {

        $this->id = 'dnapayments_apple_pay';
        $this->icon = WC_DNA_Payments::plugin_url() . '/assets/img/applepay.svg';
        $this->method_title = 'Apple Pay';

        parent::__construct();
    }
}
