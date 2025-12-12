/**
 * sfUI Alert Module
 * Alert, Notification, Confirm, and Input dialogs
 * @version 1.1.0
 */

class SfUIAlert {
    constructor() {
        this.alertIndex = 0;
        this.activeAlerts = new Map();
    }

    /**
     * Show alert dialog
     */
    sfAlert(message, callback = null) {
        return this.show({
            type: 'alert',
            messageText: message,
            alertType: 'danger',
            okCallback: callback
        });
    }

    /**
     * Show alert and go back
     */
    sfAlertBack(message) {
        return this.show({
            type: 'alert',
            messageText: message,
            alertType: 'danger',
            okCallback: () => history.go(-1)
        });
    }

    /**
     * Show alert and redirect
     */
    sfAlertJump(message, url) {
        return this.show({
            type: 'alert',
            messageText: message,
            alertType: 'danger',
            okCallback: () => location.href = url
        });
    }

    /**
     * Show notification
     */
    sfNoti(message, callback = null) {
        return this.show({
            type: 'alert',
            messageText: message,
            alertType: 'info',
            okCallback: callback
        });
    }

    /**
     * Show notification and go back
     */
    sfNotiBack(message) {
        return this.show({
            type: 'alert',
            messageText: message,
            alertType: 'info',
            okCallback: () => history.go(-1)
        });
    }

    /**
     * Show notification and redirect
     */
    sfNotiJump(message, url) {
        return this.show({
            type: 'alert',
            messageText: message,
            alertType: 'info',
            okCallback: () => location.href = url
        });
    }

    /**
     * Show confirmation dialog
     *
     * Usage 1 - Callback style:
     *   sfConfirm('Are you sure?', () => { console.log('yes'); }, () => { console.log('no'); });
     *
     * Usage 2 - Promise style:
     *   if (await sfConfirm('Are you sure?')) { console.log('yes'); } else { console.log('no'); }
     *   // or
     *   sfConfirm('Are you sure?').then(result => { if (result) { ... } });
     */
    sfConfirm(message, yesCallback = null, noCallback = null) {
        // If no callbacks provided, return Promise for async/await usage
        if (yesCallback === null && noCallback === null) {
            return this.show({
                type: 'confirm',
                messageText: message,
                alertType: 'success',
                yesCallback: null,
                noCallback: null
            });
        }

        // Callback style - execute callbacks and return Promise
        return this.show({
            type: 'confirm',
            messageText: message,
            alertType: 'success',
            yesCallback,
            noCallback
        });
    }

    /**
     * Show input dialog
     */
    sfInputConfirm(message, callback = null, options = {}) {
        return this.show({
            type: 'input',
            messageText: message,
            alertType: 'success',
            showIcon: false,
            inputRequired: true,
            yesCallback: callback,
            ...options
        });
    }

    /**
     * Main show method
     */
    show(options) {
        return new Promise((resolve, reject) => {
            const defaults = {
                type: 'alert',
                messageText: 'Message',
                alertType: 'default',
                fontSize: '1.2rem',
                width: null,
                showIcon: true,
                icon: null,
                iconSize: '5em',
                isCenter: false,
                customStyle: null,
                okCallback: null,
                yesCallback: null,
                noCallback: null,
                top: '15vh',
                left: '0px',
                inputRequired: true,
                inputWidth: '100%',
                inputPlaceholder: '',
                inputType: 'text',
                inputDefault: '',
                closeOnBackdropClick: true
            };

            const settings = { ...defaults, ...options };
            const alertId = ++this.alertIndex;

            // Create alert dialog
            const alertEl = this.createAlertElement(alertId, settings);
            document.body.appendChild(alertEl);

            // Store reference
            this.activeAlerts.set(alertId, {
                element: alertEl,
                settings,
                resolve,
                reject
            });

            // Show with animation
            setTimeout(() => {
                const modal = alertEl.querySelector('.sfui-alert-modal');
                const overlay = alertEl.querySelector('.sfui-alert-overlay');

                if (modal) modal.classList.add('sfui-active');
                if (overlay) overlay.classList.add('sfui-active');

                // Focus first button or input
                const firstInput = alertEl.querySelector('input');
                const firstButton = alertEl.querySelector('button');
                if (firstInput) {
                    firstInput.focus();
                } else if (firstButton) {
                    firstButton.focus();
                }
            }, 10);
        });
    }

    /**
     * Create alert element
     */
    createAlertElement(alertId, settings) {
        const zIndex = sfUICore.getNextZIndex();

        // Calculate width
        let width = settings.width;
        if (!width) {
            const lines = settings.messageText.split(/<br\s*\/?>/i);
            const maxWidth = Math.max(...lines.map(line =>
                sfUICore.getStringWidth(sfUICore.stripHTML(line))
            ));
            width = Math.min(Math.max(maxWidth + 100, 300), 600) + 'px';
        }

        // Create wrapper container to hold both overlay and modal
        const wrapper = sfUICore.createElement('div', {
            className: 'sfui-alert-wrapper',
            attrs: {
                'data-alert-id': alertId
            },
            styles: {
                zIndex: zIndex
            }
        });

        // Create overlay (separate from modal)
        const overlay = sfUICore.createElement('div', {
            className: 'sfui-alert-overlay',
            styles: { zIndex: 1 }
        });

        // Create modal container
        const modal = sfUICore.createElement('div', {
            className: 'sfui-alert-modal',
            attrs: {
                'role': 'dialog',
                'aria-modal': 'true'
            },
            styles: {
                zIndex: 2
            }
        });

        if (settings.customStyle) {
            modal.setAttribute('style', modal.getAttribute('style') + '; ' + settings.customStyle);
        }

        // Create dialog
        const dialog = sfUICore.createElement('div', {
            className: 'sfui-alert-dialog',
            styles: { maxWidth: width }
        });

        if (!settings.isCenter) {
            modal.style.top = settings.top;
            modal.style.left = settings.left;
            dialog.classList.add('sfui-alert-dialog-top');
        }

        // Create content
        const content = sfUICore.createElement('div', {
            className: 'sfui-alert-content'
        });

        // Add icon
        if (settings.showIcon) {
            const iconEl = this.createIcon(settings);
            if (iconEl) content.appendChild(iconEl);
        }

        // Add message
        const messageEl = sfUICore.createElement('div', {
            className: 'sfui-alert-message',
            html: settings.messageText,
            styles: { fontSize: settings.fontSize }
        });
        content.appendChild(messageEl);

        // Add buttons based on type
        const buttonsEl = this.createButtons(settings, alertId);
        content.appendChild(buttonsEl);

        dialog.appendChild(content);
        modal.appendChild(dialog);

        // Add overlay first, then modal to wrapper
        wrapper.appendChild(overlay);
        wrapper.appendChild(modal);

        // Add event handlers
        this.attachEventHandlers(wrapper, alertId, settings);

        return wrapper;
    }

    /**
     * Create icon element
     */
    createIcon(settings) {
        if (settings.icon) {
            return sfUICore.createElement('div', {
                className: 'sfui-alert-icon',
                html: settings.icon,
                styles: { fontSize: settings.iconSize }
            });
        }

        const iconMap = {
            'warning': { class: 'text-warning', icon: '<i class="bi bi-exclamation-circle"></i>' },
            'danger': { class: 'text-danger', icon: '<i class="bi bi-x-circle"></i>' },
            'info': { class: 'text-info', icon: '<i class="bi bi-info-circle"></i>' },
            'success': { class: 'text-success', icon: '<i class="bi bi-check-circle"></i>' }
        };

        const iconData = iconMap[settings.alertType];
        if (iconData) {
            return sfUICore.createElement('div', {
                className: `sfui-alert-icon ${iconData.class}`,
                html: iconData.icon,
                styles: { fontSize: settings.iconSize }
            });
        }

        return null;
    }

    /**
     * Create buttons based on alert type
     */
    createButtons(settings, alertId) {
        const container = sfUICore.createElement('div', {
            className: 'sfui-alert-buttons'
        });

        switch (settings.type) {
            case 'alert':
                const okBtn = sfUICore.createElement('button', {
                    className: `sfui-btn sfui-btn-${settings.alertType}`,
                    text: sfUICore.t('ok'),
                    on: {
                        click: () => {
                            if (settings.okCallback) settings.okCallback();
                            this.close(alertId, true);
                        }
                    }
                });
                container.appendChild(okBtn);
                break;

            case 'confirm':
                const yesBtn = sfUICore.createElement('button', {
                    className: 'sfui-btn sfui-btn-primary',
                    text: sfUICore.t('yes'),
                    on: {
                        click: () => {
                            if (settings.yesCallback) settings.yesCallback();
                            this.close(alertId, true);
                        }
                    }
                });

                const noBtn = sfUICore.createElement('button', {
                    className: 'sfui-btn sfui-btn-secondary',
                    text: sfUICore.t('no'),
                    on: {
                        click: () => {
                            if (settings.noCallback) settings.noCallback();
                            this.close(alertId, false);
                        }
                    }
                });

                container.appendChild(yesBtn);
                container.appendChild(noBtn);
                break;

            case 'input':
                const inputWrapper = sfUICore.createElement('div', {
                    className: 'sfui-alert-input-wrapper'
                });

                const input = sfUICore.createElement('input', {
                    className: 'sfui-form-control',
                    attrs: {
                        type: settings.inputType,
                        placeholder: settings.inputPlaceholder,
                        autocomplete: 'off'
                    },
                    styles: { width: settings.inputWidth }
                });

                if (settings.inputDefault) {
                    input.value = settings.inputDefault;
                }

                const validationMsg = sfUICore.createElement('div', {
                    className: 'sfui-alert-validation'
                });

                const submitBtn = sfUICore.createElement('button', {
                    className: `sfui-btn sfui-btn-${settings.alertType}`,
                    text: sfUICore.t('ok'),
                    on: {
                        click: () => {
                            if (settings.inputRequired && !input.value.trim()) {
                                validationMsg.textContent = sfUICore.t('required');
                                input.focus();
                                return;
                            }
                            if (settings.yesCallback) settings.yesCallback(input.value);
                            this.close(alertId, input.value);
                        }
                    }
                });

                const cancelBtn = sfUICore.createElement('button', {
                    className: 'sfui-btn sfui-btn-secondary',
                    text: sfUICore.t('cancel'),
                    on: {
                        click: () => this.close(alertId, null)
                    }
                });

                // Enter key handler
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        submitBtn.click();
                    }
                });

                inputWrapper.appendChild(input);
                container.appendChild(inputWrapper);
                container.appendChild(validationMsg);
                container.appendChild(submitBtn);
                container.appendChild(cancelBtn);
                break;
        }

        return container;
    }

    /**
     * Attach event handlers
     */
    attachEventHandlers(wrapper, alertId, settings) {
        const overlay = wrapper.querySelector('.sfui-alert-overlay');
        const modal = wrapper.querySelector('.sfui-alert-modal');
        const dialog = wrapper.querySelector('.sfui-alert-dialog');

        // Setup backdrop click handler using common utility
        sfUICore.setupBackdropHandler({
            overlay,
            modal,
            dialog,
            closeOnBackdropClick: settings.closeOnBackdropClick,
            onClose: () => {
                // For confirm/input type, call noCallback if exists
                if (settings.type === 'confirm' && settings.noCallback) {
                    settings.noCallback();
                }
                this.close(alertId, false);
            }
        });

        // ESC key to close using common utility
        this.escHandler = sfUICore.setupEscHandler(() => {
            // For confirm/input type, call noCallback if exists
            if (settings.type === 'confirm' && settings.noCallback) {
                settings.noCallback();
            }
            this.close(alertId, false);
        });
    }

    /**
     * Close alert dialog
     */
    close(alertId, result) {
        const alert = this.activeAlerts.get(alertId);
        if (!alert) return;

        const wrapper = alert.element;
        const modal = wrapper.querySelector('.sfui-alert-modal');
        const overlay = wrapper.querySelector('.sfui-alert-overlay');

        if (modal) modal.classList.remove('sfui-active');
        if (overlay) overlay.classList.remove('sfui-active');

        // Remove ESC handler
        if (this.escHandler) {
            document.removeEventListener('keydown', this.escHandler);
        }

        setTimeout(() => {
            wrapper.remove();
            this.activeAlerts.delete(alertId);
            alert.resolve(result);
        }, 300);
    }

    /**
     * Close all alerts
     */
    closeAll() {
        this.activeAlerts.forEach((alert, alertId) => {
            this.close(alertId, false);
        });
    }
}

// Export singleton instance
const sfUIAlert = new SfUIAlert();

// Global wrapper functions
function sfAlert(msg, callback) { return sfUIAlert.sfAlert(msg, callback); }
function sfAlertJump(msg, url) { return sfUIAlert.sfAlertJump(msg, url); }
function sfAlertBack(msg) { return sfUIAlert.sfAlertBack(msg); }
function sfNoti(msg, callback) { return sfUIAlert.sfNoti(msg, callback); }
function sfNotiJump(msg, url) { return sfUIAlert.sfNotiJump(msg, url); }
function sfNotiBack(msg) { return sfUIAlert.sfNotiBack(msg); }
function sfConfirm(msg, yesCallback, noCallback) { return sfUIAlert.sfConfirm(msg, yesCallback, noCallback); }
function sfInputConfirm(msg, callback, options) { return sfUIAlert.sfInputConfirm(msg, callback, options); }

