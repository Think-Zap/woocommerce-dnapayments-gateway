<?php

class WC_Gateway_DNA_GooglePay extends WC_Gateway_DNA_Base_Payment_Component {

    public function __construct() {

        $this->id = 'dnapayments_google_pay';
        $this->icon = '';
        $this->method_title = 'Google Pay by DNA Payments';

        parent::__construct();
    }
}
