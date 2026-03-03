/**
 * sfUI Sidebar Component
 * Version: 1.1.0
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
                    color: var(--menu-text-color);
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
