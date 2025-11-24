// ==============================================
//   FOUC 방지를 위한 즉시 테마 적용
//   이 코드는 DOM 로드 전에 실행되어야 합니다
// ==============================================

// sfThemeManager 정의 전에 실행되므로, 인라인으로 간단한 버전 구현
(function() {
    function getCookieValue(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    }

    function isSystemDarkMode() {
        return window.matchMedia?.('(prefers-color-scheme: dark)').matches || false;
    }

    try {
        let theme = 'light';
        const cookie = getCookieValue('sfTheme');

        if (cookie) {
            const data = JSON.parse(decodeURIComponent(cookie));
            const select = data.select || 'auto';

            if (select === 'auto') {
                theme = isSystemDarkMode() ? 'dark' : 'light';
            } else if (select === 'light' || select === 'dark') {
                theme = select;
            }
        } else {
            theme = isSystemDarkMode() ? 'dark' : 'light';
        }

        // 테마 속성 즉시 적용
        document.documentElement.setAttribute('data-bs-theme', theme);
        document.documentElement.setAttribute('data-theme', theme);
    } catch (e) {
        // 에러 발생 시 기본 light 테마 적용
        document.documentElement.setAttribute('data-bs-theme', 'light');
        document.documentElement.setAttribute('data-theme', 'light');
    }
})();

// ==============================================
//   CLOCK MANAGER
// ==============================================
sfUICore.loadFont([{
    family: 'Oswald',
    src: '/assets/fonts/oswald-v49/oswald-v49-latin-ext_latin_cyrillic-ext_cyrillic-regular.woff2',
    weight: 400
}]);

const sfClockManager = {
    // 상수
    MONTH_NAMES: [ "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" ],
    DAY_NAMES: [ "Sun","Mon","Tue","Wed","Thu","Fri","Sat" ],

    // DOM 요소 캐싱
    elements: {
        date: null,
        sec: null,
        min: null,
        hours: null
    },

    // 초기화
    init() {
        // DOM 요소 캐싱
        this.elements.date = document.getElementById('shakeflat-clock-date');
        this.elements.sec = document.getElementById('shakeflat-clock-sec');
        this.elements.min = document.getElementById('shakeflat-clock-min');
        this.elements.hours = document.getElementById('shakeflat-clock-hours');

        this.update();
    },

    // 시계 업데이트
    update() {
        const now = new Date();
        const seconds = now.getSeconds();
        const minutes = now.getMinutes();
        const hours = now.getHours();

        // 날짜 표시 업데이트
        if (this.elements.date) {
            this.elements.date.textContent =
                `${this.DAY_NAMES[now.getDay()]} ${now.getDate()} ${this.MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;
        }

        // 시간 표시 업데이트 (한 번에 처리)
        if (this.elements.sec) this.elements.sec.textContent = this.padZero(seconds);
        if (this.elements.min) this.elements.min.textContent = this.padZero(minutes);
        if (this.elements.hours) this.elements.hours.textContent = this.padZero(hours);

        setTimeout(() => this.update(), 1000);
    },

    // 0 패딩 헬퍼 함수
    padZero(num) {
        return num < 10 ? "0" + num : num.toString();
    }
};

// ==============================================
//   LEFT MENU MANAGER (Web Component Integration)
// ==============================================

const sfLeftMenuManager = {
    // DOM 요소 캐싱
    elements: {
        sidebar: null,
        hamburgerBtn: null
    },

    // 초기화
    init() {
        this.elements.hamburgerBtn = document.getElementById('shakeflat-btn-left-menu');

        // Web component를 window.sfSidebar에서 가져옴 (layout.html에서 설정됨)
        this.elements.sidebar = window.sfSidebar;

        if (!this.elements.sidebar) {
            console.warn('[sfLeftMenuManager] SF-Sidebar component not ready yet. Retrying...');
            // 웹 컴포넌트가 아직 초기화되지 않았다면 약간 대기 후 재시도
            setTimeout(() => this.retryInit(), 500);
            return;
        }

        this.setupSidebar();
    },

    // 재시도 로직
    retryInit() {
        this.elements.sidebar = window.sfSidebar;

        if (!this.elements.sidebar) {
            console.error('[sfLeftMenuManager] SF-Sidebar component still not found');
            return;
        }

        console.log('[sfLeftMenuManager] SF-Sidebar component found after delay');
        this.setupSidebar();
    },

    // 사이드바 설정
    setupSidebar() {
        // 웹 컴포넌트 이벤트 리스너 설정
        this.setupEventListeners();

        // 햄버거 버튼 클릭 이벤트
        if (this.elements.hamburgerBtn) {
            this.elements.hamburgerBtn.addEventListener('click', () => this.handleHamburgerClick());
        }

        // 초기 상태 설정
        this.updateHamburgerIcon();
    },

    // 웹 컴포넌트 이벤트 리스너 설정
    setupEventListeners() {
        // 모드 변경 이벤트
        this.elements.sidebar.addEventListener('mode-change', (e) => {
            console.log('[sfLeftMenuManager] Sidebar mode changed:', e.detail);
            this.updateHamburgerIcon();
        });

        // 락 변경 이벤트
        this.elements.sidebar.addEventListener('lock-change', (e) => {
            console.log('[sfLeftMenuManager] Sidebar lock changed:', e.detail);
            this.updateHamburgerIcon();
        });
    },

    // 햄버거 버튼 아이콘 업데이트
    updateHamburgerIcon() {
        if (!this.elements.sidebar || !this.elements.hamburgerBtn) return;

        // 기존 자물쇠 아이콘 제거
        const existingLockIcon = this.elements.hamburgerBtn.querySelector('.lock-icon');
        if (existingLockIcon) {
            existingLockIcon.remove();
        }

        const isLocked = this.elements.sidebar.isLocked();
        if (isLocked) {
            // 자물쇠 아이콘 추가
            const lockIcon = document.createElement('i');
            lockIcon.className = 'bi bi-lock-fill lock-icon';
            Object.assign(lockIcon.style, {
                position: 'absolute',
                top: '-1px',
                right: '2px',
                fontSize: '0.85rem',
                color: 'var(--bs-secondary-color)',
                zIndex: '10',
                borderRadius: '3px',
                padding: '1px 2px',
                pointerEvents: 'none'
            });
            this.elements.hamburgerBtn.appendChild(lockIcon);
        }
    },

    // 햄버거 버튼 클릭 처리
    handleHamburgerClick() {
        if (!this.elements.sidebar) return;

        const currentMode = this.elements.sidebar.getMode();
        console.log('[sfLeftMenuManager] Hamburger clicked, current mode:', currentMode);

        // 모드에 따라 토글
        if (currentMode === 'full') {
            this.elements.sidebar.setMode('mini');
        } else if (currentMode === 'mini') {
            this.elements.sidebar.setMode('full');
        } else if (currentMode === 'hide') {
            this.elements.sidebar.setMode('full');
        }
    }
};

// ==============================================
//   THEME MANAGER (통합 및 효율화)
// ==============================================
const sfThemeManager = {
    // 상수
    THEMES: {
        LIGHT: 'light',
        DARK: 'dark',
        AUTO: 'auto'
    },

    // DOM 요소 캐싱
    elements: {
        dropdown: null,
        dropdownButton: null,
        dropdownItems: null
    },

    // 현재 상태
    currentTheme: 'light',
    currentSelect: 'auto',

    // 쿠키에서 테마 정보 가져오기
    getThemeCookie() {
        const cookie = Cookies.get('sfTheme');
        if (!cookie) return { theme: this.THEMES.LIGHT, select: this.THEMES.AUTO };

        try {
            const data = JSON.parse(cookie);
            return {
                theme: (data.theme === this.THEMES.DARK) ? this.THEMES.DARK : this.THEMES.LIGHT,
                select: [this.THEMES.LIGHT, this.THEMES.DARK, this.THEMES.AUTO].includes(data.select) ? data.select : this.THEMES.AUTO
            };
        } catch (e) {
            return { theme: this.THEMES.LIGHT, select: this.THEMES.AUTO };
        }
    },

    // 쿠키에 테마 정보 저장
    setThemeCookie(theme, select) {
        const data = { theme, select };
        Cookies.set('sfTheme', JSON.stringify(data), { expires: 3650, path: '/' });
    },

    // 시스템 다크 모드 감지
    isSystemDarkMode() {
        return window.matchMedia?.('(prefers-color-scheme: dark)').matches || false;
    },

    // 테마 결정 (select에 따라)
    determineTheme(select) {
        if (select === this.THEMES.AUTO) {
            return this.isSystemDarkMode() ? this.THEMES.DARK : this.THEMES.LIGHT;
        }
        return (select === this.THEMES.DARK || select === this.THEMES.LIGHT) ? select : this.THEMES.LIGHT;
    },

    // 테마 속성 적용
    applyThemeAttributes(theme) {
        const elements = [document.documentElement, document.body];
        const attrs = {
            'data-bs-theme': theme,
            'data-theme': theme
        };

        elements.forEach(element => {
            Object.entries(attrs).forEach(([attr, value]) => {
                element.setAttribute(attr, value);
            });
        });
    },

    // UI 업데이트
    updateUI(select) {
        if (!this.elements.dropdownButton) return;

        const iconMap = {
            [this.THEMES.AUTO]: '<i class="bi bi-circle-half"></i> Auto',
            [this.THEMES.LIGHT]: '<i class="bi bi-sun-fill"></i> Light',
            [this.THEMES.DARK]: '<i class="bi bi-moon-stars-fill"></i> Dark'
        };

        this.elements.dropdownButton.innerHTML = iconMap[select] || iconMap[this.THEMES.AUTO];

        // 모든 드롭다운 아이템에서 active 클래스 제거
        this.elements.dropdownItems.forEach(item => item.classList.remove('active'));

        // 선택된 아이템에 active 클래스 추가
        const selectedItem = Array.from(this.elements.dropdownItems).find(
            item => item.getAttribute('data-bs-theme-value') === select
        );
        if (selectedItem) {
            selectedItem.classList.add('active');
        }
    },

    // 테마 설정 (외부 호출용)
    setTheme(select) {
        const theme = this.determineTheme(select);

        this.currentTheme = theme;
        this.currentSelect = select;

        this.applyThemeAttributes(theme);
        this.updateUI(select);
        this.setThemeCookie(theme, select);

        // SFNoticeBoard 컴포넌트들 테마 업데이트
        this.updateNoticeBoards(theme);
    },

    // SFNoticeBoard 컴포넌트들 테마 업데이트 (sfUI에서 로드됨)
    updateNoticeBoards(theme) {
        const noticeBoards = document.querySelectorAll('sf-notice');
        noticeBoards.forEach(board => {
            if (board.updateTheme && typeof board.updateTheme === 'function') {
                board.updateTheme();
            }
        });
    },

    // 초기 테마 적용 (FOUC 방지용 - DOM 로드 전 실행)
    applyInitialTheme() {
        const { theme: cookieTheme, select: themeSelect } = this.getThemeCookie();

        this.currentSelect = themeSelect;

        if (themeSelect === this.THEMES.AUTO) {
            this.currentTheme = this.determineTheme(this.THEMES.AUTO);
        } else {
            this.currentTheme = themeSelect;
        }

        this.applyThemeAttributes(this.currentTheme);
    },

    // 테마 감지 및 적용 (DOM 로드 후 실행)
    detectAndApplyTheme() {
        const { theme: cookieTheme, select: themeSelect } = this.getThemeCookie();

        this.currentSelect = themeSelect;

        if (themeSelect === this.THEMES.AUTO) {
            this.currentTheme = this.determineTheme(this.THEMES.AUTO);
            this.setThemeCookie(this.currentTheme, this.THEMES.AUTO);
        } else {
            this.currentTheme = themeSelect;
        }

        this.applyThemeAttributes(this.currentTheme);
        this.updateUI(this.currentSelect);
    },

    // 초기화 (DOM 로드 후)
    init() {
        // DOM 요소 캐싱
        this.elements.dropdown = document.querySelector('.shakeflat-theme-dropdown');
        if (this.elements.dropdown) {
            this.elements.dropdownButton = this.elements.dropdown.querySelector('button');
            this.elements.dropdownItems = this.elements.dropdown.querySelectorAll('.dropdown-menu button');
        }

        this.detectAndApplyTheme();
        this.setupThemeListener();
    },

    // 시스템 테마 변경 감지 설정
    setupThemeListener() {
        if (!window.matchMedia) return;

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleThemeChange = (e) => {
            // Auto 모드일 때만 시스템 테마 변경에 반응
            if (this.currentSelect === this.THEMES.AUTO) {
                this.currentTheme = e.matches ? this.THEMES.DARK : this.THEMES.LIGHT;
                this.applyThemeAttributes(this.currentTheme);
                this.setThemeCookie(this.currentTheme, this.THEMES.AUTO);

                // SFNoticeBoard 컴포넌트들 테마 업데이트
                this.updateNoticeBoards(this.currentTheme);
            }
        };

        // 모던 브라우저와 레거시 브라우저 모두 지원
        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', handleThemeChange);
        } else {
            mediaQuery.addListener(handleThemeChange);
        }
    },

    // 현재 테마 반환 (외부 호출용)
    getTheme() {
        return this.currentTheme;
    }
};

// ==============================================
//   LEGACY FUNCTION COMPATIBILITY (하위 호환성)
// ==============================================

// 테마 관련 레거시 함수 (다른 파일에서 사용됨)
function sfGetTheme() { return sfThemeManager.getTheme(); }

// ==============================================
//   INITIALIZATION AND EVENT HANDLERS
// ==============================================

// DOM이 준비되면 초기화
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    // DOMContentLoaded 이벤트가 이미 발생한 경우
    initializeApp();
}

function initializeApp() {
    // 매니저들 초기화 (sfLeftMenuManager가 사이드바 초기화를 처리함)
    sfClockManager.init();
    sfLeftMenuManager.init();
    sfThemeManager.init();

    // 테마 드롭다운 이벤트
    const themeDropdownButtons = document.querySelectorAll('.shakeflat-theme-dropdown .dropdown-menu button');
    themeDropdownButtons.forEach(button => {
        button.addEventListener('click', function() {
            sfThemeManager.setTheme(this.getAttribute('data-bs-theme-value'));
        });
    });

    // Sidebar에 아이콘 폰트 주입
    if (typeof sfUICore !== 'undefined' && sfUICore.injectIconFont) {
        // Bootstrap Icons 주입
        sfUICore.injectIconFont({
            cssUrl: '/assets/libs/bootstrap-icons-1.13.1/font/bootstrap-icons.css',
            components: 'sf-sidebar'
        }).then(result => {
            //console.log('[shakeFlat] Bootstrap Icons injected to sidebar:', result);
        }).catch(err => {
            console.error('[shakeFlat] Failed to inject Bootstrap Icons:', err);
        });

        // FontAwesome 주입 (서브메뉴 아이콘용)
        sfUICore.injectIconFont({
            cssUrl: '/assets/libs/fontawesome-free-7.1.0-web/css/all.min.css',
            components: 'sf-sidebar'
        }).then(result => {
            //console.log('[shakeFlat] FontAwesome injected to sidebar:', result);
        }).catch(err => {
            console.error('[shakeFlat] Failed to inject FontAwesome:', err);
        });
    } else {
        console.warn('[shakeFlat] sfUICore.injectIconFont is not available');
    }

    // Select2 테마 적용
    setTimeout(() => {
        if (typeof sfApplySelect2Theme === 'function') {
            sfApplySelect2Theme();
        }
        if (typeof sfSetupSelect2Observer === 'function') {
            sfSetupSelect2Observer();
        }
    }, 100);
}

// ==============================================
//   NOTICE BOARD WEB COMPONENT
//   Moved to sfUI library: /assets/libs/sfUI-1.0.0/src/sfui.notice.js
//   This component is now part of the sfUI component library
// ==============================================