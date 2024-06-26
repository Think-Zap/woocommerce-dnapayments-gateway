/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./client/blocks/components/credit-card-fields.js":
/*!********************************************************!*\
  !*** ./client/blocks/components/credit-card-fields.js ***!
  \********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DnapaymentsCreditCardFields: () => (/* binding */ DnapaymentsCreditCardFields)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/i18n */ "@wordpress/i18n");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/element */ "@wordpress/element");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _woocommerce_blocks_checkout__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @woocommerce/blocks-checkout */ "@woocommerce/blocks-checkout");
/* harmony import */ var _woocommerce_blocks_checkout__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_woocommerce_blocks_checkout__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _constants__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../constants */ "./client/blocks/constants.js");
/* harmony import */ var _utils_get_settings__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../utils/get_settings */ "./client/blocks/utils/get_settings.js");
/* harmony import */ var _utils_create_hosted_fields__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../utils/create-hosted-fields */ "./client/blocks/utils/create-hosted-fields.js");
/* harmony import */ var _utils_create_modal__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../utils/create-modal */ "./client/blocks/utils/create-modal.js");
/* harmony import */ var _utils_place_order_button__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../utils/place-order-button */ "./client/blocks/utils/place-order-button.js");

/**
 * External dependencies
 */




/**
 * Internal dependencies
 */






/**
 * Render the credit card fields.
 *
 * @param {Object} props Incoming props
 */
const DnapaymentsCreditCardFields = ({
  props,
  isLoaded = false,
  hostedFieldsInstance = null,
  onLoad = () => {}
}) => {
  const {
    components: {
      LoadingMask
    },
    token = null
  } = props;
  const mounted = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_2__.useRef)(false);
  const threeDSRef = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_2__.useRef)();
  const [isCvvTokenVisible, setIsCvvTokenVisible] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_2__.useState)(false);
  const [error, setError] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_2__.useState)({
    name: '',
    number: '',
    expirationDate: '',
    cvv: ''
  });
  const setupIntegration = async () => {
    const {
      isTestMode,
      tempToken,
      cards
    } = (0,_utils_get_settings__WEBPACK_IMPORTED_MODULE_5__.getDnaPaymentsSettingsData)();
    const selectedCard = cards.find(c => String(c.id) === String(token));
    (0,_utils_place_order_button__WEBPACK_IMPORTED_MODULE_8__.setPlaceOrderButtonDisabled)(true);
    threeDSRef.current = (0,_utils_create_modal__WEBPACK_IMPORTED_MODULE_7__.createModal)(_constants__WEBPACK_IMPORTED_MODULE_4__.HOSTED_FIELD_IDS.threeDS);
    hostedFieldsInstance = await (0,_utils_create_hosted_fields__WEBPACK_IMPORTED_MODULE_6__.createHostedFields)({
      isTest: isTestMode,
      accessToken: tempToken,
      threeDSModal: threeDSRef.current,
      domElements: {
        number: document.getElementById(_constants__WEBPACK_IMPORTED_MODULE_4__.HOSTED_FIELD_IDS.number),
        name: document.getElementById(_constants__WEBPACK_IMPORTED_MODULE_4__.HOSTED_FIELD_IDS.name),
        expDate: document.getElementById(_constants__WEBPACK_IMPORTED_MODULE_4__.HOSTED_FIELD_IDS.expDate),
        cvv: document.getElementById(_constants__WEBPACK_IMPORTED_MODULE_4__.HOSTED_FIELD_IDS.cvv),
        cvvToken: document.getElementById(_constants__WEBPACK_IMPORTED_MODULE_4__.HOSTED_FIELD_IDS.cvvToken)
      }
    });
    if (selectedCard) {
      const cvvState = hostedFieldsInstance.getTokenizedCardCvvState(selectedCard);
      setIsCvvTokenVisible(cvvState === 'required');
      hostedFieldsInstance.selectCard(selectedCard);
    }
    (0,_utils_place_order_button__WEBPACK_IMPORTED_MODULE_8__.setPlaceOrderButtonDisabled)(false);
    onLoad(hostedFieldsInstance);
  };
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_2__.useEffect)(() => {
    const {
      cards
    } = (0,_utils_get_settings__WEBPACK_IMPORTED_MODULE_5__.getDnaPaymentsSettingsData)();
    if (token && hostedFieldsInstance) {
      const selectedCard = cards.find(c => String(c.id) === String(token));
      if (selectedCard) {
        const cvvState = hostedFieldsInstance.getTokenizedCardCvvState(selectedCard);
        setIsCvvTokenVisible(cvvState === 'required');
        hostedFieldsInstance.selectCard(selectedCard);
      }
    }
  }, [token]);
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_2__.useEffect)(() => {
    mounted.current = true;
    setTimeout(() => {
      if (mounted.current) {
        setupIntegration();
      }
    }, 100);
    return () => {
      mounted.current = false;
      if (hostedFieldsInstance) {
        hostedFieldsInstance.destroy();
      }
      if (threeDSRef.current) {
        threeDSRef.current.remove();
        threeDSRef.current = null;
      }
      onLoad(null);
    };
  }, []);
  return (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)(LoadingMask, {
    isLoading: !isLoaded,
    showSpinner: true
  }, (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)("div", {
    className: "wc-block-dnapayments-card-elements",
    style: {
      display: !token ? 'flex' : 'none'
    }
  }, (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)("div", {
    className: "wc-block-gateway-container"
  }, (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)("div", {
    id: _constants__WEBPACK_IMPORTED_MODULE_4__.HOSTED_FIELD_IDS.number,
    className: `wc-block-gateway-input empty`
  }), (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)("label", {
    htmlFor: _constants__WEBPACK_IMPORTED_MODULE_4__.HOSTED_FIELD_IDS.number
  }, (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Card number', _constants__WEBPACK_IMPORTED_MODULE_4__.TEXT_DOMAIN)), (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)(_woocommerce_blocks_checkout__WEBPACK_IMPORTED_MODULE_3__.ValidationInputError, {
    errorMessage: error.number
  })), (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)("div", {
    className: "wc-block-gateway-container"
  }, (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)("div", {
    id: _constants__WEBPACK_IMPORTED_MODULE_4__.HOSTED_FIELD_IDS.name,
    className: `wc-block-gateway-input empty`
  }), (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)("label", {
    htmlFor: _constants__WEBPACK_IMPORTED_MODULE_4__.HOSTED_FIELD_IDS.name
  }, (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Cardholder name', _constants__WEBPACK_IMPORTED_MODULE_4__.TEXT_DOMAIN)), (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)(_woocommerce_blocks_checkout__WEBPACK_IMPORTED_MODULE_3__.ValidationInputError, {
    errorMessage: error.name
  })), (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)("div", {
    className: "wc-block-gateway-container wc-block-dnapayments-card-element-small"
  }, (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)("div", {
    id: _constants__WEBPACK_IMPORTED_MODULE_4__.HOSTED_FIELD_IDS.expDate,
    className: "wc-block-gateway-input empty"
  }), (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)("label", {
    htmlFor: _constants__WEBPACK_IMPORTED_MODULE_4__.HOSTED_FIELD_IDS.expDate
  }, (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Expiry date (MMYY)', _constants__WEBPACK_IMPORTED_MODULE_4__.TEXT_DOMAIN)), (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)(_woocommerce_blocks_checkout__WEBPACK_IMPORTED_MODULE_3__.ValidationInputError, {
    errorMessage: error.expirationDate
  })), (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)("div", {
    className: "wc-block-gateway-container wc-block-dnapayments-card-element-small"
  }, (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)("div", {
    id: _constants__WEBPACK_IMPORTED_MODULE_4__.HOSTED_FIELD_IDS.cvv,
    className: "wc-block-gateway-input empty"
  }), (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)("label", {
    htmlFor: _constants__WEBPACK_IMPORTED_MODULE_4__.HOSTED_FIELD_IDS.cvv
  }, (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Card code (CVC)', _constants__WEBPACK_IMPORTED_MODULE_4__.TEXT_DOMAIN)), (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)(_woocommerce_blocks_checkout__WEBPACK_IMPORTED_MODULE_3__.ValidationInputError, {
    errorMessage: error.cvv
  }))), (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)("div", {
    className: "wc-block-dnapayments-card-elements",
    style: {
      display: isCvvTokenVisible ? 'flex' : 'none'
    }
  }, (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)("div", {
    className: "wc-block-gateway-container wc-block-dnapayments-card-element-small"
  }, (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)("div", {
    id: _constants__WEBPACK_IMPORTED_MODULE_4__.HOSTED_FIELD_IDS.cvvToken,
    className: "wc-block-gateway-input empty"
  }), (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)("label", {
    htmlFor: _constants__WEBPACK_IMPORTED_MODULE_4__.HOSTED_FIELD_IDS.cvvToken
  }, (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Card code (CVC)', _constants__WEBPACK_IMPORTED_MODULE_4__.TEXT_DOMAIN)), (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)(_woocommerce_blocks_checkout__WEBPACK_IMPORTED_MODULE_3__.ValidationInputError, {
    errorMessage: error.cvv
  }))));
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

/***/ "./client/blocks/hooks/use-payment-form.js":
/*!*************************************************!*\
  !*** ./client/blocks/hooks/use-payment-form.js ***!
  \*************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   usePaymentForm: () => (/* binding */ usePaymentForm)
/* harmony export */ });
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/i18n */ "@wordpress/i18n");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/element */ "@wordpress/element");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _constants__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../constants */ "./client/blocks/constants.js");
/* harmony import */ var _utils_get_settings__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../utils/get_settings */ "./client/blocks/utils/get_settings.js");
/* harmony import */ var _utils_log__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../utils/log */ "./client/blocks/utils/log.js");
/* harmony import */ var _utils_try_parse__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../utils/try-parse */ "./client/blocks/utils/try-parse.js");
/**
 * External dependencies
 */



/**
 * Internal dependencies
 */




const usePaymentForm = ({
  props,
  hostedFieldsInstance
}) => {
  const {
    emitResponse,
    eventRegistration: {
      onCheckoutSuccess
    },
    shouldSavePayment
  } = props;
  const {
    isTestMode,
    integrationType,
    allowSavingCards,
    cards
  } = (0,_utils_get_settings__WEBPACK_IMPORTED_MODULE_3__.getDnaPaymentsSettingsData)();
  (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_1__.useEffect)(() => {
    const handler = ({
      processingResponse: {
        paymentDetails
      }
    }) => new Promise(resolve => {
      const paymentData = (0,_utils_try_parse__WEBPACK_IMPORTED_MODULE_5__.tryParse)(paymentDetails.paymentData);
      const auth = (0,_utils_try_parse__WEBPACK_IMPORTED_MODULE_5__.tryParse)(paymentDetails.auth);
      const merchantCustomData = (0,_utils_try_parse__WEBPACK_IMPORTED_MODULE_5__.tryParse)(paymentData.merchantCustomData) || {};
      const {
        returnUrl
      } = paymentData.paymentSettings;
      switch (integrationType) {
        case 'hosted-fields':
          {
            window.DNAPayments.configure({
              isTestMode,
              cards,
              allowSavingCards
            });
            hostedFieldsInstance.submit({
              paymentData: {
                ...paymentData,
                merchantCustomData: JSON.stringify({
                  ...merchantCustomData,
                  storeCardOnFile: shouldSavePayment
                })
              },
              token: auth.access_token
            }).then(() => {
              resolve({
                type: emitResponse.responseTypes.SUCCESS,
                messageContext: emitResponse.noticeContexts.PAYMENTS
              });
              window.location.href = returnUrl;
            }).catch(err => {
              (0,_utils_log__WEBPACK_IMPORTED_MODULE_4__.logError)(err);
              let message = err.message;
              if (err.code !== 'INVALID_CARD_DATA') {
                hostedFieldsInstance.clear();
                message = (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)('Your card has not been authorised, please check the details and retry or contact your bank.', _constants__WEBPACK_IMPORTED_MODULE_2__.TEXT_DOMAIN);
              }
              resolve({
                type: emitResponse.responseTypes.ERROR,
                message,
                messageContext: emitResponse.noticeContexts.PAYMENTS
              });
            });
            break;
          }
        case 'embedded':
          {
            window.DNAPayments.configure({
              isTestMode,
              cards,
              allowSavingCards,
              events: {
                cancelled: () => resolve({
                  type: emitResponse.responseTypes.ERROR,
                  message: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)('You have cancelled the payment process. Please try again if you wish to complete the order.', _constants__WEBPACK_IMPORTED_MODULE_2__.TEXT_DOMAIN),
                  messageContext: emitResponse.noticeContexts.PAYMENTS
                }),
                paid: () => resolve({
                  type: emitResponse.responseTypes.SUCCESS,
                  messageContext: emitResponse.noticeContexts.PAYMENTS
                }),
                declined: () => resolve({
                  type: emitResponse.responseTypes.ERROR,
                  message: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_0__.__)('Your payment proccess has been failed.', _constants__WEBPACK_IMPORTED_MODULE_2__.TEXT_DOMAIN),
                  messageContext: emitResponse.noticeContexts.PAYMENTS
                })
              }
            });
            window.DNAPayments.openPaymentIframeWidget({
              ...paymentData,
              auth
            });
            break;
          }
        default:
          {
            window.DNAPayments.configure({
              isTestMode,
              cards,
              allowSavingCards
            });
            window.DNAPayments.openPaymentPage({
              ...paymentData,
              auth
            });
          }
      }
    });
    return onCheckoutSuccess(handler);
  }, [onCheckoutSuccess, hostedFieldsInstance]);
};

/***/ }),

/***/ "./client/blocks/utils/create-hosted-fields.js":
/*!*****************************************************!*\
  !*** ./client/blocks/utils/create-hosted-fields.js ***!
  \*****************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   createHostedFields: () => (/* binding */ createHostedFields)
/* harmony export */ });
/* harmony import */ var _log__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./log */ "./client/blocks/utils/log.js");

async function createHostedFields({
  isTest,
  accessToken,
  threeDSModal,
  domElements: {
    number,
    name,
    expDate,
    cvv,
    cvvToken
  }
}) {
  const fields = {
    cardholderName: {
      container: name,
      placeholder: 'ABC'
    },
    cardNumber: {
      container: number,
      placeholder: '1234 1234 1234 1234'
    },
    expirationDate: {
      container: expDate,
      placeholder: 'MM / YY'
    },
    cvv: {
      container: cvv,
      placeholder: 'CVC'
    },
    tokenizedCardCvv: {
      container: cvvToken,
      placeholder: 'CVC'
    }
  };
  const options = {
    isTest,
    accessToken,
    styles: {
      input: {
        'font-size': '14px',
        'font-family': 'Open Sans'
      },
      '::placeholder': {
        opacity: '0'
      },
      'input:focus::placeholder': {
        opacity: '0.5'
      }
    },
    styleConfig: {
      containerClasses: {
        FOCUSED: 'focused',
        INVALID: 'has-error'
      }
    },
    fontNames: ['Open Sans'],
    threeDSecure: {
      container: threeDSModal.body
    },
    fields
  };
  try {
    const hostedFieldsInstance = await window.dnaPayments.hostedFields.create(options);
    hostedFieldsInstance.on('blur', function ({
      fieldKey,
      fieldsState
    }) {
      const fieldContainer = fields[fieldKey]?.container;
      const isEmpty = fieldsState[fieldKey]?.isEmpty;
      if (fieldContainer) {
        fieldContainer.classList.toggle('empty', isEmpty);
      }
    });
    hostedFieldsInstance.on('dna-payments-three-d-secure-show', data => {
      if (threeDSModal) {
        threeDSModal.show();
      }
    });
    hostedFieldsInstance.on('dna-payments-three-d-secure-hide', () => {
      if (threeDSModal) {
        threeDSModal.hide();
      }
    });
    return hostedFieldsInstance;
  } catch (err) {
    (0,_log__WEBPACK_IMPORTED_MODULE_0__.logError)(err);
    throw new Error('Your card has not been authorised, please check the details and retry or contact your bank.');
  }
}

/***/ }),

/***/ "./client/blocks/utils/create-modal.js":
/*!*********************************************!*\
  !*** ./client/blocks/utils/create-modal.js ***!
  \*********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   createModal: () => (/* binding */ createModal)
/* harmony export */ });
function createModal(id) {
  // Create modal elements
  const modalContainer = document.createElement('div');
  modalContainer.className = 'dna-modal-container';
  modalContainer.id = id;
  const modal = document.createElement('div');
  modal.className = 'dna-modal';
  const modalBody = document.createElement('div');
  modalBody.className = 'dna-modal-body';

  // Append elements
  modal.appendChild(modalBody);
  modalContainer.appendChild(modal);
  document.body.appendChild(modalContainer);
  return {
    show: () => modalContainer.classList.add('open'),
    hide: () => modalContainer.classList.remove('open'),
    remove: () => modalContainer.remove(),
    body: modalBody
  };
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

/***/ "./client/blocks/utils/try-parse.js":
/*!******************************************!*\
  !*** ./client/blocks/utils/try-parse.js ***!
  \******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   tryParse: () => (/* binding */ tryParse)
/* harmony export */ });
/* harmony import */ var _log__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./log */ "./client/blocks/utils/log.js");

const tryParse = str => {
  try {
    return JSON.parse(str);
  } catch (err) {
    (0,_log__WEBPACK_IMPORTED_MODULE_0__.logError)(err);
    return null;
  }
};

/***/ }),

/***/ "react":
/*!************************!*\
  !*** external "React" ***!
  \************************/
/***/ ((module) => {

module.exports = window["React"];

/***/ }),

/***/ "@woocommerce/blocks-checkout":
/*!****************************************!*\
  !*** external ["wc","blocksCheckout"] ***!
  \****************************************/
/***/ ((module) => {

module.exports = window["wc"]["blocksCheckout"];

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
/*!********************************!*\
  !*** ./client/blocks/index.js ***!
  \********************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "react");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _woocommerce_blocks_registry__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @woocommerce/blocks-registry */ "@woocommerce/blocks-registry");
/* harmony import */ var _woocommerce_blocks_registry__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_woocommerce_blocks_registry__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @wordpress/i18n */ "@wordpress/i18n");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _wordpress_data__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @wordpress/data */ "@wordpress/data");
/* harmony import */ var _wordpress_data__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_wordpress_data__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @wordpress/element */ "@wordpress/element");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _woocommerce_settings__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @woocommerce/settings */ "@woocommerce/settings");
/* harmony import */ var _woocommerce_settings__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_woocommerce_settings__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _wordpress_html_entities__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! @wordpress/html-entities */ "@wordpress/html-entities");
/* harmony import */ var _wordpress_html_entities__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(_wordpress_html_entities__WEBPACK_IMPORTED_MODULE_6__);
/* harmony import */ var _constants__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./constants */ "./client/blocks/constants.js");
/* harmony import */ var _components_credit_card_fields__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./components/credit-card-fields */ "./client/blocks/components/credit-card-fields.js");
/* harmony import */ var _hooks_use_payment_form__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./hooks/use-payment-form */ "./client/blocks/hooks/use-payment-form.js");
var _settings$supports;

/**
 * External dependencies
 */







/**
 * Internal dependencies
 */



const settings = (0,_woocommerce_settings__WEBPACK_IMPORTED_MODULE_5__.getPaymentMethodData)(_constants__WEBPACK_IMPORTED_MODULE_7__.GATEWAY_ID, {});
const isHostedFields = settings.integration_type === 'hosted-fields';
const defaultLabel = (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('DNA Payments', _constants__WEBPACK_IMPORTED_MODULE_7__.TEXT_DOMAIN);
const label = (0,_wordpress_html_entities__WEBPACK_IMPORTED_MODULE_6__.decodeEntities)(settings?.title || '') || defaultLabel;

/**
 * Content component
 */
const Content = props => {
  const [isLoaded, setLoaded] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_4__.useState)(false);
  const [hostedFieldsInstance, setHostedFieldsInstance] = (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_4__.useState)(null);
  (0,_hooks_use_payment_form__WEBPACK_IMPORTED_MODULE_9__.usePaymentForm)({
    props,
    hostedFieldsInstance
  });
  const isEditor = !!(0,_wordpress_data__WEBPACK_IMPORTED_MODULE_3__.select)('core/editor');
  // Don't render anything if we're in the editor.
  if (isEditor) {
    return null;
  }
  if (isHostedFields) {
    return (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)(_components_credit_card_fields__WEBPACK_IMPORTED_MODULE_8__.DnapaymentsCreditCardFields, {
      props: props,
      isLoaded: isLoaded,
      hostedFieldsInstance: hostedFieldsInstance,
      onLoad: instance => {
        setHostedFieldsInstance(instance);
        setLoaded(true);
      }
    });
  }
  return (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)(_wordpress_element__WEBPACK_IMPORTED_MODULE_4__.RawHTML, null, (0,_wordpress_html_entities__WEBPACK_IMPORTED_MODULE_6__.decodeEntities)(settings.description || ''));
};

/**
 * Label component
 *
 * @param {*} props Props from payment API.
 */
const Label = props => {
  const {
    PaymentMethodLabel
  } = props.components;
  return (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)(PaymentMethodLabel, {
    text: label
  });
};

/**
 * DNA Payments payment method config object.
 */
const dnapaymentsPaymentMethod = {
  name: _constants__WEBPACK_IMPORTED_MODULE_7__.GATEWAY_ID,
  label: (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)(Label, null),
  content: (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)(Content, null),
  edit: (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)(Content, null),
  canMakePayment: () => true,
  savedTokenComponent: (0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)(Content, null),
  ariaLabel: label,
  supports: {
    showSavedCards: isHostedFields,
    showSaveOption: isHostedFields,
    features: (_settings$supports = settings?.supports) !== null && _settings$supports !== void 0 ? _settings$supports : []
  },
  placeOrderButtonLabel: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_2__.__)('Pay with DNA Payments', _constants__WEBPACK_IMPORTED_MODULE_7__.TEXT_DOMAIN)
};
(0,_woocommerce_blocks_registry__WEBPACK_IMPORTED_MODULE_1__.registerPaymentMethod)(dnapaymentsPaymentMethod);
/******/ })()
;
//# sourceMappingURL=dnapayments.js.map