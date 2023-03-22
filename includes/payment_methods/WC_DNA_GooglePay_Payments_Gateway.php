<?php

class WC_DNA_GooglePay_Payments_Gateway extends WC_DNA_Component_Payments_Gateway {

    public function __construct() {

        $this->id = 'dnapayments_google_pay';
        $this->icon = '';
        $this->method_title = 'DNA Payments Google Pay';

        parent::__construct();
    }
}
