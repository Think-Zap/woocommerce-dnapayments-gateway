/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./client/blocks/components/error-message.js":
/*!***************************************************!*\
  !*** ./client/blocks/components/error-message.js ***!
  \***************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ErrorMessage: () => (/* binding */ ErrorMessage)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);

const errorNoticeClass = 'wc-block-components-notice-banner is-error';
const ErrorMessage = ({
  messages = []
}) => {
  return messages.map((message, i) => (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)("div", {
    className: errorNoticeClass,
    key: i
  }, message));
};

/***/ }),

/***/ "./client/blocks/components/payment-component.js":
/*!*******************************************************!*\
  !*** ./client/blocks/components/payment-component.js ***!
  \*******************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   PaymentComponent: () => (/* binding */ PaymentComponent)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/element */ "@wordpress/element");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/i18n */ "@wordpress/i18n");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _constants__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../constants */ "./client/blocks/constants.js");
/* harmony import */ var _error_message__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./error-message */ "./client/blocks/components/error-message.js");
/* harmony import */ var _utils_fetch_payment_and_auth_data__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../utils/fetch_payment_and_auth_data */ "./client/blocks/utils/fetch_payment_and_auth_data.js");
/* harmony import */ var _utils_log__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../utils/log */ "./client/blocks/utils/log.js");
/* harmony import */ var _utils_place_order_button__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../utils/place-order-button */ "./client/blocks/utils/place-order-button.js");








const PaymentComponent = ({
  containerId,
  componentInstance,
  gatewayId,
  errorMessage,
  props
}) => {
  const {
    components: {
      LoadingMask
    }
  } = props;
  const [loadingState, setLoadingState] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useState)('idle');
  const [messages, setMessages] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useState)([]);

  // pay button container
  const containerRef = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useRef)();
  // process payment result
  const paymentResultRef = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useRef)();
  const {
    emitResponse,
    eventRegistration: {
      onPaymentSetup
    }
  } = props;
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useEffect)(() => {
    const handler = async () => {
      if (paymentResultRef.current?.success) {
        return {
          type: emitResponse.responseTypes.SUCCESS,
          meta: {
            paymentMethodData: {
              [`wc-${gatewayId}-result`]: JSON.stringify(paymentResultRef.current)
            }
          }
        };
      }
      return {
        type: emitResponse.responseTypes.ERROR,
        message: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Your payment proccess has been failed.', _constants__WEBPACK_IMPORTED_MODULE_3__.TEXT_DOMAIN),
        messageContext: emitResponse.noticeContexts.PAYMENTS
      };
    };
    return onPaymentSetup(handler);
  }, [onPaymentSetup, emitResponse]);
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useEffect)(() => {
    const setupIntegration = async () => {
      setLoadingState('loading');
      const {
        paymentData,
        auth
      } = await (0,_utils_fetch_payment_and_auth_data__WEBPACK_IMPORTED_MODULE_5__.fetchPaymentAndAuthData)(props);
      paymentResultRef.current = null;
      componentInstance.create(containerRef.current, paymentData, {
        onClick: () => {
          setLoadingState('loading');
        },
        onPaymentSuccess: result => {
          setLoadingState('done');
          (0,_utils_log__WEBPACK_IMPORTED_MODULE_6__.logData)('onPaymentSuccess', result);
          paymentResultRef.current = result;
          (0,_utils_place_order_button__WEBPACK_IMPORTED_MODULE_7__.triggerPlaceOrderButtonClick)();
        },
        onCancel: () => {
          setLoadingState('done');
        },
        onError: err => {
          (0,_utils_log__WEBPACK_IMPORTED_MODULE_6__.logError)('onError', err);
          let message = err.message || (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Your card has not been authorised, please check the details and retry or contact your bank.', _constants__WEBPACK_IMPORTED_MODULE_3__.TEXT_DOMAIN);
          if (errorMessage && (err.code === 1002 ||
          // Failed to initialize the Google / Apple Pay button
          err.code === 1003) // Failed to validate the Google / Apple Pay button
          ) {
            message = errorMessage;
          }
          setLoadingState('failed');
          setMessages([message]);
        },
        onLoad: () => {
          setLoadingState('done');
        }
      }, auth.access_token);
    };
    if (containerRef.current && componentInstance) {
      setupIntegration();
    }
  }, [componentInstance, containerRef, props.billing.cartTotal.value]);

  // if payment gateway selected, disable place order button
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useEffect)(() => {
    (0,_utils_place_order_button__WEBPACK_IMPORTED_MODULE_7__.setPlaceOrderButtonDisabled)(true);
    return () => (0,_utils_place_order_button__WEBPACK_IMPORTED_MODULE_7__.setPlaceOrderButtonDisabled)(false);
  }, []);
  return (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)(react__WEBPACK_IMPORTED_MODULE_0__.Fragment, null, (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)(_error_message__WEBPACK_IMPORTED_MODULE_4__.ErrorMessage, {
    messages: messages
  }), (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)(LoadingMask, {
    isLoading: loadingState === 'loading',
    showSpinner: true
  }, (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)("div", {
    ref: containerRef,
    id: containerId
  })));
};

/***/ }),

/***/ "./client/blocks/constants.js":
/*!************************************!*\
  !*** ./client/blocks/constants.js ***!
  \************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   CONTAINER_IDS: () => (/* binding */ CONTAINER_IDS),
/* harmony export */   GATEWAY_ID: () => (/* binding */ GATEWAY_ID),
/* harmony export */   GATEWAY_ID_APPLE_PAY: () => (/* binding */ GATEWAY_ID_APPLE_PAY),
/* harmony export */   GATEWAY_ID_CREDIT_CARD: () => (/* binding */ GATEWAY_ID_CREDIT_CARD),
/* harmony export */   GATEWAY_ID_GOOGLE_PAY: () => (/* binding */ GATEWAY_ID_GOOGLE_PAY),
/* harmony export */   HOSTED_FIELD_IDS: () => (/* binding */ HOSTED_FIELD_IDS),
/* harmony export */   TEXT_DOMAIN: () => (/* binding */ TEXT_DOMAIN)
/* harmony export */ });
const GATEWAY_ID = 'dnapayments';
const GATEWAY_ID_GOOGLE_PAY = 'dnapayments_google_pay';
const GATEWAY_ID_APPLE_PAY = 'dnapayments_apple_pay';
const GATEWAY_ID_CREDIT_CARD = 'dnapayments_credit_card';
const TEXT_DOMAIN = 'woocommerce-gateway-dna';
const HOSTED_FIELD_IDS = {
  number: `wc-${GATEWAY_ID}-card-number-hosted`,
  name: `wc-${GATEWAY_ID}-card-name-hosted`,
  expDate: `wc-${GATEWAY_ID}-expiry-hosted`,
  cvv: `wc-${GATEWAY_ID}-csc-hosted`,
  cvvToken: `wc-${GATEWAY_ID}-csc-token-hosted`,
  threeDS: 'three-d-secure'
};
const CONTAINER_IDS = {
  googlepay: 'dnapayments_google_pay_container',
  applepay: 'dnapayments_apple_pay_container'
};

/***/ }),

/***/ "./client/blocks/utils/fetch_payment_and_auth_data.js":
/*!************************************************************!*\
  !*** ./client/blocks/utils/fetch_payment_and_auth_data.js ***!
  \************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   fetchPaymentAndAuthData: () => (/* binding */ fetchPaymentAndAuthData)
/* harmony export */ });
/* harmony import */ var _get_payment_data__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./get_payment_data */ "./client/blocks/utils/get_payment_data.js");

async function fetchPaymentAndAuthData(props) {
  const paymentData = (0,_get_payment_data__WEBPACK_IMPORTED_MODULE_0__.getPaymentData)(props);
  const formData = new FormData();
  formData.append('order_id', paymentData.invoiceId);
  formData.append('total', paymentData.amount);
  const response = await fetch('/wp-admin/admin-ajax.php?action=get_payment_and_auth_data', {
    method: 'POST',
    body: formData
  });
  const result = await response.json();
  return {
    auth: result.auth,
    paymentData: {
      ...result.paymentData,
      ...paymentData,
      invoiceId: result.paymentData.invoiceId,
      paymentSettings: result.paymentData.paymentSettings
    }
  };
}

/***/ }),

/***/ "./client/blocks/utils/get_payment_data.js":
/*!*************************************************!*\
  !*** ./client/blocks/utils/get_payment_data.js ***!
  \*************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getAddress: () => (/* binding */ getAddress),
/* harmony export */   getAmount: () => (/* binding */ getAmount),
/* harmony export */   getOrderId: () => (/* binding */ getOrderId),
/* harmony export */   getPaymentData: () => (/* binding */ getPaymentData)
/* harmony export */ });
/* harmony import */ var _wordpress_data__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/data */ "@wordpress/data");
/* harmony import */ var _wordpress_data__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_data__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _get_settings__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./get_settings */ "./client/blocks/utils/get_settings.js");


function getPaymentData(props) {
  const {
    billing,
    shippingData
  } = props;
  const {
    terminalId
  } = (0,_get_settings__WEBPACK_IMPORTED_MODULE_1__.getDnaPaymentsSettingsData)();
  return {
    invoiceId: getOrderId(),
    amount: getAmount(billing.cartTotal.value, props),
    customerDetails: {
      email: billing.billingAddress.email,
      accountDetails: {
        accountId: billing.customerId ? String(billing.customerId) : undefined
      },
      billingAddress: getAddress(billing.billingAddress),
      deliveryDetails: {
        deliveryAddress: getAddress(shippingData.shippingAddress)
      }
    },
    paymentSettings: {
      terminalId
    }
  };
}
function getAmount(amount, {
  billing
}) {
  return amount / 10 ** billing.currency.minorUnit;
}
function getAddress(address) {
  return {
    firstName: address.first_name,
    lastName: address.last_name,
    addressLine1: address.address_1,
    addressLine2: address.address_2,
    city: address.city,
    postalCode: address.postcode,
    phone: address.phone,
    country: address.country
  };
}
function getOrderId() {
  const {
    CHECKOUT_STORE_KEY
  } = window.wc.wcBlocksData;
  const store = (0,_wordpress_data__WEBPACK_IMPORTED_MODULE_0__.select)(CHECKOUT_STORE_KEY);
  return store.getOrderId();
}

/***/ }),

/***/ "./client/blocks/utils/get_settings.js":
/*!*********************************************!*\
  !*** ./client/blocks/utils/get_settings.js ***!
  \*********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getDnaPaymentsSettingsData: () => (/* binding */ getDnaPaymentsSettingsData)
/* harmony export */ });
/* harmony import */ var _woocommerce_settings__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @woocommerce/settings */ "@woocommerce/settings");
/* harmony import */ var _woocommerce_settings__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_woocommerce_settings__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _constants__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../constants */ "./client/blocks/constants.js");


const getDnaPaymentsSettingsData = () => {
  const settings = (0,_woocommerce_settings__WEBPACK_IMPORTED_MODULE_0__.getPaymentMethodData)(_constants__WEBPACK_IMPORTED_MODULE_1__.GATEWAY_ID, {});
  return {
    isTestMode: settings.is_test_mode,
    integrationType: settings.integration_type,
    tempToken: settings.temp_token,
    terminalId: settings.terminal_id,
    allowSavingCards: settings.allow_saving_cards,
    cards: settings.cards
  };
};

/***/ }),

/***/ "./client/blocks/utils/log.js":
/*!************************************!*\
  !*** ./client/blocks/utils/log.js ***!
  \************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   logData: () => (/* binding */ logData),
/* harmony export */   logError: () => (/* binding */ logError)
/* harmony export */ });
function logError(...args) {
  console.error(...args);
}
function logData(...args) {
  console.log(...args);
}

/***/ }),

/***/ "./client/blocks/utils/place-order-button.js":
/*!***************************************************!*\
  !*** ./client/blocks/utils/place-order-button.js ***!
  \***************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getPlaceOrderButton: () => (/* binding */ getPlaceOrderButton),
/* harmony export */   setPlaceOrderButtonDisabled: () => (/* binding */ setPlaceOrderButtonDisabled),
/* harmony export */   triggerPlaceOrderButtonClick: () => (/* binding */ triggerPlaceOrderButtonClick)
/* harmony export */ });
function setPlaceOrderButtonDisabled(isDisabled) {
  const placeOrderButton = getPlaceOrderButton();
  if (!placeOrderButton) {
    return;
  }
  if (isDisabled) {
    placeOrderButton.setAttribute('disabled', 'disabled');
  } else {
    placeOrderButton.removeAttribute('disabled');
  }
}
function triggerPlaceOrderButtonClick() {
  const placeOrderButton = getPlaceOrderButton();
  if (placeOrderButton) {
    placeOrderButton.removeAttribute('disabled');
    placeOrderButton.click();
  }
}
function getPlaceOrderButton() {
  return document.querySelector('button.wc-block-components-checkout-place-order-button');
}

/***/ }),

/***/ "react":
/*!************************!*\
  !*** external "React" ***!
  \************************/
/***/ ((module) => {

module.exports = window["React"];

/***/ }),

/***/ "@woocommerce/blocks-registry":
/*!******************************************!*\
  !*** external ["wc","wcBlocksRegistry"] ***!
  \******************************************/
/***/ ((module) => {

module.exports = window["wc"]["wcBlocksRegistry"];

/***/ }),

/***/ "@woocommerce/settings":
/*!************************************!*\
  !*** external ["wc","wcSettings"] ***!
  \************************************/
/***/ ((module) => {

module.exports = window["wc"]["wcSettings"];

/***/ }),

/***/ "@wordpress/data":
/*!******************************!*\
  !*** external ["wp","data"] ***!
  \******************************/
/***/ ((module) => {

module.exports = window["wp"]["data"];

/***/ }),

/***/ "@wordpress/element":
/*!*********************************!*\
  !*** external ["wp","element"] ***!
  \*********************************/
/***/ ((module) => {

module.exports = window["wp"]["element"];

/***/ }),

/***/ "@wordpress/html-entities":
/*!**************************************!*\
  !*** external ["wp","htmlEntities"] ***!
  \**************************************/
/***/ ((module) => {

module.exports = window["wp"]["htmlEntities"];

/***/ }),

/***/ "@wordpress/i18n":
/*!******************************!*\
  !*** external ["wp","i18n"] ***!
  \******************************/
/***/ ((module) => {

module.exports = window["wp"]["i18n"];

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
/*!***********************************!*\
  !*** ./client/blocks/applepay.js ***!
  \***********************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _woocommerce_blocks_registry__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @woocommerce/blocks-registry */ "@woocommerce/blocks-registry");
/* harmony import */ var _woocommerce_blocks_registry__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_woocommerce_blocks_registry__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/i18n */ "@wordpress/i18n");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _woocommerce_settings__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @woocommerce/settings */ "@woocommerce/settings");
/* harmony import */ var _woocommerce_settings__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_woocommerce_settings__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _wordpress_html_entities__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @wordpress/html-entities */ "@wordpress/html-entities");
/* harmony import */ var _wordpress_html_entities__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_wordpress_html_entities__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @wordpress/element */ "@wordpress/element");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _constants__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./constants */ "./client/blocks/constants.js");
/* harmony import */ var _components_payment_component__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./components/payment-component */ "./client/blocks/components/payment-component.js");
var _settings$supports;

/**
 * External dependencies
 */






/**
 * Internal dependencies
 */


const settings = (0,_woocommerce_settings__WEBPACK_IMPORTED_MODULE_3__.getPaymentMethodData)(_constants__WEBPACK_IMPORTED_MODULE_6__.GATEWAY_ID_APPLE_PAY, {});
const defaultLabel = (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Apple Pay by DNA Payments', _constants__WEBPACK_IMPORTED_MODULE_6__.TEXT_DOMAIN);
const label = (0,_wordpress_html_entities__WEBPACK_IMPORTED_MODULE_4__.decodeEntities)(settings?.title || '') || defaultLabel;
const Label = props => {
  const {
    PaymentMethodLabel
  } = props.components;
  return (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)(PaymentMethodLabel, {
    text: label
  });
};

/**
 * Content component
 */
const Content = props => {
  return (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)(_wordpress_element__WEBPACK_IMPORTED_MODULE_5__.RawHTML, null, (0,_wordpress_html_entities__WEBPACK_IMPORTED_MODULE_4__.decodeEntities)(settings.description || ''));
};

/**
 * Apple pay button
 */
const ApplePayButton = props => {
  return (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)(_components_payment_component__WEBPACK_IMPORTED_MODULE_7__.PaymentComponent, {
    componentInstance: window.DNAPayments.ApplePayComponent,
    gatewayId: _constants__WEBPACK_IMPORTED_MODULE_6__.GATEWAY_ID_APPLE_PAY,
    containerId: _constants__WEBPACK_IMPORTED_MODULE_6__.CONTAINER_IDS.applepay,
    errorMessage: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Apple Pay payments are not supported in your current browser. Please use Safari on a compatible Apple device to complete your transaction.', _constants__WEBPACK_IMPORTED_MODULE_6__.TEXT_DOMAIN),
    props: props
  });
};

/**
 */
const dnapaymentsApplePayPaymentMethod = {
  name: _constants__WEBPACK_IMPORTED_MODULE_6__.GATEWAY_ID_APPLE_PAY,
  label: (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)(Label, null),
  content: (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)(ApplePayButton, null),
  edit: (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)(Content, null),
  canMakePayment: () => true,
  ariaLabel: label,
  supports: {
    features: (_settings$supports = settings?.supports) !== null && _settings$supports !== void 0 ? _settings$supports : []
  },
  placeOrderButtonLabel: label
};
(0,_woocommerce_blocks_registry__WEBPACK_IMPORTED_MODULE_1__.registerPaymentMethod)(dnapaymentsApplePayPaymentMethod);
/******/ })()
;
//# sourceMappingURL=dnapayments_applepay.js.map