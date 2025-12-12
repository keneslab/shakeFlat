/**
 * sfUI RangeSlider Module
 * Interactive range slider for number inputs
 * @version 1.1.0
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
