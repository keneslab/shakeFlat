/**
 * sfAjax - Modern Ajax Library for shakeFlat Framework
 * @version 3.0.0
 */

/**
 * sfAjax Class - Ajax request handler with configurable response modes
 */
class sfAjax {
    /**
     * @typedef {Object} SfAjaxConfig
     * @property {'auto'|'shakeFlat'|'standard'} responseMode - Response handling mode
     * @property {boolean} useCustomUI - Use sfAlert, sfNoti, sfConfirm instead of native
     * @property {Object<number, Function>} errorHandlers - Custom error handlers by errCode
     * @property {Function|null} defaultErrorHandler - Default error handler
     */

    /**
     * Constructor
     * @param {Partial<SfAjaxConfig>} config - Initial configuration
     */
    constructor(config = {}) {
        // Auto-detect sfUI availability if useCustomUI is not explicitly set
        const autoDetectCustomUI = !('useCustomUI' in config) && this._isSfUIAvailable();

        this.config = {
            responseMode: 'auto',
            useCustomUI: autoDetectCustomUI,
            errorHandlers: {},
            defaultErrorHandler: null,
            ...config
        };
    }

    /**
     * Check if sfUI functions are available
     * @returns {boolean}
     * @private
     */
    _isSfUIAvailable() {
        return typeof sfAlert === 'function' ||
               typeof sfNoti === 'function' ||
               typeof sfConfirm === 'function';
    }

    /**
     * Configure sfAjax instance
     * @param {Partial<SfAjaxConfig>} config
     * @returns {sfAjax} - Returns this for chaining
     */
    configure(config) {
        Object.assign(this.config, config);
        return this;
    }

    /**
     * Register error handler for specific error code
     * @param {number} errCode
     * @param {Function} handler - Function(result, context) => boolean
     * @returns {sfAjax} - Returns this for chaining
     */
    registerErrorHandler(errCode, handler) {
        this.config.errorHandlers[errCode] = handler;
        return this;
    }

    /**
     * Unregister error handler for specific error code
     * @param {number} errCode
     * @returns {sfAjax} - Returns this for chaining
     */
    unregisterErrorHandler(errCode) {
        delete this.config.errorHandlers[errCode];
        return this;
    }

    /**
     * Check if response is shakeFlat format
     * @param {any} result
     * @returns {boolean}
     * @private
     */
    _isShakeFlatResponse(result) {
        return result &&
               typeof result === 'object' &&
               'data' in result &&
               'error' in result &&
               typeof result.error === 'object' &&
               'errCode' in result.error;
    }

    /**
     * Show alert message
     * @param {string} message
     * @private
     */
    _showAlert(message) {
        if (this.config.useCustomUI && typeof sfAlert === 'function') {
            sfAlert(message);
        } else {
            alert(message);
        }
    }

    /**
     * Show notification
     * @param {string} message
     * @private
     */
    _showNoti(message) {
        if (this.config.useCustomUI && typeof sfNoti === 'function') {
            sfNoti(message);
        } else {
            alert(message);
        }
    }

    /**
     * Show confirm dialog
     * @param {string} message
     * @returns {Promise<boolean>}
     * @private
     */
    async _showConfirm(message) {
        if (this.config.useCustomUI && typeof sfConfirm === 'function') {
            return await sfConfirm(message);
        } else {
            return confirm(message);
        }
    }

    /**
     * Alert and jump to URL
     * @param {string} message
     * @param {string} url
     * @private
     */
    _alertJump(message, url) {
        this._showAlert(message);
        setTimeout(() => {
            window.location.href = url;
        }, 100);
    }

    /**
     * Build FormData from various input types
     * @param {string|HTMLElement|FormData|Object} frm
     * @returns {FormData}
     * @private
     */
    _buildFormData(frm) {
        const frmData = new FormData();

        if (frm instanceof FormData) {
            return frm;
        }

        let frmObj = null;

        if (typeof frm === 'string') {
            frmObj = document.getElementById(frm);
        } else if (frm instanceof HTMLElement) {
            frmObj = frm;
        } else if (typeof frm === 'object' && frm !== null) {
            Object.entries(frm).forEach(([key, value]) => {
                if (value instanceof File) {
                    const element = document.getElementById(key);
                    if (element?.files?.[0]) {
                        frmData.append(key, element.files[0]);
                    }
                } else if (Array.isArray(value)) {
                    value.forEach(item => frmData.append(key, item));
                } else if (value !== null && value !== undefined) {
                    frmData.append(key, value);
                }
            });
            return frmData;
        }

        if (frmObj) {
            const formElements = frmObj.querySelectorAll('input, textarea, select');
            formElements.forEach(element => {
                const type = element.getAttribute('type');
                const name = element.getAttribute('name');

                if (!name) return;

                if (type === 'file') {
                    if (element.files?.[0]) {
                        frmData.append(name, element.files[0]);
                    }
                } else if (type === 'checkbox') {
                    if (element.checked) {
                        frmData.append(name, element.value);
                    }
                } else if (type === 'radio') {
                    if (element.checked) {
                        frmData.append(name, element.value);
                    }
                } else {
                    frmData.append(name, element.value);
                }
            });
        }

        return frmData;
    }

    /**
     * Handle shakeFlat response
     * @param {Object} result
     * @param {Function} successCallback
     * @param {Function|null} errorCallback
     * @param {any} context
     * @returns {boolean}
     * @private
     */
    _handleShakeFlatResponse(result, successCallback, errorCallback, context) {
        if (!this._isShakeFlatResponse(result)) {
            if (errorCallback) {
                errorCallback(result, context);
            } else {
                console.error('Invalid response format:', result);
                this._showAlert('서버 호출시 문제가 발생하였습니다. 잠시 후 다시 시도해주세요.');
            }
            return false;
        }

        const { error, data } = result;
        const { errCode, errMsg, errUrl } = error;

        if (errCode === 0) {
            return successCallback(result, context);
        }

        // Check for custom error handler
        if (this.config.errorHandlers[errCode]) {
            return this.config.errorHandlers[errCode](result, context);
        }

        // Check for default error handler
        if (this.config.defaultErrorHandler) {
            return this.config.defaultErrorHandler(result, context);
        }

        // Handle error with message and URL
        if (errMsg && errUrl) {
            this._alertJump(errMsg, errUrl);
            return false;
        }

        // Custom error callback
        if (errorCallback) {
            return errorCallback(result, context);
        }

        // Default error handling
        const message = errMsg || '잘못된 접근입니다. 잠시 후 다시 시도해주세요.';
        this._showAlert(`${message} (${errCode})`);
        return false;
    }

    /**
     * Handle standard response
     * @param {any} result
     * @param {Function} successCallback
     * @param {Function|null} errorCallback
     * @param {any} context
     * @private
     */
    _handleStandardResponse(result, successCallback, errorCallback, context) {
        if (successCallback) {
            return successCallback(result, context);
        }
    }

    /**
     * Ajax request (async)
     * @param {string} url
     * @param {string|HTMLElement|FormData|Object} frm
     * @param {Function} successCallback
     * @param {Function|null} errorCallback
     * @param {any} context
     * @param {Object} options - Additional options
     * @param {string} options.responseMode - 'auto', 'shakeFlat', or 'standard'
     * @param {string} options.method - HTTP method (default: 'POST')
     * @param {string} options.credentials - Credentials mode (default: 'include')
     */
    async request(url, frm, successCallback, errorCallback = null, context = null, options = {}) {
        const {
            responseMode = this.config.responseMode,
            method = 'POST',
            credentials = 'include'
        } = options;

        try {
            const formData = this._buildFormData(frm);

            const response = await fetch(url, {
                method,
                body: formData,
                credentials
            });

            if (response.status === 404) {
                this._showAlert('페이지를 찾을 수 없습니다. (404)');
                throw new Error('404 Not Found');
            }

            if (response.status === 500) {
                this._showAlert('서버가 응답이 없습니다. (500)');
                throw new Error('500 Server Error');
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            // Determine response mode
            let actualMode = responseMode;
            if (actualMode === 'auto') {
                actualMode = this._isShakeFlatResponse(result) ? 'shakeFlat' : 'standard';
            }

            if (actualMode === 'shakeFlat') {
                return this._handleShakeFlatResponse(result, successCallback, errorCallback, context);
            } else {
                return this._handleStandardResponse(result, successCallback, errorCallback, context);
            }

        } catch (error) {
            if (errorCallback) {
                return errorCallback(error, context);
            } else {
                console.error('Ajax request failed:', error);
                this._showAlert('서버 호출시 문제가 발생하였습니다. 잠시 후 다시 시도해주세요.');
            }
            return false;
        }
    }

    /**
     * Synchronous Ajax request (returns result or false)
     * @param {string} url
     * @param {string|HTMLElement|FormData|Object} frm
     * @param {Object} options - Additional options
     * @param {string} options.responseMode - 'auto', 'shakeFlat', or 'standard'
     * @param {string} options.method - HTTP method (default: 'POST')
     * @param {string} options.credentials - Credentials mode (default: 'include')
     * @returns {Promise<Object|boolean>}
     */
    async requestSync(url, frm, options = {}) {
        const {
            responseMode = this.config.responseMode,
            method = 'POST',
            credentials = 'include'
        } = options;

        try {
            const formData = this._buildFormData(frm);

            const response = await fetch(url, {
                method,
                body: formData,
                credentials
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            // Determine response mode
            let actualMode = responseMode;
            if (actualMode === 'auto') {
                actualMode = this._isShakeFlatResponse(result) ? 'shakeFlat' : 'standard';
            }

            if (actualMode === 'shakeFlat') {
                if (!this._isShakeFlatResponse(result)) {
                    console.error('Invalid response format:', result);
                    return false;
                }

                const { error, data } = result;
                const { errCode, errMsg, errUrl } = error;

                if (errCode !== 0) {
                    // Check for custom error handler
                    if (this.config.errorHandlers[errCode]) {
                        this.config.errorHandlers[errCode](result, null);
                        return false;
                    }

                    if (errMsg && errUrl) {
                        this._alertJump(errMsg, errUrl);
                        return false;
                    }

                    const message = errMsg || '잘못된 접근입니다. 잠시 후 다시 시도해주세요.';
                    this._showAlert(`${message} (${errCode})`);
                    return false;
                }
            }

            return result;

        } catch (error) {
            console.error('Ajax request failed:', error);
            this._showAlert('서버 호출시 문제가 발생하였습니다. 잠시 후 다시 시도해주세요.');
            return false;
        }
    }
}

// Create default instance
const sfAjaxInstance = new sfAjax();

// Export convenience functions for backward compatibility
/**
 * Configure global sfAjax instance
 * @param {Partial<SfAjaxConfig>} config
 */
function configureSfAjax(config) {
    sfAjaxInstance.configure(config);
}

/**
 * Register error handler on global instance
 * @param {number} errCode
 * @param {Function} handler
 */
function registerErrorHandler(errCode, handler) {
    sfAjaxInstance.registerErrorHandler(errCode, handler);
}

/**
 * Unregister error handler on global instance
 * @param {number} errCode
 */
function unregisterErrorHandler(errCode) {
    sfAjaxInstance.unregisterErrorHandler(errCode);
}

/**
 * Ajax request using global instance
 * @param {string} url
 * @param {string|HTMLElement|FormData|Object} frm
 * @param {Function} successCallback
 * @param {Function|null} errorCallback
 * @param {any} context
 * @param {Object} options
 */
async function sfAjax(url, frm, successCallback, errorCallback = null, context = null, options = {}) {
    return sfAjaxInstance.request(url, frm, successCallback, errorCallback, context, options);
}

/**
 * Synchronous Ajax request using global instance
 * @param {string} url
 * @param {string|HTMLElement|FormData|Object} frm
 * @param {Object} options
 * @returns {Promise<Object|boolean>}
 */
async function sfAjaxSync(url, frm, options = {}) {
    return sfAjaxInstance.requestSync(url, frm, options);
}