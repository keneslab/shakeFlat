/**
 * sfUI Core Module
 * Common utilities and base functionality for all sfUI components
 * @version 1.0.0
 */

class SfUICore {
    constructor() {
        this.config = {
            zIndexBase: 100000,
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
        const modals = document.querySelectorAll('.sfui-overlay, .sfui-modal, .modal-backdrop, .modal, .sfui-alert-wrapper, .sfui-alert-overlay');
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
