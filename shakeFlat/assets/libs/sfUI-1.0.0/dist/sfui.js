/*!
 * sfUI - Unified UI Component Library
 * Version 1.0.0
 * Copyright (c) 2025
 * Licensed under MIT
 */

/**
 * sfUI Core Module
 * Common utilities and base functionality for all sfUI components
 * @version 1.0.0
 */

class SfUICore {
    constructor() {
        this.config = {
            zIndexBase: 10000,
            animationDuration: 300,
            language: 'ko',
            // Common default settings for components
            defaults: {
                closeOnBackdropClick: true,
                verticalCenter: true,
                animation: true
            }
        };

        // Font management
        this.fonts = {
            loaded: new Set(),
            loading: new Map(),
            cssStyleElement: null
        };

        this.translations = {
            ko: {
                alert: '알림',
                confirm: '확인',
                cancel: '취소',
                ok: '확인',
                yes: '예',
                no: '아니오',
                required: '필수 입력값입니다.',
                close: '닫기'
            },
            en: {
                alert: 'Alert',
                confirm: 'Confirm',
                cancel: 'Cancel',
                ok: 'OK',
                yes: 'Yes',
                no: 'No',
                required: 'This is required input.',
                close: 'Close'
            }
        };
    }

    /**
     * Get translation text
     */
    t(key) {
        return this.translations[this.config.language][key] || key;
    }

    /**
     * Initialize sfUI with configuration
     */
    init(options = {}) {
        if (options.language) this.config.language = options.language;
        if (options.zIndexBase) this.config.zIndexBase = options.zIndexBase;
        if (options.animationDuration) this.config.animationDuration = options.animationDuration;

        // Update default settings
        if (options.defaults) {
            this.config.defaults = { ...this.config.defaults, ...options.defaults };
        }

        return this;
    }

    /**
     * Get default setting value
     */
    getDefault(key) {
        return this.config.defaults[key];
    }

    /**
     * Get current language
     */
    getLanguage() {
        return this.config.language;
    }

    /**
     * Set language
     */
    setLanguage(lang) {
        if (this.translations[lang]) {
            this.config.language = lang;
        }
    }

    /**
     * Create element with attributes and styles
     */
    createElement(tag, options = {}) {
        const el = document.createElement(tag);

        if (options.className) {
            el.className = options.className;
        }

        if (options.id) {
            el.id = options.id;
        }

        if (options.text) {
            el.textContent = options.text;
        }

        if (options.html) {
            el.innerHTML = options.html;
        }

        if (options.attrs) {
            Object.entries(options.attrs).forEach(([key, value]) => {
                el.setAttribute(key, value);
            });
        }

        if (options.styles) {
            Object.entries(options.styles).forEach(([key, value]) => {
                el.style[key] = value;
            });
        }

        if (options.on) {
            Object.entries(options.on).forEach(([event, handler]) => {
                el.addEventListener(event, handler);
            });
        }

        return el;
    }

    /**
     * Get next available z-index
     */
    getNextZIndex() {
        const modals = document.querySelectorAll('.sfui-overlay, .sfui-modal, .modal-backdrop');
        let maxZ = this.config.zIndexBase;

        modals.forEach(modal => {
            const z = parseInt(window.getComputedStyle(modal).zIndex) || 0;
            if (z > maxZ) maxZ = z;
        });

        return maxZ + 10;
    }

    /**
     * Get string width for auto-sizing
     */
    getStringWidth(text) {
        const canvas = this.getStringWidth.canvas || (this.getStringWidth.canvas = document.createElement('canvas'));
        const context = canvas.getContext('2d');
        context.font = '16px Arial';
        const metrics = context.measureText(text);
        return Math.ceil(metrics.width);
    }

    /**
     * Strip HTML tags from string
     */
    stripHTML(html) {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    }

    /**
     * Format number with thousands separator
     */
    formatNumber(number, decimals = 0, decimalSep = '.', thousandsSep = ',') {
        number = String(number).replace(/[^0-9+\-Ee.]/g, '');
        const n = !isFinite(+number) ? 0 : +number;
        const prec = !isFinite(+decimals) ? 0 : Math.abs(decimals);

        let s = (prec ? n.toFixed(prec) : String(Math.round(n))).split('.');

        if (s[0].length > 3) {
            s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, thousandsSep);
        }

        if ((s[1] || '').length < prec) {
            s[1] = s[1] || '';
            s[1] += new Array(prec - s[1].length + 1).join('0');
        }

        return s.join(decimalSep);
    }

    /**
     * Format number to short form (K, M, G, T)
     */
    formatNumberShort(number) {
        if (number >= 1e12) return (number / 1e12).toFixed((number % 1e12 === 0) ? 0 : 1) + 'T';
        if (number >= 1e9) return (number / 1e9).toFixed((number % 1e9 === 0) ? 0 : 1) + 'G';
        if (number >= 1e6) return (number / 1e6).toFixed((number % 1e6 === 0) ? 0 : 1) + 'M';
        if (number >= 1e3) return (number / 1e3).toFixed((number % 1e3 === 0) ? 0 : 1) + 'K';
        return number;
    }

    /**
     * Fade in element
     */
    fadeIn(element, duration = this.config.animationDuration) {
        element.style.opacity = 0;
        element.style.display = 'flex';

        let start = null;
        const animate = (timestamp) => {
            if (!start) start = timestamp;
            const progress = timestamp - start;
            const opacity = Math.min(progress / duration, 1);

            element.style.opacity = opacity;

            if (progress < duration) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    /**
     * Fade out element
     */
    fadeOut(element, duration = this.config.animationDuration) {
        return new Promise(resolve => {
            let start = null;
            const animate = (timestamp) => {
                if (!start) start = timestamp;
                const progress = timestamp - start;
                const opacity = Math.max(1 - (progress / duration), 0);

                element.style.opacity = opacity;

                if (progress < duration) {
                    requestAnimationFrame(animate);
                } else {
                    element.style.display = 'none';
                    resolve();
                }
            };

            requestAnimationFrame(animate);
        });
    }

    /**
     * Get current theme (light/dark)
     * Priority: 1. Bootstrap data-bs-theme, 2. html data-theme, 3. prefers-color-scheme
     */
    getTheme() {
        // Check Bootstrap 5 theme on html or body
        const htmlTheme = document.documentElement.getAttribute('data-bs-theme');
        if (htmlTheme === 'dark' || htmlTheme === 'light') {
            return htmlTheme;
        }

        const bodyTheme = document.body?.getAttribute('data-bs-theme');
        if (bodyTheme === 'dark' || bodyTheme === 'light') {
            return bodyTheme;
        }

        // Check custom data-theme attribute
        const customTheme = document.documentElement.getAttribute('data-theme');
        if (customTheme === 'dark' || customTheme === 'light') {
            return customTheme;
        }

        // Fallback to system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }

        return 'light';
    }

    /**
     * Set theme
     */
    setTheme(theme) {
        if (theme !== 'light' && theme !== 'dark') {
            return;
        }

        // Set Bootstrap theme
        document.documentElement.setAttribute('data-bs-theme', theme);
        document.body?.setAttribute('data-bs-theme', theme);

        // Set custom theme
        document.documentElement.setAttribute('data-theme', theme);

        // Trigger theme change event
        window.dispatchEvent(new CustomEvent('sfui:themechange', {
            detail: { theme }
        }));
    }

    /**
     * Toggle theme between light and dark
     */
    toggleTheme() {
        const currentTheme = this.getTheme();
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
        return newTheme;
    }

    /**
     * Add theme change callback (simplified interface)
     */
    onThemeChange(callback) {
        // Listen to custom event
        window.addEventListener('sfui:themechange', (e) => {
            callback(e.detail.theme);
        });

        // Also watch for direct attribute changes
        this.watchThemeChanges(callback);
    }

    /**
     * Watch for theme changes
     */
    watchThemeChanges(callback) {
        // Watch for attribute changes on html and body
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' &&
                    (mutation.attributeName === 'data-bs-theme' ||
                     mutation.attributeName === 'data-theme')) {
                    const newTheme = this.getTheme();
                    callback(newTheme);
                }
            });
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-bs-theme', 'data-theme']
        });

        if (document.body) {
            observer.observe(document.body, {
                attributes: true,
                attributeFilter: ['data-bs-theme', 'data-theme']
            });
        }

        // Watch for system preference changes
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handler = () => {
                const newTheme = this.getTheme();
                callback(newTheme);
            };

            if (mediaQuery.addEventListener) {
                mediaQuery.addEventListener('change', handler);
            } else {
                mediaQuery.addListener(handler);
            }
        }

        return observer;
    }

    /**
     * Deep merge objects
     */
    deepMerge(target, ...sources) {
        if (!sources.length) return target;
        const source = sources.shift();

        if (this.isObject(target) && this.isObject(source)) {
            for (const key in source) {
                if (this.isObject(source[key])) {
                    if (!target[key]) Object.assign(target, { [key]: {} });
                    this.deepMerge(target[key], source[key]);
                } else {
                    Object.assign(target, { [key]: source[key] });
                }
            }
        }

        return this.deepMerge(target, ...sources);
    }

    /**
     * Check if value is object
     */
    isObject(item) {
        return item && typeof item === 'object' && !Array.isArray(item);
    }

    /**
     * Shake element animation to indicate it cannot be closed
     * (Common utility for alert, modal, etc.)
     */
    shakeElement(element) {
        if (!element) return;

        // Remove existing animation classes
        element.classList.remove('sfui-shake', 'sfui-shake-scale');

        // Trigger reflow to restart animation
        void element.offsetWidth;

        // Add shake animation
        element.classList.add('sfui-shake');

        // Remove class after animation completes
        setTimeout(() => {
            element.classList.remove('sfui-shake');
        }, 500);
    }

    /**
     * Setup backdrop click handler
     * (Common utility for components with backdrop)
     */
    setupBackdropHandler(options) {
        const {
            overlay,
            modal,
            dialog,
            closeOnBackdropClick = true,
            onClose,
            onShake
        } = options;

        const handleClick = (e) => {
            // Only handle if clicking the modal/overlay itself, not the dialog
            if (e.target === modal || e.target === overlay) {
                if (closeOnBackdropClick) {
                    if (onClose) onClose();
                } else {
                    if (onShake) onShake();
                    else if (dialog) this.shakeElement(dialog);
                }
            }
        };

        if (modal) {
            modal.addEventListener('click', handleClick);
        }
        if (overlay) {
            overlay.addEventListener('click', handleClick);
        }

        // Prevent dialog clicks from bubbling
        if (dialog) {
            dialog.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }

        return handleClick;
    }

    /**
     * Setup ESC key handler
     * (Common utility for closeable components)
     */
    setupEscHandler(onEscape) {
        const handler = (e) => {
            if (e.key === 'Escape') {
                onEscape();
            }
        };
        document.addEventListener('keydown', handler);
        return handler;
    }

    /**
     * Remove event listener safely
     */
    removeEventListener(element, event, handler) {
        if (element && handler) {
            element.removeEventListener(event, handler);
        }
    }

    /**
     * Batch update element styles
     */
    updateStyles(element, styles) {
        if (!element || !styles) return;
        Object.entries(styles).forEach(([key, value]) => {
            element.style[key] = value;
        });
    }

    /**
     * Auto-initialize components with data attributes
     */
    autoInit() {
        // Auto-initialize lightbox
        const lightboxElements = document.querySelectorAll('[data-sflightbox]');
        if (lightboxElements.length > 0 && typeof sfUILightBox !== 'undefined') {
            sfUILightBox.init(lightboxElements);
        }

        // Auto-initialize range sliders
        const rangeSliderElements = document.querySelectorAll('[data-sfrangeslider]');
        if (rangeSliderElements.length > 0 && typeof sfUIRangeSlider !== 'undefined') {
            rangeSliderElements.forEach(element => {
                sfUIRangeSlider.init(element);
            });
        }
    }

    /**
     * Load web font dynamically
     * @param {Object|Array} fontConfig - Font configuration object or array of objects
     * @param {string} fontConfig.family - Font family name
     * @param {string|Array} fontConfig.src - Font source URL(s) or array of {url, format} objects
     * @param {string|number} fontConfig.weight - Font weight (default: 400)
     * @param {string} fontConfig.style - Font style (default: 'normal')
     * @param {string} fontConfig.display - Font display (default: 'swap')
     * @returns {Promise} Promise that resolves when font(s) are loaded
     *
     * @example
     * // Single font with simple URL
     * sfUICore.loadFont({
     *   family: 'Roboto',
     *   src: 'https://fonts.googleapis.com/css?family=Roboto'
     * });
     *
     * @example
     * // Single font with multiple sources
     * sfUICore.loadFont({
     *   family: 'My Font',
     *   src: [
     *     { url: '/fonts/myfont.woff2', format: 'woff2' },
     *     { url: '/fonts/myfont.woff', format: 'woff' },
     *     { url: '/fonts/myfont.ttf', format: 'truetype' }
     *   ],
     *   weight: 400,
     *   style: 'normal'
     * });
     *
     * @example
     * // Multiple fonts
     * sfUICore.loadFont([
     *   { family: 'Noto Sans KR', src: 'https://fonts.googleapis.com/css?family=Noto+Sans+KR' },
     *   { family: 'Roboto', src: 'https://fonts.googleapis.com/css?family=Roboto', weight: 700 }
     * ]);
     *
     * @example
     * // With callback
     * sfUICore.loadFont({
     *   family: 'Custom Font',
     *   src: '/fonts/custom.woff2'
     * }).then(() => {
     *   console.log('Font loaded successfully!');
     *   document.body.style.fontFamily = 'Custom Font';
     * });
     */
    loadFont(fontConfig) {
        // Handle array of font configs
        if (Array.isArray(fontConfig)) {
            return Promise.all(fontConfig.map(config => this._loadSingleFont(config)));
        }

        return this._loadSingleFont(fontConfig);
    }

    /**
     * Load single font
     * @private
     */
    _loadSingleFont(config) {
        const {
            family,
            src,
            weight = 400,
            style = 'normal',
            display = 'block'  // Changed from 'swap' to 'block' to prevent font flashing
        } = config;

        if (!family || !src) {
            return Promise.reject(new Error('Font family and src are required'));
        }

        const fontKey = `${family}-${weight}-${style}`;

        // Return existing promise if font is already loading
        if (this.fonts.loading.has(fontKey)) {
            return this.fonts.loading.get(fontKey);
        }

        // Return resolved promise if font is already loaded
        if (this.fonts.loaded.has(fontKey)) {
            return Promise.resolve();
        }

        // Check if src is a Google Fonts or external CSS URL
        if (typeof src === 'string' && (src.startsWith('http') || src.startsWith('//'))) {
            const promise = this._loadFontFromCSS(src, family, weight, style);
            this.fonts.loading.set(fontKey, promise);

            promise.then(() => {
                this.fonts.loaded.add(fontKey);
                this.fonts.loading.delete(fontKey);
            }).catch(() => {
                this.fonts.loading.delete(fontKey);
            });

            return promise;
        }

        // Load from font files
        const promise = this._loadFontFromFiles(family, src, weight, style, display);
        this.fonts.loading.set(fontKey, promise);

        promise.then(() => {
            this.fonts.loaded.add(fontKey);
            this.fonts.loading.delete(fontKey);
        }).catch(() => {
            this.fonts.loading.delete(fontKey);
        });

        return promise;
    }

    /**
     * Load font from external CSS (like Google Fonts)
     * @private
     */
    _loadFontFromCSS(cssUrl, family, weight, style) {
        return new Promise((resolve, reject) => {
            // Check if link already exists
            const existingLink = document.querySelector(`link[href="${cssUrl}"]`);
            if (existingLink) {
                resolve();
                return;
            }

            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = cssUrl;

            link.onload = () => {
                // Wait for font to be ready
                if (document.fonts && document.fonts.ready) {
                    document.fonts.ready.then(() => resolve());
                } else {
                    // Fallback for browsers without FontFaceSet API
                    setTimeout(resolve, 100);
                }
            };

            link.onerror = () => {
                reject(new Error(`Failed to load font CSS: ${cssUrl}`));
            };

            document.head.appendChild(link);
        });
    }

    /**
     * Load font from font files
     * @private
     */
    _loadFontFromFiles(family, src, weight, style, display) {
        return new Promise((resolve, reject) => {
            try {
                // Create @font-face CSS rule
                const fontFaceRule = this._createFontFaceRule(family, src, weight, style, display);

                // Create or get style element
                if (!this.fonts.cssStyleElement) {
                    this.fonts.cssStyleElement = document.createElement('style');
                    this.fonts.cssStyleElement.setAttribute('data-sfui-fonts', 'true');
                    document.head.appendChild(this.fonts.cssStyleElement);
                }

                // Add font-face rule
                this.fonts.cssStyleElement.textContent += fontFaceRule + '\n';

                // Use Font Loading API if available
                if ('FontFace' in window) {
                    const fontSources = Array.isArray(src) ? src : [{ url: src, format: this._detectFontFormat(src) }];
                    const fontFace = new FontFace(
                        family,
                        this._buildFontSrc(fontSources),
                        { weight: String(weight), style }
                    );

                    fontFace.load().then((loadedFace) => {
                        document.fonts.add(loadedFace);
                        resolve();
                    }).catch(reject);
                } else {
                    // Fallback for older browsers
                    setTimeout(resolve, 100);
                }
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Create @font-face CSS rule
     * @private
     */
    _createFontFaceRule(family, src, weight, style, display) {
        const sources = Array.isArray(src) ? src : [{ url: src, format: this._detectFontFormat(src) }];
        const srcValue = sources.map(source => {
            const url = typeof source === 'string' ? source : source.url;
            const format = typeof source === 'string' ? this._detectFontFormat(source) : source.format;
            return `url('${url}')${format ? ` format('${format}')` : ''}`;
        }).join(', ');

        return `
@font-face {
    font-family: '${family}';
    src: ${srcValue};
    font-weight: ${weight};
    font-style: ${style};
    font-display: ${display};
}`;
    }

    /**
     * Build font src for FontFace API
     * @private
     */
    _buildFontSrc(sources) {
        return sources.map(source => {
            const url = typeof source === 'string' ? source : source.url;
            const format = typeof source === 'string' ? this._detectFontFormat(source) : source.format;
            return `url('${url}')${format ? ` format('${format}')` : ''}`;
        }).join(', ');
    }

    /**
     * Detect font format from file extension
     * @private
     */
    _detectFontFormat(url) {
        const ext = url.split('.').pop().split('?')[0].toLowerCase();
        const formatMap = {
            'woff2': 'woff2',
            'woff': 'woff',
            'ttf': 'truetype',
            'otf': 'opentype',
            'eot': 'embedded-opentype',
            'svg': 'svg'
        };
        return formatMap[ext] || null;
    }

    /**
     * Check if a font is loaded
     * @param {string} family - Font family name
     * @param {string|number} weight - Font weight (optional)
     * @param {string} style - Font style (optional)
     * @returns {boolean}
     */
    isFontLoaded(family, weight = 400, style = 'normal') {
        const fontKey = `${family}-${weight}-${style}`;
        return this.fonts.loaded.has(fontKey);
    }

    /**
     * Wait for font to be ready
     * @param {string} family - Font family name
     * @param {string} text - Sample text to check (default: 'BESbswy')
     * @param {number} timeout - Timeout in milliseconds (default: 3000)
     * @returns {Promise}
     */
    waitForFont(family, text = 'BESbswy', timeout = 3000) {
        if (document.fonts && document.fonts.check) {
            return Promise.race([
                document.fonts.ready.then(() => {
                    if (document.fonts.check(`12px "${family}"`, text)) {
                        return true;
                    }
                    throw new Error('Font not available');
                }),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Font load timeout')), timeout)
                )
            ]);
        }

        // Fallback for older browsers
        return new Promise((resolve) => setTimeout(resolve, 100));
    }

    /**
     * Preload fonts (load fonts in the background)
     * @param {Array} fontConfigs - Array of font configuration objects
     * @returns {Promise}
     */
    preloadFonts(fontConfigs) {
        return this.loadFont(fontConfigs);
    }

    /**
     * Get all loaded fonts
     * @returns {Array}
     */
    getLoadedFonts() {
        return Array.from(this.fonts.loaded);
    }

    /**
     * Apply font to web component (with Shadow DOM support)
     * @param {HTMLElement|string} component - Web component element or selector
     * @param {string} fontFamily - Font family name to apply
     * @param {Object} options - Additional options
     * @returns {boolean} - Success status
     */
    applyFontToComponent(component, fontFamily, options = {}) {
        const defaults = {
            selector: '*', // CSS selector to apply font
            important: true, // Use !important flag
            additionalStyles: '' // Additional CSS to inject
        };

        const settings = { ...defaults, ...options };

        // Get component element
        let element;
        if (typeof component === 'string') {
            element = document.querySelector(component);
        } else if (component instanceof HTMLElement) {
            element = component;
        } else {
            console.error('[sfUICore] Invalid component parameter');
            return false;
        }

        if (!element) {
            console.error('[sfUICore] Component not found');
            return false;
        }

        // Check if component has Shadow DOM
        if (!element.shadowRoot) {
            element.style.fontFamily = `'${fontFamily}', sans-serif`;
            return true;
        }

        // Find or create custom style element in Shadow DOM
        let styleId = 'sfui-custom-font-style';
        let styleElement = element.shadowRoot.getElementById(styleId);

        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = styleId;
            element.shadowRoot.appendChild(styleElement);
        }

        // Build CSS content
        const important = settings.important ? ' !important' : '';
        let cssContent = `
            ${settings.selector} {
                font-family: '${fontFamily}', sans-serif${important};
            }
        `;

        if (settings.additionalStyles) {
            cssContent += '\n' + settings.additionalStyles;
        }

        styleElement.textContent = cssContent;

        return true;
    }

    /**
     * Apply font to multiple web components
     * @param {Array} components - Array of component elements or selectors
     * @param {string} fontFamily - Font family name to apply
     * @param {Object} options - Additional options
     * @returns {Object} - Result with success count and errors
     */
    applyFontToComponents(components, fontFamily, options = {}) {
        const results = {
            success: 0,
            failed: 0,
            errors: []
        };

        if (!Array.isArray(components)) {
            components = [components];
        }

        components.forEach((component, index) => {
            try {
                const success = this.applyFontToComponent(component, fontFamily, options);
                if (success) {
                    results.success++;
                } else {
                    results.failed++;
                    results.errors.push({ index, component, error: 'Failed to apply font' });
                }
            } catch (error) {
                results.failed++;
                results.errors.push({ index, component, error: error.message });
            }
        });

        return results;
    }

    /**
     * Apply font to all sfUI web components in the page
     * @param {string} fontFamily - Font family name to apply
     * @param {Object} options - Additional options
     * @returns {Object} - Result with success count and errors
     */
    applyFontToAllComponents(fontFamily, options = {}) {
        // Find all sfUI web components (custom elements starting with 'sf-')
        const components = document.querySelectorAll('[is^="sf-"], sf-sidebar, sf-modal, sf-alert, sf-lightbox');

        // Also try to find by tag name pattern
        const allElements = document.querySelectorAll('*');
        const sfComponents = Array.from(allElements).filter(el =>
            el.tagName.toLowerCase().startsWith('sf-')
        );

        const allComponents = new Set([...components, ...sfComponents]);

        return this.applyFontToComponents(Array.from(allComponents), fontFamily, options);
    }

    /**
     * Remove custom font from web component
     * @param {HTMLElement|string} component - Web component element or selector
     * @returns {boolean} - Success status
     */
    removeFontFromComponent(component) {
        // Get component element
        let element;
        if (typeof component === 'string') {
            element = document.querySelector(component);
        } else if (component instanceof HTMLElement) {
            element = component;
        } else {
            console.error('[sfUICore] Invalid component parameter');
            return false;
        }

        if (!element) {
            console.error('[sfUICore] Component not found');
            return false;
        }

        // Remove from Shadow DOM
        if (element.shadowRoot) {
            const styleElement = element.shadowRoot.getElementById('sfui-custom-font-style');
            if (styleElement) {
                styleElement.remove();
                return true;
            }
        } else {
            // Remove from host element
            element.style.fontFamily = '';
            return true;
        }

        return false;
    }

    /**
     * Remove custom font from all sfUI web components
     * @returns {number} - Number of components affected
     */
    removeFontFromAllComponents() {
        const components = document.querySelectorAll('[is^="sf-"], sf-sidebar, sf-modal, sf-alert, sf-lightbox');
        const allElements = document.querySelectorAll('*');
        const sfComponents = Array.from(allElements).filter(el =>
            el.tagName.toLowerCase().startsWith('sf-')
        );

        const allComponents = new Set([...components, ...sfComponents]);
        let count = 0;

        allComponents.forEach(component => {
            if (this.removeFontFromComponent(component)) {
                count++;
            }
        });

        return count;
    }

    /**
     * Inject preloaded fonts from document to sfUI components
     * This method scans all loaded fonts in the document and applies them to sfUI components
     * Use this to prevent font flashing on initial page load
     * @param {Object} options - Configuration options
     * @param {string} options.targetFont - Specific font family to inject (optional)
     * @param {string} options.selector - Custom CSS selector for target elements in components (default: '*')
     * @param {boolean} options.important - Add !important to CSS rules (default: false)
     * @param {boolean} options.autoDetect - Auto detect and inject fonts from document.fonts (default: true)
     * @returns {Promise<Object>} - Result object with injected fonts info
     */
    async injectPreloadedFonts(options = {}) {
        const {
            targetFont = null,
            selector = '*',
            important = false,
            autoDetect = true
        } = options;

        const results = {
            injectedFonts: [],
            componentsAffected: 0,
            errors: []
        };

        try {
            // Wait for document fonts to be ready
            await document.fonts.ready;

            // Get all loaded fonts from document
            const loadedFonts = new Set();

            if (autoDetect && document.fonts) {
                // Use Font Loading API to detect loaded fonts
                document.fonts.forEach(fontFace => {
                    if (fontFace.status === 'loaded') {
                        loadedFonts.add(fontFace.family);
                    }
                });
            }

            // Also check for fonts in stylesheets
            try {
                for (const sheet of document.styleSheets) {
                    try {
                        for (const rule of sheet.cssRules || []) {
                            if (rule instanceof CSSFontFaceRule) {
                                const family = rule.style.fontFamily.replace(/['"]/g, '');
                                loadedFonts.add(family);
                            }
                        }
            } catch (e) {
                // Skip cross-origin stylesheets
                continue;
            }
        }
    } catch (e) {
        // Could not scan stylesheets
    }            // If targetFont is specified, use only that font
            const fontsToInject = targetFont ? [targetFont] : Array.from(loadedFonts);

            if (fontsToInject.length === 0) {
                return results;
            }

            // Get all sfUI web components
            const allElements = document.querySelectorAll('*');
            const sfComponents = Array.from(allElements).filter(el =>
                el.tagName.toLowerCase().startsWith('sf-')
            );

            // Inject fonts to each component
            for (const font of fontsToInject) {
                const componentResults = this.applyFontToComponents(sfComponents, font, {
                    selector,
                    important
                });

                if (componentResults.success > 0) {
                    results.injectedFonts.push(font);
                    results.componentsAffected += componentResults.success;
                }

                if (componentResults.errors.length > 0) {
                    results.errors.push(...componentResults.errors);
                }
            }

            return results;

        } catch (error) {
            console.error('[sfUICore] Font injection failed:', error);
            results.errors.push({ error: error.message });
            return results;
        }
    }

    /**
     * Auto-inject preloaded fonts to all sfUI components when DOM is ready
     * This is a convenience method that automatically runs injectPreloadedFonts
     * @param {Object} options - Same options as injectPreloadedFonts
     * @returns {Promise<Object>} - Result object
     */
    autoInjectFonts(options = {}) {
        const inject = () => this.injectPreloadedFonts(options);

        // If DOM is already ready, inject immediately
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            return inject();
        }

        // Otherwise wait for DOMContentLoaded
        return new Promise((resolve) => {
            document.addEventListener('DOMContentLoaded', () => {
                inject().then(resolve);
            });
        });
    }

    /**
     * Inject icon font CSS into web components (FontAwesome, Bootstrap Icons, etc.)
     * This method injects the entire CSS file into Shadow DOM to support icon fonts
     * @param {Object} options - Configuration options
     * @param {string} options.cssUrl - URL to the icon font CSS file (required)
     * @param {string} options.styleId - Custom style element ID (optional)
     * @param {Array|string} options.components - Specific component(s) to inject (optional)
     * @returns {Promise<Object>} - Result object with injection info
     *
     * @example
     * // Inject FontAwesome to all sfUI components
     * sfUICore.injectIconFont({
     *     cssUrl: '/assets/libs/fontawesome-free-7.1.0-web/css/all.min.css'
     * });
     *
     * @example
     * // Inject Bootstrap Icons to specific component
     * sfUICore.injectIconFont({
     *     cssUrl: '/assets/libs/bootstrap-icons-1.13.1/font/bootstrap-icons.min.css',
     *     components: 'sf-sidebar'
     * });
     *
     * @example
     * // Inject multiple icon fonts
     * await sfUICore.injectIconFont({
     *     cssUrl: '/assets/libs/bootstrap-icons-1.13.1/font/bootstrap-icons.min.css'
     * });
     * await sfUICore.injectIconFont({
     *     cssUrl: '/assets/libs/fontawesome-free-7.1.0-web/css/all.min.css'
     * });
     */
    async injectIconFont(options = {}) {
        const {
            cssUrl,
            styleId = null,
            components = null
        } = options;

        const results = {
            cssUrl: cssUrl,
            componentsAffected: 0,
            errors: []
        };

        if (!cssUrl) {
            const error = 'cssUrl is required';
            console.error('[sfUICore]', error);
            results.errors.push({ error });
            return results;
        }

        try {
            // Fetch CSS content
            const response = await fetch(cssUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch CSS: ${response.status} ${response.statusText}`);
            }

            let cssContent = await response.text();

            // Fix relative URLs in CSS (for @font-face src)
            const cssDir = cssUrl.substring(0, cssUrl.lastIndexOf('/'));
            cssContent = this._fixRelativeUrlsInCSS(cssContent, cssDir);

            // Get target components
            let targetComponents;
            if (components) {
                if (typeof components === 'string') {
                    targetComponents = document.querySelectorAll(components);
                } else if (Array.isArray(components)) {
                    targetComponents = [];
                    components.forEach(comp => {
                        if (typeof comp === 'string') {
                            targetComponents.push(...document.querySelectorAll(comp));
                        } else if (comp instanceof HTMLElement) {
                            targetComponents.push(comp);
                        }
                    });
                } else if (components instanceof HTMLElement) {
                    targetComponents = [components];
                }
            } else {
                // Find all sfUI web components
                const allElements = document.querySelectorAll('*');
                targetComponents = Array.from(allElements).filter(el =>
                    el.tagName.toLowerCase().startsWith('sf-')
                );
            }

            // Inject CSS into each component's Shadow DOM
            for (const component of targetComponents) {
                try {
                    if (!component.shadowRoot) {
                        results.errors.push({
                            component: component.tagName,
                            error: 'No Shadow DOM found'
                        });
                        continue;
                    }

                    // Generate style ID
                    const finalStyleId = styleId || `sfui-icon-font-${this._generateStyleId(cssUrl)}`;

                    // Check if already injected
                    let styleElement = component.shadowRoot.getElementById(finalStyleId);

                    if (!styleElement) {
                        styleElement = document.createElement('style');
                        styleElement.id = finalStyleId;
                        component.shadowRoot.appendChild(styleElement);
                    }

                    styleElement.textContent = cssContent;
                    results.componentsAffected++;

                } catch (error) {
                    results.errors.push({
                        component: component.tagName,
                        error: error.message
                    });
                }
            }

            return results;

        } catch (error) {
            console.error('[sfUICore] Icon font injection failed:', error);
            results.errors.push({ error: error.message });
            return results;
        }
    }

    /**
     * Fix relative URLs in CSS content
     * @private
     */
    _fixRelativeUrlsInCSS(cssContent, baseDir) {
        // Match url(...) in CSS
        return cssContent.replace(/url\(\s*['"]?([^'")]+)['"]?\s*\)/gi, (match, url) => {
            // Skip absolute URLs (http, https, //, data:)
            if (url.startsWith('http') || url.startsWith('//') || url.startsWith('data:') || url.startsWith('/')) {
                return match;
            }

            // Convert relative URL to absolute
            const absoluteUrl = `${baseDir}/${url}`;
            return `url('${absoluteUrl}')`;
        });
    }

    /**
     * Generate unique style ID from URL
     * @private
     */
    _generateStyleId(url) {
        // Simple hash function for URL
        let hash = 0;
        for (let i = 0; i < url.length; i++) {
            const char = url.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash).toString(36);
    }

    /**
     * Inject multiple icon fonts at once
     * @param {Array} fontConfigs - Array of icon font configurations
     * @returns {Promise<Array>} - Array of result objects
     *
     * @example
     * sfUICore.injectIconFonts([
     *     { cssUrl: '/assets/libs/bootstrap-icons-1.13.1/font/bootstrap-icons.min.css' },
     *     { cssUrl: '/assets/libs/fontawesome-free-7.1.0-web/css/all.min.css' }
     * ]);
     */
    async injectIconFonts(fontConfigs) {
        if (!Array.isArray(fontConfigs)) {
            return [await this.injectIconFont(fontConfigs)];
        }

        const results = [];
        for (const config of fontConfigs) {
            const result = await this.injectIconFont(config);
            results.push(result);
        }
        return results;
    }

    /**
     * Remove icon font from web components
     * @param {Object} options - Configuration options
     * @param {string} options.cssUrl - URL to identify the icon font to remove (optional)
     * @param {string} options.styleId - Style element ID to remove (optional)
     * @param {Array|string} options.components - Specific component(s) to remove from (optional)
     * @returns {Object} - Result object
     */
    removeIconFont(options = {}) {
        const {
            cssUrl = null,
            styleId = null,
            components = null
        } = options;

        const results = {
            componentsAffected: 0,
            errors: []
        };

        // Get target components
        let targetComponents;
        if (components) {
            if (typeof components === 'string') {
                targetComponents = document.querySelectorAll(components);
            } else if (Array.isArray(components)) {
                targetComponents = [];
                components.forEach(comp => {
                    if (typeof comp === 'string') {
                        targetComponents.push(...document.querySelectorAll(comp));
                    } else if (comp instanceof HTMLElement) {
                        targetComponents.push(comp);
                    }
                });
            } else if (components instanceof HTMLElement) {
                targetComponents = [components];
            }
        } else {
            const allElements = document.querySelectorAll('*');
            targetComponents = Array.from(allElements).filter(el =>
                el.tagName.toLowerCase().startsWith('sf-')
            );
        }

        // Determine style ID to remove
        const finalStyleId = styleId || (cssUrl ? `sfui-icon-font-${this._generateStyleId(cssUrl)}` : null);

        // Remove from each component
        for (const component of targetComponents) {
            try {
                if (!component.shadowRoot) continue;

                if (finalStyleId) {
                    const styleElement = component.shadowRoot.getElementById(finalStyleId);
                    if (styleElement) {
                        styleElement.remove();
                        results.componentsAffected++;
                    }
                } else {
                    // Remove all icon font styles
                    const iconFontStyles = component.shadowRoot.querySelectorAll('[id^="sfui-icon-font-"]');
                    iconFontStyles.forEach(style => {
                        style.remove();
                        results.componentsAffected++;
                    });
                }
            } catch (error) {
                results.errors.push({
                    component: component.tagName,
                    error: error.message
                });
            }
        }

        return results;
    }

    /**
     * Clear font cache
     */
    clearFontCache() {
        this.fonts.loaded.clear();
        this.fonts.loading.clear();

        if (this.fonts.cssStyleElement) {
            this.fonts.cssStyleElement.remove();
            this.fonts.cssStyleElement = null;
        }
    }
}

// Export singleton instance
const sfUICore = new SfUICore();

/**
 * sfUI Alert Module
 * Alert, Notification, Confirm, and Input dialogs
 * @version 1.0.0
 */

class SfUIAlert {
    constructor() {
        this.alertIndex = 0;
        this.activeAlerts = new Map();
    }

    /**
     * Show alert dialog
     */
    alert(message, callback = null) {
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
    alertBack(message) {
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
    alertJump(message, url) {
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
    noti(message, callback = null) {
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
    notiBack(message) {
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
    notiJump(message, url) {
        return this.show({
            type: 'alert',
            messageText: message,
            alertType: 'info',
            okCallback: () => location.href = url
        });
    }

    /**
     * Show confirmation dialog
     */
    confirm(message, yesCallback = null, noCallback = null) {
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
    inputConfirm(message, callback = null, options = {}) {
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
                closeOnBackdropClick: true  // 배경 클릭 시 닫기 기능 옵션
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
            }
        });

        // Create overlay (separate from modal)
        const overlay = sfUICore.createElement('div', {
            className: 'sfui-alert-overlay',
            styles: { zIndex: zIndex - 1 }
        });

        // Create modal container
        const modal = sfUICore.createElement('div', {
            className: 'sfui-alert-modal',
            attrs: {
                'role': 'dialog',
                'aria-modal': 'true'
            },
            styles: {
                zIndex: zIndex
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

// Legacy function wrappers for backward compatibility
function alert(msg) { return sfUIAlert.alert(msg); }
function alertJump(msg, url) { return sfUIAlert.alertJump(msg, url); }
function alertBack(msg) { return sfUIAlert.alertBack(msg); }
function alertCallback(msg, callback) { return sfUIAlert.alert(msg, callback); }
function noti(msg) { return sfUIAlert.noti(msg); }
function notiJump(msg, url) { return sfUIAlert.notiJump(msg, url); }
function notiBack(msg) { return sfUIAlert.notiBack(msg); }
function confirm(msg, callback, noCallback) { return sfUIAlert.confirm(msg, callback, noCallback); }
function inputConfirm(msg, callback) { return sfUIAlert.inputConfirm(msg, callback); }

/**
 * sfUI Modal Module
 * Reusable modal dialogs with customizable headers, bodies, and footers
 * @version 1.0.0
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

/**
 * sfUI LightBox Module
 * Image lightbox gallery with navigation
 * @version 1.0.0
 */

class SfUILightBox {
    constructor() {
        this.groups = new Map();
        this.overlay = null;
        this.currentGroup = null;
        this.currentIndex = 0;
        this.settings = {};
    }

    /**
     * Initialize lightbox for images
     */
    init(selector, options = {}) {
        const defaults = {
            overlayColor: 'rgba(0, 0, 0, 0.8)',
            captionColor: '#fff',
            captionFontSize: '14px',
            transitionDuration: 300
        };

        this.settings = { ...defaults, ...options };

        // Get all matching elements
        const elements = typeof selector === 'string'
            ? document.querySelectorAll(selector)
            : selector instanceof NodeList ? selector : [selector];

        elements.forEach(el => this.attach(el));

        return this;
    }

    /**
     * Attach lightbox to an element
     */
    attach(element) {
        const group = element.getAttribute('data-sflightbox');
        if (!group) return;

        const caption = element.getAttribute('data-caption') || '';
        const bigImage = element.getAttribute('data-big') || element.src || element.href;

        // Create group if not exists
        if (!this.groups.has(group)) {
            this.groups.set(group, []);
        }

        // Check if image already exists in group
        const groupImages = this.groups.get(group);
        const exists = groupImages.some(img => img.bigImage === bigImage);
        if (exists) return;

        // Add image to group
        groupImages.push({
            element,
            caption,
            bigImage
        });

        // Set cursor
        element.style.cursor = 'pointer';

        // Add click handler
        element.addEventListener('click', (e) => {
            e.preventDefault();
            this.open(group, bigImage);
        });
    }

    /**
     * Open lightbox
     */
    open(group, imageUrl) {
        if (!this.groups.has(group)) return;

        this.currentGroup = group;
        const images = this.groups.get(group);
        this.currentIndex = images.findIndex(img => img.bigImage === imageUrl);

        if (this.currentIndex === -1) this.currentIndex = 0;

        // Create overlay if not exists
        if (!this.overlay) {
            this.createOverlay();
        }

        // Show image
        this.showImage();

        // Show overlay
        this.overlay.style.display = 'flex';
        sfUICore.fadeIn(this.overlay, this.settings.transitionDuration);
    }

    /**
     * Create overlay structure
     */
    createOverlay() {
        this.overlay = sfUICore.createElement('div', {
            id: 'sfLightBoxOverlay',
            className: 'sfui-lightbox-overlay',
            styles: {
                backgroundColor: this.settings.overlayColor,
                position: 'fixed',
                top: '0',
                left: '0',
                width: '100%',
                height: '100%',
                display: 'none',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: sfUICore.getNextZIndex()
            }
        });

        // Image container
        const container = sfUICore.createElement('div', {
            id: 'sfLightBoxImageContainer',
            className: 'sfui-lightbox-container',
            styles: {
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                width: '100vw',
                height: '100vh',
                pointerEvents: 'none'
            }
        });

        // Image element
        const image = sfUICore.createElement('img', {
            id: 'sfLightBoxImage',
            className: 'sfui-lightbox-image',
            styles: {
                maxWidth: '90%',
                maxHeight: '85%',
                transition: `opacity ${this.settings.transitionDuration}ms`,
                pointerEvents: 'auto'
            }
        });

        // Caption
        const caption = sfUICore.createElement('div', {
            id: 'sfLightBoxCaption',
            className: 'sfui-lightbox-caption',
            styles: {
                color: this.settings.captionColor,
                fontSize: this.settings.captionFontSize,
                marginTop: '10px',
                textAlign: 'center',
                maxWidth: '90%',
                pointerEvents: 'auto'
            }
        });

        // Close button
        const closeBtn = sfUICore.createElement('div', {
            id: 'sfLightBoxClose',
            className: 'sfui-lightbox-close',
            html: '&times;',
            styles: {
                position: 'absolute',
                top: '20px',
                right: '20px',
                width: '60px',
                height: '60px',
                color: '#fff',
                fontSize: '50px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: '20',
                pointerEvents: 'auto',
                userSelect: 'none'
            }
        });

        closeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.close();
        });

        // Previous button
        const prevBtn = sfUICore.createElement('div', {
            id: 'sfLightBoxPrev',
            className: 'sfui-lightbox-prev',
            html: '&lt;',
            styles: {
                position: 'absolute',
                left: '0',
                top: '50%',
                width: '150px',
                height: '80vh',
                color: '#fff',
                fontSize: '50px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: 'translateY(-50%)',
                zIndex: '20',
                userSelect: 'none',
                pointerEvents: 'auto'
            }
        });

        prevBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.prev();
        });

        // Next button
        const nextBtn = sfUICore.createElement('div', {
            id: 'sfLightBoxNext',
            className: 'sfui-lightbox-next',
            html: '&gt;',
            styles: {
                position: 'absolute',
                right: '0',
                top: '50%',
                width: '150px',
                height: '80vh',
                color: '#fff',
                fontSize: '50px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: 'translateY(-50%)',
                zIndex: '20',
                userSelect: 'none',
                pointerEvents: 'auto'
            }
        });

        nextBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.next();
        });

        // Assemble
        container.appendChild(image);
        container.appendChild(caption);
        this.overlay.appendChild(container);
        this.overlay.appendChild(closeBtn);
        this.overlay.appendChild(prevBtn);
        this.overlay.appendChild(nextBtn);

        // Click outside to close
        this.overlay.addEventListener('click', (e) => {
            // Check if click is on a navigational element or image
            const nonCloseableElements = [
                'sfLightBoxPrev', 'sfLightBoxNext', 'sfLightBoxClose', 'sfLightBoxImage'
            ];

            const nonCloseableClasses = [
                'sfui-lightbox-prev', 'sfui-lightbox-next', 'sfui-lightbox-close'
            ];

            // Walk up the DOM tree to check for non-closeable elements
            let target = e.target;
            while (target && target !== this.overlay) {
                if (nonCloseableElements.includes(target.id)) {
                    return;
                }

                if (nonCloseableClasses.some(cls => target.className.includes(cls))) {
                    return;
                }

                target = target.parentElement;
            }

            // Only close if clicking on overlay or container background
            if (e.target.id === 'sfLightBoxOverlay' || e.target.id === 'sfLightBoxImageContainer') {
                this.close();
            }
        });

        // Keyboard navigation
        this.keyHandler = (e) => {
            if (!this.overlay || this.overlay.style.display === 'none') return;

            switch(e.key) {
                case 'Escape':
                    this.close();
                    break;
                case 'ArrowLeft':
                    this.prev();
                    break;
                case 'ArrowRight':
                    this.next();
                    break;
            }
        };
        document.addEventListener('keydown', this.keyHandler);

        document.body.appendChild(this.overlay);
    }

    /**
     * Show current image
     */
    showImage() {
        if (!this.currentGroup || !this.groups.has(this.currentGroup)) return;

        const images = this.groups.get(this.currentGroup);
        const imageData = images[this.currentIndex];

        const imageEl = document.getElementById('sfLightBoxImage');
        const captionEl = document.getElementById('sfLightBoxCaption');

        if (imageEl) {
            // Fade out
            imageEl.style.opacity = '0';

            setTimeout(() => {
                imageEl.src = imageData.bigImage;
                imageEl.setAttribute('data-group', this.currentGroup);

                // Fade in
                imageEl.onload = () => {
                    imageEl.style.opacity = '1';
                };
            }, this.settings.transitionDuration / 2);
        }

        if (captionEl) {
            captionEl.textContent = imageData.caption;
        }

        // Update navigation buttons visibility
        this.updateNavigation();
    }

    /**
     * Update navigation buttons
     */
    updateNavigation() {
        const images = this.groups.get(this.currentGroup);
        const prevBtn = document.getElementById('sfLightBoxPrev');
        const nextBtn = document.getElementById('sfLightBoxNext');

        if (images.length <= 1) {
            if (prevBtn) prevBtn.style.display = 'none';
            if (nextBtn) nextBtn.style.display = 'none';
        } else {
            if (prevBtn) prevBtn.style.display = 'flex';
            if (nextBtn) nextBtn.style.display = 'flex';
        }
    }

    /**
     * Show previous image
     */
    prev() {
        if (!this.currentGroup) return;

        const images = this.groups.get(this.currentGroup);
        this.currentIndex = this.currentIndex > 0
            ? this.currentIndex - 1
            : images.length - 1;

        this.showImage();
    }

    /**
     * Show next image
     */
    next() {
        if (!this.currentGroup) return;

        const images = this.groups.get(this.currentGroup);
        this.currentIndex = this.currentIndex < images.length - 1
            ? this.currentIndex + 1
            : 0;

        this.showImage();
    }

    /**
     * Close lightbox
     */
    close() {
        if (!this.overlay) return;

        sfUICore.fadeOut(this.overlay, this.settings.transitionDuration);
    }

    /**
     * Remove image from group
     */
    remove(group, imageUrl) {
        if (!this.groups.has(group)) return;

        const images = this.groups.get(group);
        const index = images.findIndex(img => img.bigImage === imageUrl);

        if (index !== -1) {
            images.splice(index, 1);

            if (images.length === 0) {
                this.groups.delete(group);
            }
        }
    }

    /**
     * Destroy lightbox
     */
    destroy() {
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }

        if (this.keyHandler) {
            document.removeEventListener('keydown', this.keyHandler);
        }

        this.groups.clear();
    }
}

// Export singleton instance
const sfUILightBox = new SfUILightBox();

/**
 * sfUI RangeSlider Module
 * Interactive range slider for number inputs
 * @version 1.0.0
 */

class SfUIRangeSlider {
    constructor() {
        this.sliders = new Map();
    }

    /**
     * Initialize range slider for input elements
     */
    init(selector, options = {}) {
        const defaults = {
            theme: 'auto',
            min: 0,
            max: 9999999,
            step: null,
            thousands: ',',
            decimal: '.',
            precision: 0,
            prefix: '',
            suffix: ''
        };

        const settings = { ...defaults, ...options };

        // Get all matching elements
        const elements = typeof selector === 'string'
            ? document.querySelectorAll(selector)
            : selector instanceof NodeList ? selector : [selector];

        elements.forEach(el => this.attach(el, settings));

        return this;
    }

    /**
     * Attach range slider to an input element
     */
    attach(input, settings) {
        if (this.sliders.has(input)) return;

        const instance = new RangeSliderInstance(input, settings);
        this.sliders.set(input, instance);
    }

    /**
     * Get slider instance
     */
    get(input) {
        return this.sliders.get(input);
    }

    /**
     * Destroy slider
     */
    destroy(input) {
        const instance = this.sliders.get(input);
        if (instance) {
            instance.destroy();
            this.sliders.delete(input);
        }
    }
}

/**
 * Range Slider Instance
 */
class RangeSliderInstance {
    constructor(input, settings) {
        this.input = input;
        this.settings = settings;
        this.container = null;
        this.slider = null;
        this.minHandle = null;
        this.maxHandle = null;
        this.track = null;
        this.range = null;
        this.isDragging = false;
        this.currentHandle = null;
        this.minValue = settings.min;
        this.maxValue = settings.max;

        this.attachInputHandlers();
    }

    /**
     * Attach input event handlers
     */
    attachInputHandlers() {
        this.input.addEventListener('focus', () => this.show());
        this.input.addEventListener('click', () => this.show());
    }

    /**
     * Show slider
     */
    show() {
        if (this.container && this.container.style.display !== 'none') {
            return;
        }

        if (!this.container) {
            this.build();
        }

        this.container.style.display = 'block';
        this.updateSliderFromInput();
        this.positionContainer();
    }

    /**
     * Hide slider
     */
    hide() {
        if (this.container) {
            this.container.style.display = 'none';
        }
    }

    /**
     * Build slider structure
     */
    build() {
        const theme = this.getTheme();
        const width = Math.max(this.input.offsetWidth, 350);

        // Create container
        this.container = sfUICore.createElement('div', {
            className: `sfui-rangeslider ${theme}`,
            styles: this.getThemeStyles(theme, width)
        });

        // Create slider track
        this.track = sfUICore.createElement('div', {
            className: 'sfui-rangeslider-track',
            styles: {
                position: 'relative',
                height: '6px',
                background: theme === 'dark' ? '#454545' : '#ddd',
                borderRadius: '3px',
                marginBottom: '30px'
            }
        });

        // Create range (selected area)
        this.range = sfUICore.createElement('div', {
            className: 'sfui-rangeslider-range',
            styles: {
                position: 'absolute',
                height: '100%',
                background: theme === 'dark' ? '#6ea8fe' : '#0d6efd',
                borderRadius: '3px',
                left: '0%',
                width: '100%'
            }
        });

        // Create handles
        this.minHandle = this.createHandle('min', theme);
        this.maxHandle = this.createHandle('max', theme);

        // Create scale
        const scale = this.createScale(theme);

        // Assemble
        this.track.appendChild(this.range);
        this.track.appendChild(this.minHandle);
        this.track.appendChild(this.maxHandle);
        this.container.appendChild(this.track);
        this.container.appendChild(scale);

        document.body.appendChild(this.container);

        // Attach event handlers
        this.attachSliderHandlers();
        this.attachDocumentHandlers();

        // Watch for theme changes
        this.watchThemeChanges();
    }

    /**
     * Get theme-specific container styles
     */
    getThemeStyles(theme, width) {
        const isDark = theme === 'dark';
        return {
            position: 'absolute',
            width: width + 'px',
            border: '1px solid',
            padding: '1.5rem 2rem 2rem 2rem',
            zIndex: sfUICore.getNextZIndex(),
            background: isDark ? '#565656' : '#ededed',
            borderColor: isDark ? '#898989' : '#cecece',
            borderRadius: '4px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        };
    }

    /**
     * Create handle element
     */
    createHandle(type, theme) {
        const isDark = theme === 'dark';
        const handle = sfUICore.createElement('div', {
            className: `sfui-rangeslider-handle sfui-rangeslider-handle-${type}`,
            attrs: {
                'data-handle': type
            },
            styles: {
                position: 'absolute',
                width: '18px',
                height: '18px',
                background: isDark ? '#ededed' : '#ffffff',
                border: `2px solid ${isDark ? '#ededed' : '#007bff'}`,
                borderRadius: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                cursor: 'pointer',
                boxShadow: '0 0 2px rgba(0,0,0,0.2)',
                left: type === 'min' ? '0%' : '100%'
            }
        });

        return handle;
    }

    /**
     * Create scale labels
     */
    createScale(theme) {
        const isDark = theme === 'dark';
        const scale = sfUICore.createElement('div', {
            className: 'sfui-rangeslider-scale',
            styles: {
                position: 'relative',
                height: '20px'
            }
        });

        const positions = [0, 25, 50, 75, 100];
        const values = [
            this.settings.min,
            Math.floor((this.settings.max - this.settings.min) / 4),
            Math.floor((this.settings.max - this.settings.min) / 2),
            Math.floor((this.settings.max - this.settings.min) * 3 / 4),
            this.settings.max
        ];

        positions.forEach((pos, index) => {
            // Scale mark
            const mark = sfUICore.createElement('div', {
                styles: {
                    position: 'absolute',
                    top: '-30px',
                    left: pos + '%',
                    width: '1px',
                    height: '6px',
                    background: '#000'
                }
            });

            // Label
            const label = sfUICore.createElement('div', {
                text: sfUICore.formatNumberShort(values[index]),
                styles: {
                    position: 'absolute',
                    top: '0',
                    left: pos + '%',
                    transform: 'translateX(-50%)',
                    fontSize: '0.8rem',
                    color: isDark ? '#fff' : '#000',
                    whiteSpace: 'nowrap'
                }
            });

            scale.appendChild(mark);
            scale.appendChild(label);
        });

        return scale;
    }

    /**
     * Attach slider event handlers
     */
    attachSliderHandlers() {
        [this.minHandle, this.maxHandle].forEach(handle => {
            handle.addEventListener('mousedown', (e) => this.startDrag(e, handle));
            handle.addEventListener('touchstart', (e) => this.startDrag(e, handle));
        });

        // Click on track to move nearest handle
        this.track.addEventListener('click', (e) => {
            if (e.target === this.minHandle || e.target === this.maxHandle) return;

            const rect = this.track.getBoundingClientRect();
            const clickPos = (e.clientX - rect.left) / rect.width;
            const clickValue = this.settings.min + clickPos * (this.settings.max - this.settings.min);

            // Determine which handle is closer
            const minDist = Math.abs(clickValue - this.minValue);
            const maxDist = Math.abs(clickValue - this.maxValue);

            if (minDist < maxDist) {
                this.minValue = Math.max(this.settings.min, Math.min(clickValue, this.maxValue));
            } else {
                this.maxValue = Math.min(this.settings.max, Math.max(clickValue, this.minValue));
            }

            this.updateSlider();
            this.updateInput();
        });
    }

    /**
     * Attach document event handlers
     */
    attachDocumentHandlers() {
        // Blur handler
        this.blurHandler = (e) => {
            if (!this.input.contains(e.relatedTarget) &&
                !this.container.contains(e.target) &&
                !this.isDragging) {
                this.hide();
            }
        };
        this.input.addEventListener('blur', this.blurHandler);

        // Click outside handler
        this.clickHandler = (e) => {
            if (!this.input.contains(e.target) &&
                !this.container.contains(e.target) &&
                !this.isDragging) {
                this.hide();
            }
        };
        document.addEventListener('click', this.clickHandler);

        // Input change handler
        this.changeHandler = () => {
            this.updateSliderFromInput();
        };
        this.input.addEventListener('input', this.changeHandler);
        this.input.addEventListener('change', this.changeHandler);

        // Window resize handler
        this.resizeHandler = () => {
            if (this.container && this.container.style.display !== 'none') {
                this.positionContainer();
            }
        };
        window.addEventListener('resize', this.resizeHandler);
    }

    /**
     * Start dragging handle
     */
    startDrag(e, handle) {
        e.preventDefault();
        this.isDragging = true;
        this.currentHandle = handle;

        const moveHandler = (e) => this.onDrag(e);
        const upHandler = () => {
            this.isDragging = false;
            this.currentHandle = null;
            document.removeEventListener('mousemove', moveHandler);
            document.removeEventListener('mouseup', upHandler);
            document.removeEventListener('touchmove', moveHandler);
            document.removeEventListener('touchend', upHandler);
        };

        document.addEventListener('mousemove', moveHandler);
        document.addEventListener('mouseup', upHandler);
        document.addEventListener('touchmove', moveHandler);
        document.addEventListener('touchend', upHandler);
    }

    /**
     * Handle drag movement
     */
    onDrag(e) {
        if (!this.isDragging || !this.currentHandle) return;

        const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
        const rect = this.track.getBoundingClientRect();
        const position = (clientX - rect.left) / rect.width;
        const value = this.settings.min + position * (this.settings.max - this.settings.min);

        const handleType = this.currentHandle.getAttribute('data-handle');

        if (handleType === 'min') {
            this.minValue = Math.max(this.settings.min, Math.min(value, this.maxValue));
        } else {
            this.maxValue = Math.min(this.settings.max, Math.max(value, this.minValue));
        }

        this.updateSlider();
        this.updateInput();
    }

    /**
     * Update slider visual state
     */
    updateSlider() {
        const range = this.settings.max - this.settings.min;
        const minPercent = ((this.minValue - this.settings.min) / range) * 100;
        const maxPercent = ((this.maxValue - this.settings.min) / range) * 100;

        this.minHandle.style.left = minPercent + '%';
        this.maxHandle.style.left = maxPercent + '%';
        this.range.style.left = minPercent + '%';
        this.range.style.width = (maxPercent - minPercent) + '%';
    }

    /**
     * Update input value from slider
     */
    updateInput() {
        const value1 = sfUICore.formatNumber(
            this.minValue,
            this.settings.precision,
            this.settings.decimal,
            this.settings.thousands
        );

        const value2 = sfUICore.formatNumber(
            this.maxValue,
            this.settings.precision,
            this.settings.decimal,
            this.settings.thousands
        );

        this.input.value = `${this.settings.prefix}${value1}${this.settings.suffix} - ${this.settings.prefix}${value2}${this.settings.suffix}`;

        // Dispatch custom event
        this.input.dispatchEvent(new CustomEvent('apply.sfrangeslider', {
            detail: { min: this.minValue, max: this.maxValue }
        }));
    }

    /**
     * Update slider from input value
     */
    updateSliderFromInput() {
        const values = this.input.value.split(' - ');

        if (values.length === 2) {
            const value1 = parseInt(values[0].replace(/\D/g, ''));
            const value2 = parseInt(values[1].replace(/\D/g, ''));

            if (!isNaN(value1) && value1 >= this.settings.min && value1 <= this.settings.max) {
                this.minValue = value1;
            }

            if (!isNaN(value2) && value2 >= this.settings.min && value2 <= this.settings.max) {
                this.maxValue = value2;
            }
        } else if (values.length === 1) {
            const value = parseInt(values[0].replace(/\D/g, ''));

            if (!isNaN(value) && value >= this.settings.min && value <= this.settings.max) {
                this.minValue = value;
                this.maxValue = this.settings.max;
            }
        }

        this.updateSlider();
    }

    /**
     * Position container relative to input
     */
    positionContainer() {
        const rect = this.input.getBoundingClientRect();
        this.container.style.top = (rect.bottom + window.scrollY) + 'px';
        this.container.style.left = (rect.left + window.scrollX) + 'px';
    }

    /**
     * Get current theme
     */
    getTheme() {
        if (this.settings.theme === 'light') return 'light';
        if (this.settings.theme === 'dark') return 'dark';
        return sfUICore.getTheme();
    }

    /**
     * Watch for theme changes and update slider appearance
     */
    watchThemeChanges() {
        this.themeWatcher = sfUICore.watchThemeChanges((newTheme) => {
            if (this.container && this.settings.theme === 'auto') {
                this.updateTheme(newTheme);
            }
        });
    }

    /**
     * Update slider theme
     */
    updateTheme(theme) {
        if (!this.container) return;

        const isDark = theme === 'dark';

        // Update container class
        this.container.classList.remove('light', 'dark');
        this.container.classList.add(theme);

        // Update container styles using utility
        sfUICore.updateStyles(this.container, {
            background: isDark ? '#565656' : '#ededed',
            borderColor: isDark ? '#898989' : '#cecece'
        });

        // Update track
        if (this.track) {
            this.track.style.background = isDark ? '#454545' : '#ddd';
        }

        // Update range
        if (this.range) {
            this.range.style.background = isDark ? '#6ea8fe' : '#0d6efd';
        }

        // Update handles
        const handleStyles = {
            background: isDark ? '#ededed' : '#ffffff',
            borderColor: isDark ? '#ededed' : '#0d6efd'
        };

        if (this.minHandle) {
            sfUICore.updateStyles(this.minHandle, handleStyles);
        }

        if (this.maxHandle) {
            sfUICore.updateStyles(this.maxHandle, handleStyles);
        }

        // Update scale labels colors
        const labels = this.container.querySelectorAll('.sfui-rangeslider-scale > div');
        labels.forEach(label => {
            if (label.textContent) {
                label.style.color = isDark ? '#fff' : '#000';
            }
        });
    }

    /**
     * Destroy slider
     */
    destroy() {
        // Remove event listeners
        if (this.blurHandler) {
            this.input.removeEventListener('blur', this.blurHandler);
        }
        if (this.clickHandler) {
            document.removeEventListener('click', this.clickHandler);
        }
        if (this.changeHandler) {
            this.input.removeEventListener('input', this.changeHandler);
            this.input.removeEventListener('change', this.changeHandler);
        }
        if (this.resizeHandler) {
            window.removeEventListener('resize', this.resizeHandler);
        }

        // Remove container
        if (this.container) {
            this.container.remove();
            this.container = null;
        }
    }
}

// Export singleton instance
const sfUIRangeSlider = new SfUIRangeSlider();

/**
 * sfUI Sidebar Component
 * Version: 1.0.0
 *
 * A responsive sidebar menu component with full, mini, and hide modes
 * Supports Bootstrap theme integration (light/dark)
 *
 * @module sfUI.sidebar
 * @requires sfUICore
 */

class SFSidebar extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        // State management
        this.state = {
            mode: 'full',           // 'full', 'mini', 'hide'
            isLocked: false,
            isTemporaryFull: false,
            menuData: [],
            currentPath: '',
            theme: 'light',
            fontFamily: "'Pretendard GOV Variable', sans-serif",
            iconSize: '1.2rem'
        };

        // Constants
        this.BREAKPOINTS = {
            MOBILE: 600,
            TABLET: 1000
        };

        this.MODE = {
            FULL: 'full',
            MINI: 'mini',
            HIDE: 'hide'
        };
    }

    static get observedAttributes() {
        return ['mode', 'locked', 'theme', 'menu-src', 'data-menu', 'current-active-menu', 'font-family', 'icon-size'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;

        switch (name) {
            case 'mode':
                this.state.mode = newValue || 'full';
                this.updateMode();
                break;
            case 'locked':
                this.state.isLocked = newValue === 'true';
                break;
            case 'theme':
                this.state.theme = newValue || 'light';
                this.updateTheme();
                break;
            case 'menu-src':
                this.loadMenu(newValue);
                break;
            case 'data-menu':
                this.loadMenuFromAttribute(newValue);
                break;
            case 'current-active-menu':
                this.state.currentPath = newValue || '';
                this.updateActiveMenu();
                break;
            case 'font-family':
                this.state.fontFamily = newValue || "'Pretendard GOV Variable', sans-serif";
                this.render();
                break;
            case 'icon-size':
                this.state.iconSize = newValue || '1.2rem';
                this.render();
                break;
        }
    }

    async connectedCallback() {
        // Initial render with minimal structure to prevent FOUC
        this.renderInitialStructure();

        // Detect and adjust for fixed header
        this.detectAndAdjustForHeader();

        // Create blind element
        this.createBlind();

        // Set initial state from attributes BEFORE loading menu
        this.state.mode = this.getAttribute('mode') || this.getAutoMode();
        this.state.isLocked = this.getAttribute('locked') === 'true';
        this.state.theme = this.getAttribute('theme') || this.detectThemeFromDocument();
        this.state.currentPath = this.getAttribute('current-active-menu') || '';
        this.state.fontFamily = this.getAttribute('font-family') || "'Pretendard GOV Variable', sans-serif";
        this.state.iconSize = this.getAttribute('icon-size') || '1.2rem';

        // Load menu data from data-menu attribute first, then menu-src
        const dataMenu = this.getAttribute('data-menu');
        const menuSrc = this.getAttribute('menu-src');

        if (dataMenu) {
            this.loadMenuFromAttribute(dataMenu);
        } else if (menuSrc) {
            await this.loadMenu(menuSrc);
        } else {
            // No menu source, wait for manual menu data setting via setMenuData()
            this.render();
        }

        // Setup event listeners
        this.setupEventListeners();

        // Restore state from localStorage
        this.restoreState();

        // Apply initial mode
        this.updateMode();

        // Listen for theme changes on document
        this.observeThemeChanges();

        // Store global reference
        this.exposeGlobalReference();
    }

    detectThemeFromDocument() {
        return document.documentElement.getAttribute('data-bs-theme') ||
               document.documentElement.getAttribute('data-theme') ||
               'light';
    }

    detectAndAdjustForHeader() {
        // Look for common fixed header patterns
        const headerSelectors = [
            '#shakeflat-header',
            'header.fixed-top',
            '.fixed-top',
            'header[class*="fixed"]',
            '.navbar-fixed-top'
        ];

        let headerHeight = 0;
        let foundHeader = null;

        for (const selector of headerSelectors) {
            const header = document.querySelector(selector);
            if (header) {
                const computedStyle = window.getComputedStyle(header);
                const position = computedStyle.position;

                // Only consider fixed or sticky headers
                if (position === 'fixed' || position === 'sticky') {
                    headerHeight = header.offsetHeight;
                    foundHeader = header;
                    break;
                }
            }
        }

        // Apply the adjustment immediately to prevent FOUC
        if (headerHeight > 0) {
            this.style.height = `calc(100vh - ${headerHeight}px)`;
            this.style.marginTop = `${headerHeight}px`;
            this._headerHeight = headerHeight;
            this._header = foundHeader;

            // Watch for header height changes (e.g., responsive behavior)
            this.observeHeaderChanges();
        } else {
            // No fixed header found, use full height
            this.style.height = '100vh';
            this.style.marginTop = '0';
            this._headerHeight = 0;
        }
    }

    observeHeaderChanges() {
        if (!this._header) return;

        // Use ResizeObserver to detect header size changes
        if (typeof ResizeObserver !== 'undefined') {
            this._headerObserver = new ResizeObserver(entries => {
                for (const entry of entries) {
                    const newHeight = entry.target.offsetHeight;
                    if (newHeight !== this._headerHeight) {
                        this._headerHeight = newHeight;
                        this.style.height = `calc(100vh - ${newHeight}px)`;
                        this.style.marginTop = `${newHeight}px`;
                    }
                }
            });

            this._headerObserver.observe(this._header);
        }
    }

    observeThemeChanges() {
        // Watch for theme changes on document element
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' &&
                    (mutation.attributeName === 'data-bs-theme' || mutation.attributeName === 'data-theme')) {
                    const newTheme = this.detectThemeFromDocument();
                    if (newTheme !== this.state.theme) {
                        this.state.theme = newTheme;
                        this.updateTheme();
                    }
                }
            });
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-bs-theme', 'data-theme']
        });

        // Store observer for cleanup
        this._themeObserver = observer;
    }

    exposeGlobalReference() {
        // Expose global reference for external scripts
        const id = this.getAttribute('id');
        if (id === 'shakeflat-sidebar') {
            window.sfSidebar = this;
        }
    }    createBlind() {
        // Create blind element outside of shadow DOM so it can cover the whole page
        this.blindElement = document.createElement('div');
        this.blindElement.className = 'sf-sidebar-blind';
        this.blindElement.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            z-index: 100;
            display: none;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;

        // Add click event to blind
        this.blindElement.addEventListener('click', () => {
            this.closeMenu();
        });

        // Append to body
        document.body.appendChild(this.blindElement);
    }

    showBlind() {
        if (this.blindElement) {
            this.blindElement.style.display = 'block';
            // Force reflow for transition
            this.blindElement.offsetHeight;
            this.blindElement.style.opacity = '0.65';
        }
    }

    hideBlind() {
        if (this.blindElement) {
            this.blindElement.style.opacity = '0';
            setTimeout(() => {
                if (this.blindElement) {
                    this.blindElement.style.display = 'none';
                }
            }, 300);
        }
    }

    disconnectedCallback() {
        // Clean up blind element when component is removed
        if (this.blindElement && this.blindElement.parentNode) {
            this.blindElement.parentNode.removeChild(this.blindElement);
        }

        // Clean up theme observer
        if (this._themeObserver) {
            this._themeObserver.disconnect();
        }

        // Clean up header observer
        if (this._headerObserver) {
            this._headerObserver.disconnect();
        }
    }

    renderInitialStructure() {
        // Render minimal structure to prevent FOUC
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    height: 100%;
                    transition: width 0.3s ease, min-width 0.3s ease;
                }
            </style>
            <div class="sidebar-container"></div>
        `;
    }

    async loadMenu(src) {
        try {
            const response = await fetch(src);
            if (!response.ok) {
                throw new Error(`Failed to load menu: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();

            // Handle both array format and object with menu property
            if (Array.isArray(data)) {
                this.state.menuData = data;
            } else if (data.menu && Array.isArray(data.menu)) {
                this.state.menuData = data.menu;
            } else {
                console.error('[sfUI.sidebar] Invalid menu data format:', data);
                this.state.menuData = [];
            }

            this.render();
        } catch (error) {
            console.error('[sfUI.sidebar] Error loading menu:', error);
            this.state.menuData = [];
            this.render();
        }
    }

    loadMenuFromAttribute(jsonString) {
        try {
            const data = JSON.parse(jsonString);

            // Handle both array format and object with menu property
            if (Array.isArray(data)) {
                this.state.menuData = data;
            } else if (data.menu && Array.isArray(data.menu)) {
                this.state.menuData = data.menu;
            } else {
                console.error('[sfUI.sidebar] Invalid menu data format in data-menu attribute:', data);
                this.state.menuData = [];
            }

            this.render();
        } catch (error) {
            console.error('[sfUI.sidebar] Error parsing data-menu attribute:', error);
            this.state.menuData = [];
            this.render();
        }
    }

    getAutoMode() {
        const width = window.innerWidth;
        if (width <= this.BREAKPOINTS.MOBILE) return this.MODE.HIDE;
        if (width <= this.BREAKPOINTS.TABLET) return this.MODE.MINI;
        return this.MODE.FULL;
    }

    saveState() {
        localStorage.setItem('sfSidebarLocked', this.state.isLocked.toString());
        localStorage.setItem('sfSidebarMode', this.state.mode);
    }

    restoreState() {
        const locked = localStorage.getItem('sfSidebarLocked');
        const mode = localStorage.getItem('sfSidebarMode');

        if (locked === 'true') {
            this.state.isLocked = true;
            if (mode) {
                this.state.mode = mode;
            }
        } else {
            this.state.mode = this.getAutoMode();
        }

        this.updateMode();
    }

    render() {
        const styles = this.getStyles();
        const content = this.renderMenu();

        this.shadowRoot.innerHTML = `
            ${styles}
            <div class="sidebar-container" data-mode="${this.state.mode}" data-theme="${this.state.theme}">
                <div class="sidebar-scroll">
                    <div class="menu-list">
                        ${content}
                    </div>
                </div>
            </div>
        `;

        // Initialize simplebar if available
        this.initializeSimplebar();
    }

    initializeSimplebar() {
        // simplebar 사용 제거: 더 이상 SimpleBar 인스턴스를 생성하지 않습니다.
        // 이전에는 shadowRoot 내 [data-simplebar] 요소를 찾아 window.SimpleBar가 있으면
        // new SimpleBar(scrollContainer)를 호출했습니다. 현재는 no-op으로 유지합니다.
    }

    renderMenu() {
        if (!this.state.menuData || this.state.menuData.length === 0) {
            const menuSrc = this.getAttribute('menu-src');

            // Only show warnings if menu-src was provided but failed to load
            if (menuSrc) {
                console.warn('[sfUI.sidebar] No menu items to render. Menu source:', menuSrc);
                return `<div class="menu-empty" style="padding: 1rem; text-align: center; color: var(--menu-text-color); opacity: 0.7;">
                    <i class="bi bi-exclamation-triangle" style="font-size: 2rem; display: block; margin-bottom: 0.5rem;"></i>
                    <div style="font-size: 0.9rem;">No menu items</div>
                    <div style="font-size: 0.75rem; margin-top: 0.5rem; opacity: 0.7;">Source: ${menuSrc}</div>
                </div>`;
            }

            return '';
        }

        const menuHtml = this.state.menuData.map((menu, idx) => {
            return this.renderMenuItem(menu, idx);
        }).join('<div class="menu-gap"></div>');

        return menuHtml;
    }

    renderMenuItem(menu, idx) {
        const hasSubmenu = menu.sub && menu.sub.length > 0;
        const isActive = this.isMenuActive(menu);
        const isOpen = hasSubmenu && (menu.subopened || isActive);

        let html = '';

        // Main menu item
        if (menu.link) {
            html += `
                <a class="menu-item ${isActive ? 'active' : ''}"
                   href="${menu.link}"
                   data-idx="${idx}">
                    <span class="menu-icon">
                        <i class="bi ${menu.icon}"></i>
                    </span>
                    <span class="menu-text">${menu.title}</span>
                </a>
            `;
        } else if (hasSubmenu) {
            const shouldBeOpen = isActive || menu.subopened;
            const activeClass = isActive ? 'active' : '';
            const openClass = shouldBeOpen ? 'open' : '';
            html += `
                <div class="menu-item ${activeClass} ${openClass}"
                     data-idx="${idx}"
                     data-toggle="collapse"
                     data-target="submenu-${idx}"
                     data-subopened="${menu.subopened ? 'true' : 'false'}">
                    <span class="menu-icon">
                        <i class="bi ${menu.icon}"></i>
                    </span>
                    <span class="menu-text">${menu.title}</span>
                    <span class="menu-arrow">
                        <i class="bi bi-chevron-down"></i>
                    </span>
                </div>
            `;
        } else {
            html += `
                <div class="menu-item" data-idx="${idx}">
                    <span class="menu-icon">
                        <i class="bi ${menu.icon}"></i>
                    </span>
                    <span class="menu-text">${menu.title}</span>
                </div>
            `;
        }

        // Submenu
        if (hasSubmenu) {
            const subClass = isOpen ? 'show' : '';
            const openedClass = menu.subopened ? 'opened' : '';
            html += `
                <div class="submenu ${subClass} ${openedClass}" id="submenu-${idx}">
                    ${menu.sub.map(submenu => this.renderSubmenuItem(submenu, menu)).join('')}
                </div>
            `;
        }

        return html;
    }

    renderSubmenuItem(submenu, parentMenu) {
        const isActive = this.isSubmenuActive(submenu);

        if (submenu.link) {
            return `
                <a class="submenu-item ${isActive ? 'active' : ''}" href="${submenu.link}">
                    <span class="submenu-icon">
                        <i class="fa-solid fa-angle-right"></i>
                    </span>
                    <span class="submenu-text">${submenu.title}</span>
                </a>
            `;
        } else {
            return `
                <div class="submenu-item">
                    <span class="submenu-text">${submenu.title}</span>
                </div>
            `;
        }
    }

    isMenuActive(menu) {
        if (!this.state.currentPath) return false;

        if (menu.link) {
            return this.matchPath(menu.link);
        }

        if (menu.sub) {
            return menu.sub.some(submenu => this.isSubmenuActive(submenu));
        }

        return false;
    }

    isSubmenuActive(submenu) {
        if (!submenu.link || !this.state.currentPath) return false;
        return this.matchPath(submenu.link);
    }

    matchPath(link) {
        const linkParts = link.split('/').filter(p => p);
        const pathParts = this.state.currentPath.split('/').filter(p => p);

        if (linkParts.length !== pathParts.length) return false;

        return linkParts.every((part, idx) => part === pathParts[idx]);
    }

    updateActiveMenu() {
        this.render();
    }

    setupEventListeners() {
        // Window resize
        window.addEventListener('resize', () => this.handleResize());

        // Menu item clicks
        this.shadowRoot.addEventListener('click', (e) => {
            const menuItem = e.target.closest('[data-toggle="collapse"]');
            if (menuItem) {
                this.toggleSubmenu(menuItem);
            }
        });

        // Hover events for mini mode
        const container = this.shadowRoot.querySelector('.sidebar-container');
        container.addEventListener('mouseenter', () => this.handleMouseEnter());
        container.addEventListener('mouseleave', () => this.handleMouseLeave());
    }

    toggleSubmenu(menuItem) {
        const targetId = menuItem.getAttribute('data-target');
        const submenu = this.shadowRoot.querySelector(`#${targetId}`);

        if (!submenu) return;

        // Check if this menu is marked as subopened (always open)
        const isSubopened = menuItem.getAttribute('data-subopened') === 'true';
        const isCurrentlyOpen = menuItem.classList.contains('open');

        // If subopened is true and menu is currently open, don't allow closing
        if (isSubopened && isCurrentlyOpen) {
            return;
        }

        menuItem.classList.toggle('open');
        submenu.classList.toggle('show');
    }

    handleResize() {
        if (this.state.isLocked) return;

        const newMode = this.getAutoMode();
        if (newMode !== this.state.mode) {
            this.state.mode = newMode;
            this.updateMode();
        }
    }

    handleMouseEnter() {
        if (this.state.mode === this.MODE.MINI && !this.state.isTemporaryFull) {
            this.state.isTemporaryFull = true;
            this.shadowRoot.querySelector('.sidebar-container').setAttribute('data-mode', 'full-temp');
            this.dispatchEvent(new CustomEvent('sidebar-expand', { bubbles: true, composed: true }));
        }
    }

    handleMouseLeave() {
        if (this.state.isTemporaryFull) {
            this.state.isTemporaryFull = false;
            this.shadowRoot.querySelector('.sidebar-container').setAttribute('data-mode', this.state.mode);

            // Close temporary opened submenus
            this.shadowRoot.querySelectorAll('.submenu:not(.opened)').forEach(submenu => {
                if (submenu.classList.contains('show')) {
                    const menuItem = this.shadowRoot.querySelector(`[data-target="${submenu.id}"]`);
                    if (menuItem && !menuItem.classList.contains('active')) {
                        submenu.classList.remove('show');
                        menuItem.classList.remove('open');
                    }
                }
            });

            this.dispatchEvent(new CustomEvent('sidebar-collapse', { bubbles: true, composed: true }));
        }
    }

    updateMode() {
        const container = this.shadowRoot.querySelector('.sidebar-container');
        if (!container) return;

        container.setAttribute('data-mode', this.state.mode);

        // Update host width
        switch (this.state.mode) {
            case this.MODE.FULL:
                this.style.width = '240px';
                this.style.minWidth = '240px';
                this.style.display = 'inline-block';
                break;
            case this.MODE.MINI:
                this.style.width = '60px';
                this.style.minWidth = '60px';
                this.style.display = 'inline-block';
                break;
            case this.MODE.HIDE:
                this.style.display = 'none';
                break;
        }

        // Update blind visibility based on mode and screen size
        const windowWidth = window.innerWidth;
        if (this.state.mode === this.MODE.FULL && windowWidth <= this.BREAKPOINTS.TABLET) {
            this.showBlind();
        } else {
            this.hideBlind();
        }

        this.saveState();
        this.dispatchEvent(new CustomEvent('mode-change', {
            detail: { mode: this.state.mode, isLocked: this.state.isLocked },
            bubbles: true,
            composed: true
        }));
    }

    updateTheme() {
        const container = this.shadowRoot.querySelector('.sidebar-container');
        if (container) {
            container.setAttribute('data-theme', this.state.theme);
        }
    }

    // Public API
    setMode(mode) {
        if (Object.values(this.MODE).includes(mode)) {
            this.state.mode = mode;
            this.updateMode();
        }
    }

    getMode() {
        return this.state.mode;
    }

    setLocked(locked) {
        this.state.isLocked = locked;
        this.saveState();
        this.dispatchEvent(new CustomEvent('lock-change', {
            detail: { isLocked: this.state.isLocked },
            bubbles: true,
            composed: true
        }));
    }

    isLocked() {
        return this.state.isLocked;
    }

    toggleLock() {
        this.setLocked(!this.state.isLocked);
    }

    setTheme(theme) {
        this.state.theme = theme;
        this.updateTheme();
    }

    setFontFamily(fontFamily) {
        this.state.fontFamily = fontFamily || "'Pretendard GOV Variable', sans-serif";
        this.render();
    }

    setIconSize(iconSize) {
        this.state.iconSize = iconSize || '1.2rem';
        this.render();
    }

    setMenuData(menuData) {
        if (Array.isArray(menuData)) {
            this.state.menuData = menuData;
        } else if (menuData && menuData.menu && Array.isArray(menuData.menu)) {
            this.state.menuData = menuData.menu;
        } else {
            console.error('[sfUI.sidebar] Invalid menu data format. Expected array or object with menu property.');
            this.state.menuData = [];
        }
        this.render();
    }

    toggleMenu() {
        const windowWidth = window.innerWidth;

        // 600px 이하: Hide <-> Full toggle
        if (windowWidth <= this.BREAKPOINTS.MOBILE) {
            if (this.state.mode === this.MODE.HIDE) {
                this.state.mode = this.MODE.FULL;
                this.state.isLocked = false;
            } else {
                this.state.mode = this.MODE.HIDE;
                this.state.isLocked = false;
            }
        }
        // 600px ~ 1000px or above: Lock/Unlock toggle
        else {
            if (this.state.mode === this.MODE.FULL) {
                if (this.state.isLocked) {
                    // Unlock and go to auto mode
                    this.state.isLocked = false;
                    this.state.mode = this.getAutoMode();
                } else {
                    // Lock to mini
                    this.state.mode = this.MODE.MINI;
                    this.state.isLocked = true;
                }
            } else if (this.state.mode === this.MODE.MINI) {
                if (this.state.isLocked) {
                    // Unlock and go to auto mode
                    this.state.isLocked = false;
                    this.state.mode = this.getAutoMode();
                } else {
                    // Lock to full
                    this.state.mode = this.MODE.FULL;
                    this.state.isLocked = true;
                }
            } else if (this.state.mode === this.MODE.HIDE) {
                // Open to full temporarily
                this.state.mode = this.MODE.FULL;
                this.state.isLocked = false;
            }
        }

        this.updateMode();
        this.saveState();
    }

    closeMenu() {
        const autoMode = this.getAutoMode();
        this.state.mode = (autoMode === this.MODE.HIDE) ? this.MODE.HIDE : this.MODE.MINI;
        this.state.isLocked = false;
        this.updateMode();
        this.saveState();
    }

    getStyles() {
        return `
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }

                :host {
                    display: block;
                    height: 100%;
                    transition: width 0.3s ease, min-width 0.3s ease;
                    font-family: ${this.state.fontFamily};
                    -webkit-font-smoothing: antialiased;
                    -moz-osx-font-smoothing: grayscale;
                    text-rendering: optimizeLegibility;
                }

                .sidebar-container {
                    height: 100%;
                    overflow: hidden;
                    background-color: var(--sidebar-bg);
                    color: var(--sidebar-text);
                    transition: all 0.3s ease;
                }

                /* Theme variables */
                .sidebar-container[data-theme="light"] {
                    --sidebar-bg: #2a3042;
                    --sidebar-text: #fefefe;
                    --menu-item-hover: rgba(255, 255, 255, 0.1);
                    --menu-item-active: rgba(255, 255, 255, 0.15);
                    --menu-text-color: #bdbdbd;
                    --menu-text-active: #ffffff;
                    --submenu-bg: rgba(0, 0, 0, 0.1);
                    --scrollbar-color: #909090;
                }

                .sidebar-container[data-theme="dark"] {
                    --sidebar-bg: #101010;
                    --sidebar-text: #b0b0b0;
                    --menu-item-hover: rgba(255, 255, 255, 0.05);
                    --menu-item-active: rgba(255, 255, 255, 0.1);
                    --menu-text-color: #b0b0b0;
                    --menu-text-active: #f0f0f0;
                    --submenu-bg: rgba(0, 0, 0, 0.2);
                    --scrollbar-color: #505050;
                }

                .sidebar-scroll {
                    height: 100%;
                    overflow-y: auto;
                }

                .menu-list {
                    padding: 1rem 0;
                }

                .menu-item,
                .submenu-item {
                    display: flex;
                    align-items: center;
                    padding: 0.5rem 1rem;
                    min-height: 40px;
                    cursor: pointer;
                    transition: background-color 0.2s;
                    text-decoration: none;
                    color: var(--menu-text-color);
                    position: relative;
                    line-height: 1.5;
                }

                .menu-item:hover,
                .submenu-item:hover {
                    background-color: var(--menu-item-hover);
                }

                .menu-item.active,
                .submenu-item.active {
                    background-color: var(--menu-item-active);
                    color: var(--menu-text-active);
                }

                .menu-icon {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 20px;
                    min-width: 20px;
                    max-width: 20px;
                    height: 20px;
                    font-size: ${this.state.iconSize};
                    line-height: 1;
                    flex-shrink: 0;
                    /* Reserve space even before icon font loads */
                    &::before {
                        content: '';
                        display: inline-block;
                        width: 1px;
                        height: 20px;
                    }
                }

                .menu-icon > i,
                .menu-icon > svg {
                    display: block;
                    width: 100%;
                    text-align: center;
                }

                .menu-text {
                    flex: 1;
                    margin-left: 0.5rem;
                    font-size: 1rem;
                    line-height: 1.5;
                    white-space: nowrap;
                    opacity: 1;
                    visibility: visible;
                    transition: opacity 0.3s ease, visibility 0.3s ease;
                    will-change: opacity;
                }

                .menu-arrow {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 16px;
                    min-width: 16px;
                    margin-left: auto;
                    opacity: 1;
                    visibility: visible;
                    transition: transform 0.3s, opacity 0.3s ease, visibility 0.3s ease;
                    flex-shrink: 0;
                }

                .menu-arrow > i,
                .menu-arrow > svg {
                    display: block;
                }

                .menu-item.open .menu-arrow {
                    transform: rotate(180deg);
                }

                /* Subopened menu - prevent closing, visual feedback */
                .menu-item[data-subopened="true"].open {
                    cursor: default;
                }

                .menu-item[data-subopened="true"] .menu-arrow {
                    display: none;
                }

                .submenu {
                    max-height: 0;
                    overflow: hidden;
                    transition: max-height 0.3s ease;
                    background-color: var(--submenu-bg);
                }

                .submenu.show {
                    max-height: 1000px;
                }

                .submenu-item {
                    padding-left: 2.5rem;
                    font-size: 0.9rem;
                    min-height: 36px;
                    line-height: 1.5;
                }

                .submenu-icon {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 12px;
                    min-width: 12px;
                    font-size: 0.7rem;
                    margin-right: 0.5rem;
                    line-height: 1;
                    flex-shrink: 0;
                }

                .submenu-icon > i,
                .submenu-icon > svg {
                    display: block;
                }

                .submenu-text {
                    font-size: 0.85rem;
                    line-height: 1.5;
                    opacity: 1;
                    visibility: visible;
                    transition: opacity 0.3s ease, visibility 0.3s ease;
                    will-change: opacity;
                }

                .menu-gap {
                    height: 0.8rem;
                }

                /* Mini mode styles */
                .sidebar-container[data-mode="mini"] .menu-text,
                .sidebar-container[data-mode="mini"] .menu-arrow {
                    opacity: 0;
                    visibility: hidden;
                    max-width: 0;
                    margin: 0;
                }

                .sidebar-container[data-mode="mini"] .submenu {
                    display: none;
                }

                .sidebar-container[data-mode="mini"] .menu-item {
                    justify-content: center;
                    padding: 0.5rem;
                }

                .sidebar-container[data-mode="mini"] .menu-icon {
                    margin: 0;
                }

                /* Full-temp mode (mini hover) */
                .sidebar-container[data-mode="full-temp"] .menu-text,
                .sidebar-container[data-mode="full-temp"] .menu-arrow {
                    opacity: 1;
                    visibility: visible;
                    max-width: none;
                }

                .sidebar-container[data-mode="full-temp"] .menu-text {
                    margin-left: 0.5rem;
                }

                .sidebar-container[data-mode="full-temp"] .menu-arrow {
                    margin-left: auto;
                }

                .sidebar-container[data-mode="full-temp"] .submenu.show {
                    display: block;
                }

                .sidebar-container[data-mode="full-temp"] .menu-item {
                    justify-content: flex-start;
                    padding: 0.5rem 1rem;
                }

                /* Scrollbar styles */
                .sidebar-scroll::-webkit-scrollbar {
                    width: 6px;
                }

                .sidebar-scroll::-webkit-scrollbar-track {
                    background: transparent;
                }

                .sidebar-scroll::-webkit-scrollbar-thumb {
                    background: var(--scrollbar-color);
                    border-radius: 3px;
                }

                .sidebar-scroll::-webkit-scrollbar-thumb:hover {
                    background: #888;
                }

                /* Empty state */
                .menu-empty {
                    padding: 1rem;
                    text-align: center;
                    color: var(--menu-text-color);
                    font-size: 0.9rem;
                }

                /* Link styles */
                a.menu-item,
                a.submenu-item {
                    color: inherit;
                    text-decoration: none;
                }
            </style>
        `;
    }
}

// Define custom element
customElements.define('sf-sidebar', SFSidebar);

/**
 * sfUI Sidebar API
 * Provides programmatic access to sidebar instances
 */
const sfUISidebar = {
    /**
     * Create a new sidebar instance
     * @param {string} selector - CSS selector for the sidebar element
     * @param {Object} options - Configuration options
     * @returns {HTMLElement} The sidebar element
     */
    create(selector, options = {}) {
        const sidebar = document.createElement('sf-sidebar');

        // Set attributes from options
        if (options.mode) sidebar.setAttribute('mode', options.mode);
        if (options.locked !== undefined) sidebar.setAttribute('locked', options.locked.toString());
        if (options.theme) sidebar.setAttribute('theme', options.theme);
        if (options.menuSrc) sidebar.setAttribute('menu-src', options.menuSrc);
        if (options.currentPath) sidebar.setAttribute('current-path', options.currentPath);
        if (options.fontFamily) sidebar.setAttribute('font-family', options.fontFamily);
        if (options.iconSize) sidebar.setAttribute('icon-size', options.iconSize);

        // Find container and append
        const container = document.querySelector(selector);
        if (container) {
            container.appendChild(sidebar);
        }

        return sidebar;
    },

    /**
     * Get sidebar instance
     * @param {string} selector - CSS selector for the sidebar element
     * @returns {HTMLElement|null} The sidebar element or null
     */
    get(selector) {
        return document.querySelector(selector);
    },

    /**
     * Initialize existing sidebar element
     * @param {string|HTMLElement} element - Selector or element
     * @param {Object} options - Configuration options
     * @returns {HTMLElement|null} The sidebar element
     */
    init(element, options = {}) {
        const sidebar = typeof element === 'string'
            ? document.querySelector(element)
            : element;

        if (!sidebar) return null;

        // Update attributes from options
        if (options.mode) sidebar.setAttribute('mode', options.mode);
        if (options.locked !== undefined) sidebar.setAttribute('locked', options.locked.toString());
        if (options.theme) sidebar.setAttribute('theme', options.theme);
        if (options.menuSrc) sidebar.setAttribute('menu-src', options.menuSrc);
        if (options.currentPath) sidebar.setAttribute('current-path', options.currentPath);
        if (options.fontFamily) sidebar.setAttribute('font-family', options.fontFamily);
        if (options.iconSize) sidebar.setAttribute('icon-size', options.iconSize);

        return sidebar;
    },

    /**
     * Set mode for a sidebar
     * @param {string|HTMLElement} element - Selector or element
     * @param {string} mode - Mode: 'full', 'mini', or 'hide'
     */
    setMode(element, mode) {
        const sidebar = typeof element === 'string'
            ? document.querySelector(element)
            : element;

        if (sidebar && sidebar.setMode) {
            sidebar.setMode(mode);
        }
    },

    /**
     * Get mode of a sidebar
     * @param {string|HTMLElement} element - Selector or element
     * @returns {string|null} Current mode or null
     */
    getMode(element) {
        const sidebar = typeof element === 'string'
            ? document.querySelector(element)
            : element;

        return sidebar && sidebar.getMode ? sidebar.getMode() : null;
    },

    /**
     * Set lock state
     * @param {string|HTMLElement} element - Selector or element
     * @param {boolean} locked - Lock state
     */
    setLocked(element, locked) {
        const sidebar = typeof element === 'string'
            ? document.querySelector(element)
            : element;

        if (sidebar && sidebar.setLocked) {
            sidebar.setLocked(locked);
        }
    },

    /**
     * Get lock state
     * @param {string|HTMLElement} element - Selector or element
     * @returns {boolean|null} Lock state or null
     */
    isLocked(element) {
        const sidebar = typeof element === 'string'
            ? document.querySelector(element)
            : element;

        return sidebar && sidebar.isLocked ? sidebar.isLocked() : null;
    },

    /**
     * Toggle lock state
     * @param {string|HTMLElement} element - Selector or element
     */
    toggleLock(element) {
        const sidebar = typeof element === 'string'
            ? document.querySelector(element)
            : element;

        if (sidebar && sidebar.toggleLock) {
            sidebar.toggleLock();
        }
    },

    /**
     * Set theme
     * @param {string|HTMLElement} element - Selector or element
     * @param {string} theme - Theme: 'light' or 'dark'
     */
    setTheme(element, theme) {
        const sidebar = typeof element === 'string'
            ? document.querySelector(element)
            : element;

        if (sidebar && sidebar.setTheme) {
            sidebar.setTheme(theme);
        }
    },

    /**
     * Set font family
     * @param {string|HTMLElement} element - Selector or element
     * @param {string} fontFamily - CSS font-family value
     */
    setFontFamily(element, fontFamily) {
        const sidebar = typeof element === 'string'
            ? document.querySelector(element)
            : element;

        if (sidebar && sidebar.setFontFamily) {
            sidebar.setFontFamily(fontFamily);
        }
    },

    /**
     * Set icon size
     * @param {string|HTMLElement} element - Selector or element
     * @param {string} iconSize - CSS size value (e.g., '1.2rem', '16px')
     */
    setIconSize(element, iconSize) {
        const sidebar = typeof element === 'string'
            ? document.querySelector(element)
            : element;

        if (sidebar && sidebar.setIconSize) {
            sidebar.setIconSize(iconSize);
        }
    },

    /**
     * Set menu data directly
     * @param {string|HTMLElement} element - Selector or element
     * @param {Array|Object} menuData - Menu data array or object with menu property
     */
    setMenuData(element, menuData) {
        const sidebar = typeof element === 'string'
            ? document.querySelector(element)
            : element;

        if (sidebar && sidebar.setMenuData) {
            sidebar.setMenuData(menuData);
        }
    }
};

/**
 * sfUI Notice Board Component
 * Notice board web component for displaying messages with different styles
 * @version 1.0.0
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

/**
 * sfUI Main Module
 * Main sfUI object that aggregates all components
 * @version 1.0.0
 */

// Create main sfUI object
const sfUI = {
    // Core utilities
    init: (options) => sfUICore.init(options),
    getLanguage: () => sfUICore.getLanguage(),
    setLanguage: (lang) => sfUICore.setLanguage(lang),
    getTheme: () => sfUICore.getTheme(),
    setTheme: (theme) => sfUICore.setTheme(theme),
    toggleTheme: () => sfUICore.toggleTheme(),
    onThemeChange: (callback) => sfUICore.onThemeChange(callback),
    getNextZIndex: () => sfUICore.getNextZIndex(),
    formatNumber: (num, decimals, decPoint, thousandsSep) =>
        sfUICore.formatNumber(num, decimals, decPoint, thousandsSep),
    formatNumberShort: (num) => sfUICore.formatNumberShort(num),

    // Components
    alert: sfUIAlert,
    modal: sfUIModal,
    lightbox: sfUILightBox,
    rangeslider: sfUIRangeSlider,
    sidebar: sfUISidebar,

    // Version
    version: '1.0.0'
};

// Auto-initialize on DOM ready
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            sfUICore.autoInit();
        });
    } else {
        sfUICore.autoInit();
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = sfUI;
}

// Make available globally
if (typeof window !== 'undefined') {
    window.sfUI = sfUI;
}
