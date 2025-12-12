/**
 * sfUI Main Module
 * Main sfUI object that aggregates all components
 * @version 1.1.0
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
    version: '1.1.0'
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
