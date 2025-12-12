/**
 * sfUI Notice Board Component
 * Notice board web component for displaying messages with different styles
 * @version 1.1.0
 */

class SFUINoticeBoard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this._themeObserver = null;
    }

    connectedCallback() {
        this.render();
        this.setupThemeObserver();
    }

    disconnectedCallback() {
        if (this._themeObserver) {
            this._themeObserver.disconnect();
        }
    }

    render() {
        const styleOption = this.getAttribute("type") || "notice";
        const colorTheme = this.getAttribute("color") || ""; // New color attribute
        const title = this.getAttribute("title") || "Notice";
        const message = this.getAttribute("message") || "";

        let boardClass = "";
        let badgeClass = "";

        // If color theme is specified, use it; otherwise use type-based styling
        if (colorTheme) {
            boardClass = `sfui-board-color sfui-board-${colorTheme}`;
            badgeClass = `sfui-board-badge-color sfui-board-badge-${colorTheme}`;
        } else {
            switch (styleOption) {
                case "notice":
                    boardClass = "sfui-board-notice";
                    badgeClass = "sfui-board-badge-notice";
                    break;
                case "hint":
                    boardClass = "sfui-board-hint";
                    badgeClass = "sfui-board-badge-hint";
                    break;
                case "plain":
                    boardClass = "sfui-board-plain";
                    badgeClass = "sfui-board-badge-plain";
                    break;
                default:
                    boardClass = "sfui-board-notice";
                    badgeClass = "sfui-board-badge-notice";
            }
        }

        const currentTheme = this.getCurrentTheme();

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                }

                .sfui-board {
                    border-radius: 0.25rem;
                    padding: 0.4rem 0.5rem;
                    display: flex;
                    align-items: start;
                    gap: 0.625rem;
                }

                .sfui-board-badge {
                    white-space: nowrap;
                    border-radius: 0.25rem;
                    font-size: 0.875rem;
                    font-weight: 600;
                    padding: 0.375rem 0.75rem;
                    flex-shrink: 0;
                    align-self: stretch;
                    display: flex;
                    align-items: center;
                }

                .sfui-board-message {
                    flex: 1;
                    line-height: 1.6;
                    padding: 0.375rem 0;
                }

                /* Light theme - Plain */
                .sfui-board-plain {
                    background-color: #f8f9fa;
                    border: 1px solid #dee2e6;
                    color: #212529;
                }

                .sfui-board-badge-plain {
                    background-color: #6c757d;
                    color: #ffffff;
                }

                /* Light theme - Notice */
                .sfui-board-notice {
                    background-color: #cfe2ff;
                    border: 1px solid #9ec5fe;
                    color: #084298;
                }

                .sfui-board-badge-notice {
                    background-color: #0d6efd;
                    color: #ffffff;
                }

                /* Light theme - Hint */
                .sfui-board-hint {
                    background-color: #d1ecf1;
                    border: 1px solid #9eeaf9;
                    color: #055160;
                }

                .sfui-board-badge-hint {
                    background-color: #0dcaf0;
                    color: #000000;
                }

                /* Dark theme - Plain */
                :host([theme="dark"]) .sfui-board-plain {
                    background-color: #343a40;
                    border: 1px solid #495057;
                    color: #f8f9fa;
                }

                :host([theme="dark"]) .sfui-board-badge-plain {
                    background-color: #6c757d;
                    color: #ffffff;
                }

                /* Dark theme - Notice */
                :host([theme="dark"]) .sfui-board-notice {
                    background-color: #052c65;
                    border: 1px solid #084298;
                    color: #cfe2ff;
                }

                :host([theme="dark"]) .sfui-board-badge-notice {
                    background-color: #0d6efd;
                    color: #ffffff;
                }

                /* Dark theme - Hint */
                :host([theme="dark"]) .sfui-board-hint {
                    background-color: #032830;
                    border: 1px solid #055160;
                    color: #cff4fc;
                }

                :host([theme="dark"]) .sfui-board-badge-hint {
                    background-color: #0dcaf0;
                    color: #000000;
                }

                /* Color Themes - Primary (Blue) */
                .sfui-board-primary {
                    background-color: #cfe2ff;
                    border: 1px solid #9ec5fe;
                    color: #084298;
                }

                .sfui-board-badge-primary {
                    background-color: #0d6efd;
                    color: #ffffff;
                }

                :host([theme="dark"]) .sfui-board-primary {
                    background-color: #031633;
                    border: 1px solid #084298;
                    color: #6ea8fe;
                }

                :host([theme="dark"]) .sfui-board-badge-primary {
                    background-color: #0d6efd;
                    color: #ffffff;
                }

                /* Color Themes - Success (Green) */
                .sfui-board-success {
                    background-color: #d1e7dd;
                    border: 1px solid #a3cfbb;
                    color: #0a3622;
                }

                .sfui-board-badge-success {
                    background-color: #198754;
                    color: #ffffff;
                }

                :host([theme="dark"]) .sfui-board-success {
                    background-color: #051b11;
                    border: 1px solid #0f5132;
                    color: #75b798;
                }

                :host([theme="dark"]) .sfui-board-badge-success {
                    background-color: #198754;
                    color: #ffffff;
                }

                /* Color Themes - Danger (Red) */
                .sfui-board-danger {
                    background-color: #f8d7da;
                    border: 1px solid #f1aeb5;
                    color: #58151c;
                }

                .sfui-board-badge-danger {
                    background-color: #dc3545;
                    color: #ffffff;
                }

                :host([theme="dark"]) .sfui-board-danger {
                    background-color: #2c0b0e;
                    border: 1px solid #842029;
                    color: #ea868f;
                }

                :host([theme="dark"]) .sfui-board-badge-danger {
                    background-color: #dc3545;
                    color: #ffffff;
                }

                /* Color Themes - Warning (Yellow) */
                .sfui-board-warning {
                    background-color: #fff3cd;
                    border: 1px solid #ffe69c;
                    color: #664d03;
                }

                .sfui-board-badge-warning {
                    background-color: #ffc107;
                    color: #000000;
                }

                :host([theme="dark"]) .sfui-board-warning {
                    background-color: #332701;
                    border: 1px solid #997404;
                    color: #ffda6a;
                }

                :host([theme="dark"]) .sfui-board-badge-warning {
                    background-color: #ffc107;
                    color: #000000;
                }

                /* Color Themes - Info (Cyan) */
                .sfui-board-info {
                    background-color: #cff4fc;
                    border: 1px solid #9eeaf9;
                    color: #055160;
                }

                .sfui-board-badge-info {
                    background-color: #0dcaf0;
                    color: #000000;
                }

                :host([theme="dark"]) .sfui-board-info {
                    background-color: #032830;
                    border: 1px solid #087990;
                    color: #6edff6;
                }

                :host([theme="dark"]) .sfui-board-badge-info {
                    background-color: #0dcaf0;
                    color: #000000;
                }
            </style>

            <div class="sfui-board ${boardClass}">
                <div class="sfui-board-badge ${badgeClass}">${title}</div>
                <div class="sfui-board-message">${message}</div>
            </div>
        `;

        this.updateTheme();
    }

    getCurrentTheme() {
        return document.documentElement.getAttribute('data-bs-theme') ||
               document.body.getAttribute('data-bs-theme') ||
               'light';
    }

    updateTheme() {
        const theme = this.getCurrentTheme();
        this.setAttribute('theme', theme);
    }

    setupThemeObserver() {
        // Watch for theme changes on document element
        this._themeObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'data-bs-theme') {
                    this.updateTheme();
                }
            });
        });

        // Observe both html and body elements
        this._themeObserver.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-bs-theme']
        });

        if (document.body) {
            this._themeObserver.observe(document.body, {
                attributes: true,
                attributeFilter: ['data-bs-theme']
            });
        }
    }

    // Allow external theme updates
    static updateAllThemes() {
        document.querySelectorAll('sf-notice').forEach(notice => {
            if (notice.updateTheme) {
                notice.updateTheme();
            }
        });
    }
}

// Register the component if not already registered
if (!customElements.get('sf-notice')) {
    customElements.define('sf-notice', SFUINoticeBoard);
}

// Make available globally for backward compatibility
if (typeof window !== 'undefined') {
    window.SFUINoticeBoard = SFUINoticeBoard;
}
