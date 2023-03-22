<?php

class WC_DNA_ApplePay_Payments_Gateway extends WC_DNA_Component_Payments_Gateway {

    public function __construct() {

        $this->id = 'dnapayments_apple_pay';
        $this->icon = '';
        $this->method_title = 'DNA Payments Apple Pay';

        parent::__construct();
    }
}
