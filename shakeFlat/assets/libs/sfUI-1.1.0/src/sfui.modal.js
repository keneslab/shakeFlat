/**
 * sfUI Modal Module
 * Reusable modal dialogs with customizable headers, bodies, and footers
 * @version 1.1.0
 */

class SfUIModal {
    constructor() {
        this.modals = new Map();
    }

    /**
     * Create or get modal
     */
    create(id, options = {}) {
        // Return existing modal if already created
        if (this.modals.has(id)) {
            return this.modals.get(id).instance;
        }

        const defaults = {
            title: 'Modal Title',
            dialogClass: '',
            dialogStyle: '',
            animation: true,
            verticalCenter: true,
            zIndex: -1,
            closeOnBackdropClick: true,  // 배경 클릭 시 닫기 기능 옵션
            header: {
                enable: true,
                title: '',
                close: true,
                class: '',
                style: ''
            },
            body: {
                html: '',
                class: '',
                style: ''
            },
            footer: {
                enable: true,
                submit: {
                    enable: false,
                    text: sfUICore.t('ok'),
                    class: 'sfui-btn-primary',
                    callback: null
                },
                close: {
                    text: sfUICore.t('close'),
                    class: 'sfui-btn-secondary'
                }
            },
            onShow: null,
            onHide: null,
            onShown: null,
            onHidden: null
        };

        const settings = sfUICore.deepMerge({}, defaults, options);

        // Set header title from main title if not specified
        if (!settings.header.title) {
            settings.header.title = settings.title;
        }

        // Create modal instance
        const instance = new ModalInstance(id, settings);

        this.modals.set(id, {
            instance,
            settings
        });

        return instance;
    }

    /**
     * Get existing modal
     */
    get(id) {
        const modal = this.modals.get(id);
        return modal ? modal.instance : null;
    }

    /**
     * Destroy modal
     */
    destroy(id) {
        const modal = this.modals.get(id);
        if (modal) {
            modal.instance.destroy();
            this.modals.delete(id);
        }
    }

    /**
     * Destroy all modals
     */
    destroyAll() {
        this.modals.forEach((modal, id) => {
            this.destroy(id);
        });
    }
}

/**
 * Modal Instance Class
 */
class ModalInstance {
    constructor(id, settings) {
        this.id = id;
        this.settings = settings;
        this.element = null;
        this.isVisible = false;
        this.backdrop = null;

        this.build();
    }

    /**
     * Build modal structure
     */
    build() {
        const zIndex = this.settings.zIndex > 0
            ? this.settings.zIndex
            : sfUICore.getNextZIndex();

        // Create modal container
        this.element = sfUICore.createElement('div', {
            className: `sfui-modal${this.settings.animation ? ' sfui-fade' : ''}`,
            id: this.id,
            attrs: {
                'role': 'dialog',
                'aria-labelledby': this.settings.title,
                'aria-hidden': 'true',
                'tabindex': '-1'
            },
            styles: {
                zIndex: zIndex
            }
        });

        // Create dialog
        const dialog = sfUICore.createElement('div', {
            className: `sfui-modal-dialog${this.settings.verticalCenter ? ' sfui-modal-dialog-centered' : ''}`
        });

        if (this.settings.dialogClass) {
            dialog.className += ' ' + this.settings.dialogClass;
        }

        if (this.settings.dialogStyle) {
            dialog.setAttribute('style', this.settings.dialogStyle);
        }

        // Create content container
        const content = sfUICore.createElement('div', {
            className: 'sfui-modal-content'
        });

        // Build header
        if (this.settings.header.enable) {
            const header = this.buildHeader();
            content.appendChild(header);
        }

        // Build body
        const body = this.buildBody();
        content.appendChild(body);

        // Build footer
        if (this.settings.footer.enable) {
            const footer = this.buildFooter();
            content.appendChild(footer);
        }

        dialog.appendChild(content);
        this.element.appendChild(dialog);

        // Attach event handlers
        this.attachEventHandlers();

        // Append to body
        document.body.appendChild(this.element);
    }

    /**
     * Build header
     */
    buildHeader() {
        const header = sfUICore.createElement('div', {
            className: 'sfui-modal-header'
        });

        if (this.settings.header.class) {
            header.className += ' ' + this.settings.header.class;
        }

        if (this.settings.header.style) {
            header.setAttribute('style', this.settings.header.style);
        }

        // Add title
        const title = sfUICore.createElement('h5', {
            className: 'sfui-modal-title',
            html: this.settings.header.title
        });
        header.appendChild(title);

        // Add close button
        if (this.settings.header.close) {
            const closeBtn = sfUICore.createElement('button', {
                className: 'sfui-btn-close',
                attrs: {
                    'type': 'button',
                    'aria-label': 'Close'
                },
                on: {
                    click: () => this.hide()
                }
            });
            header.appendChild(closeBtn);
        }

        return header;
    }

    /**
     * Build body
     */
    buildBody() {
        const body = sfUICore.createElement('div', {
            className: 'sfui-modal-body'
        });

        if (this.settings.body.class) {
            body.className += ' ' + this.settings.body.class;
        }

        if (this.settings.body.style) {
            body.setAttribute('style', this.settings.body.style);
        }

        if (this.settings.body.html) {
            body.innerHTML = this.settings.body.html;
        }

        return body;
    }

    /**
     * Build footer
     */
    buildFooter() {
        const footer = sfUICore.createElement('div', {
            className: 'sfui-modal-footer'
        });

        // Add submit button
        if (this.settings.footer.submit.enable) {
            const submitBtn = sfUICore.createElement('button', {
                className: `sfui-btn sfui-btn-sm ${this.settings.footer.submit.class}`,
                html: this.settings.footer.submit.text,
                on: {
                    click: () => {
                        if (this.settings.footer.submit.callback) {
                            this.settings.footer.submit.callback();
                        }
                    }
                }
            });
            footer.appendChild(submitBtn);
        }

        // Add close button
        if (this.settings.footer.close) {
            const closeBtn = sfUICore.createElement('button', {
                className: `sfui-btn sfui-btn-sm ${this.settings.footer.close.class}`,
                html: this.settings.footer.close.text,
                on: {
                    click: () => this.hide()
                }
            });
            footer.appendChild(closeBtn);
        }

        return footer;
    }

    /**
     * Attach event handlers
     */
    attachEventHandlers() {
        // Note: Backdrop click handler is set up in createBackdrop()
        // Modal element has pointer-events: none to allow clicks to pass through to backdrop

        // ESC key to close using common utility
        this.escHandler = sfUICore.setupEscHandler(() => {
            if (this.isVisible) {
                this.hide();
            }
        });
    }

    /**
     * Show modal
     */
    show() {
        if (this.isVisible) return this;

        // Trigger onShow callback
        if (this.settings.onShow) {
            this.settings.onShow.call(this);
        }

        // Handle nested modals - adjust z-index and position
        const activeModals = document.querySelectorAll('.sfui-modal.sfui-active');
        const nestLevel = activeModals.length;

        if (nestLevel > 0) {
            // Get highest z-index from active modals
            let maxZIndex = 0;
            activeModals.forEach(modal => {
                const zIndex = parseInt(window.getComputedStyle(modal).zIndex) || 0;
                if (zIndex > maxZIndex) maxZIndex = zIndex;
            });

            // Set new z-index higher than existing modals
            const newZIndex = maxZIndex + 10;
            this.element.style.zIndex = newZIndex;

            // Apply offset for nested modals
            const dialog = this.element.querySelector('.sfui-modal-dialog');
            if (dialog) {
                const offset = nestLevel * 30; // 30px offset per level
                dialog.style.marginTop = `${1.75 + (offset / 16)}rem`;
                dialog.style.marginLeft = `${offset}px`;
            }
        }

        // Create backdrop
        this.createBackdrop();

        // Show modal
        this.element.style.display = 'block';
        this.element.setAttribute('aria-hidden', 'false');
        this.isVisible = true;

        // Trigger animation
        setTimeout(() => {
            this.element.classList.add('sfui-active');
            if (this.backdrop) {
                this.backdrop.classList.add('sfui-active');
            }

            // Trigger onShown callback
            if (this.settings.onShown) {
                this.settings.onShown.call(this);
            }

            // Focus first focusable element
            const focusable = this.element.querySelector('button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
            if (focusable) {
                focusable.focus();
            }
        }, 10);

        return this;
    }

    /**
     * Hide modal
     */
    hide() {
        if (!this.isVisible) return this;

        // Trigger onHide callback
        if (this.settings.onHide) {
            this.settings.onHide.call(this);
        }

        // Blur ALL focusable elements inside modal BEFORE setting aria-hidden
        // This prevents "Blocked aria-hidden on an element because its descendant retained focus" warning
        const focusableElements = this.element.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        focusableElements.forEach(element => {
            if (element === document.activeElement) {
                element.blur();
            }
        });

        // Also blur the modal element itself if it has focus
        if (this.element === document.activeElement) {
            this.element.blur();
        }

        // Use requestAnimationFrame to ensure blur has completed before setting aria-hidden
        requestAnimationFrame(() => {
            // Set aria-hidden AFTER blurring to avoid accessibility warnings
            this.element.setAttribute('aria-hidden', 'true');
        });

        // Hide with animation
        this.element.classList.remove('sfui-active');
        if (this.backdrop) {
            this.backdrop.classList.remove('sfui-active');
        }

        setTimeout(() => {
            this.element.style.display = 'none';
            this.isVisible = false;

            // Remove backdrop
            if (this.backdrop) {
                this.backdrop.remove();
                this.backdrop = null;
            }

            // Reset position offset for nested modals
            const dialog = this.element.querySelector('.sfui-modal-dialog');
            if (dialog) {
                dialog.style.marginTop = '';
                dialog.style.marginLeft = '';
            }

            // Trigger onHidden callback
            if (this.settings.onHidden) {
                this.settings.onHidden.call(this);
            }

            // Refocus previous modal if exists
            const activeModals = document.querySelectorAll('.sfui-modal.sfui-active');
            if (activeModals.length > 0) {
                const lastModal = activeModals[activeModals.length - 1];
                const focusable = lastModal.querySelector('button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
                if (focusable) {
                    focusable.focus();
                }
            }
        }, 300);

        return this;
    }

    /**
     * Toggle modal visibility
     */
    toggle() {
        return this.isVisible ? this.hide() : this.show();
    }

    /**
     * Create backdrop
     */
    createBackdrop() {
        if (this.backdrop) return;

        const zIndex = parseInt(this.element.style.zIndex) - 1;

        this.backdrop = sfUICore.createElement('div', {
            className: 'sfui-modal-backdrop sfui-fade',
            styles: {
                zIndex: zIndex
            }
        });

        // Setup backdrop click handler
        // Backdrop catches all clicks outside the dialog since modal has pointer-events: none
        const dialog = this.element.querySelector('.sfui-modal-dialog');

        this.backdrop.addEventListener('click', (e) => {
            // Backdrop click handler - always closes when closeOnBackdropClick is true
            if (this.settings.closeOnBackdropClick) {
                this.hide();
            } else {
                // Shake the dialog to indicate it can't be closed by clicking outside
                if (dialog) {
                    sfUICore.shakeElement(dialog);
                }
            }
        });

        document.body.appendChild(this.backdrop);
    }

    /**
     * Get modal body element
     */
    getBody() {
        return this.element.querySelector('.sfui-modal-body');
    }

    /**
     * Set body content
     */
    setBody(html) {
        const body = this.getBody();
        if (body) {
            body.innerHTML = html;
        }
        return this;
    }

    /**
     * Get modal header element
     */
    getHeader() {
        return this.element.querySelector('.sfui-modal-header');
    }

    /**
     * Set header title
     */
    setTitle(title) {
        const titleEl = this.element.querySelector('.sfui-modal-title');
        if (titleEl) {
            titleEl.innerHTML = title;
        }
        return this;
    }

    /**
     * Get modal footer element
     */
    getFooter() {
        return this.element.querySelector('.sfui-modal-footer');
    }

    /**
     * Destroy modal
     */
    destroy() {
        this.hide();

        // Remove event listeners
        document.removeEventListener('keydown', this.escHandler);

        // Remove element
        setTimeout(() => {
            if (this.element) {
                this.element.remove();
                this.element = null;
            }
        }, 350);
    }
}

// Export singleton instance
const sfUIModal = new SfUIModal();

// Legacy function wrapper
function sfModal(id, options) {
    return sfUIModal.create(id, options);
}
