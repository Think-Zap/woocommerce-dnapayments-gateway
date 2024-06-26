<?php

class WC_Gateway_DNA_ApplePay extends WC_Gateway_DNA_Base_Payment_Component {

    public function __construct() {

        $this->id = 'dnapayments_apple_pay';
        $this->icon = '';
        $this->method_title = 'Apple Pay by DNA Payments';

        parent::__construct();
    }
}
