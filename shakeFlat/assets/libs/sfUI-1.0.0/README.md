# sfUI - Unified UI Component Library

A modern, lightweight, vanilla JavaScript UI component library with zero dependencies.

## Features

- ✨ **Zero Dependencies** - Pure vanilla JavaScript, no jQuery required
- 🎨 **Modern Design** - Clean and professional UI components
- 📱 **Responsive** - Works perfectly on all devices
- 🌙 **Dark Mode** - Automatic dark mode with Bootstrap 5 integration
- 🚀 **Lightweight** - Minimal footprint for fast loading
- 🔧 **Easy to Use** - Simple and intuitive API
- 🌐 **i18n Support** - Built-in internationalization (Korean & English)
- 🎯 **Theme Aware** - Auto-syncs with Bootstrap theme settings

## Components

### 1. Alert
Alert, notification, confirm, and input dialogs with beautiful animations.

### 2. Modal
Reusable modal dialogs with customizable headers, bodies, and footers.

### 3. LightBox
Image lightbox gallery with keyboard navigation and touch support.

### 4. RangeSlider
Interactive range slider for number inputs with dual handles.

### 5. Sidebar
Responsive sidebar menu component with full, mini, and hide modes.

## Installation

### Include via CDN

```html
<!-- CSS -->
<link rel="stylesheet" href="/shakeFlat/assets/libs/sfUI-1.0.0/dist/sfui.css">

<!-- JavaScript -->
<script src="/shakeFlat/assets/libs/sfUI-1.0.0/dist/sfui.js"></script>
```

### Manual Installation

1. Copy the `sfUI-1.0.0` folder to your project
2. Include the CSS and JS files in your HTML

```html
<link rel="stylesheet" href="path/to/sfUI-1.0.0/dist/sfui.css">
<script src="path/to/sfUI-1.0.0/dist/sfui.js"></script>
```

## Usage

### Alert

```javascript
// Simple alert
sfUI.alert.alert('Hello World!');

// Alert with callback
sfUI.alert.alert('Message', function() {
    console.log('Alert closed');
});

// Notification
sfUI.alert.noti('Information message');

// Confirm dialog
sfUI.alert.confirm('Are you sure?',
    function() { console.log('Yes clicked'); },
    function() { console.log('No clicked'); }
);

// Input dialog
sfUI.alert.inputConfirm('Enter your name:', function(value) {
    console.log('User entered:', value);
});

// Legacy compatibility
alert('This still works!');
confirm('Confirm?', yesCallback, noCallback);
```

### Modal

```javascript
// Create a modal
const modal = sfUI.modal.create('myModal', {
    title: 'My Modal',
    body: {
        html: '<p>Modal content goes here</p>'
    },
    footer: {
        submit: {
            enable: true,
            text: 'Save',
            callback: function() {
                console.log('Save clicked');
            }
        }
    }
});

// Show modal
modal.show();

// Hide modal
modal.hide();

// Update content
modal.setBody('<p>New content</p>');
modal.setTitle('New Title');

// Get modal elements
const body = modal.getBody();
const header = modal.getHeader();
const footer = modal.getFooter();

// Legacy compatibility
const modal2 = sfModal('myModal2', options);
modal2.modal('show');
```

### LightBox

```html
<!-- HTML -->
<img src="thumb.jpg"
     data-sflightbox="gallery1"
     data-big="large.jpg"
     data-caption="Image caption"
     alt="Thumbnail">

<img src="thumb2.jpg"
     data-sflightbox="gallery1"
     data-big="large2.jpg"
     data-caption="Another image"
     alt="Thumbnail">
```

```javascript
// Manual initialization
sfUI.lightbox.init('img[data-sflightbox]');

// With custom options
sfUI.lightbox.init('img[data-sflightbox]', {
    overlayColor: 'rgba(0, 0, 0, 0.9)',
    captionColor: '#fff',
    transitionDuration: 500
});

// Programmatically open
sfUI.lightbox.open('gallery1', 'large.jpg');

// Close
sfUI.lightbox.close();
```

### RangeSlider

```html
<!-- HTML -->
<input type="text"
       id="priceRange"
       data-sfrangeslider
       data-min="0"
       data-max="1000000"
       data-thousands=","
       data-prefix="$">
```

```javascript
// Manual initialization
sfUI.rangeslider.init('#priceRange', {
    min: 0,
    max: 1000000,
    step: 1000,
    thousands: ',',
    prefix: '$',
    suffix: '',
    theme: 'auto' // 'auto', 'light', or 'dark'
});

// Listen for changes
document.getElementById('priceRange').addEventListener('apply.sfrangeslider', function(e) {
    console.log('Range:', e.detail.min, '-', e.detail.max);
});
```

### Sidebar

**Note:** The sidebar is created programmatically using the `sfUI.sidebar` API. Do not use the `<sf-sidebar>` HTML tag directly.

```html
<!-- HTML - Create a container for the sidebar -->
<div id="sidebar-container"></div>
```

```javascript
// Method 1: Create sidebar with menu from JSON file
const sidebar = sfUI.sidebar.create('#sidebar-container', {
    menuSrc: '/path/to/menu.json',
    mode: 'full',
    theme: 'light',
    currentActiveMenu: '/dashboard',
    locked: false
});

// Method 2: Create sidebar and set menu data directly (RECOMMENDED)
const sidebar = sfUI.sidebar.create('#sidebar-container', {
    mode: 'full',
    theme: 'light',
    currentActiveMenu: '/dashboard',
    locked: false
});

// Set menu data directly
const menuData = [
    {
        title: "Dashboard",
        icon: "bi-speedometer2",
        link: "/dashboard"
    },
    {
        title: "Users",
        icon: "bi-people",
        sub: [
            { title: "User List", link: "/users/list" },
            { title: "Add User", link: "/users/add" }
        ]
    }
];
sfUI.sidebar.setMenuData(sidebar, menuData);

// Or use the element directly
sidebar.setMenuData(menuData);

// Get existing sidebar instance
const sidebar = sfUI.sidebar.get('sf-sidebar');

// Set mode
sfUI.sidebar.setMode(sidebar, 'mini'); // 'full', 'mini', 'hide'

// Get mode
const mode = sfUI.sidebar.getMode(sidebar);

// Lock/unlock sidebar
sfUI.sidebar.setLocked(sidebar, true);
sfUI.sidebar.toggleLock(sidebar);

// Set theme
sfUI.sidebar.setTheme(sidebar, 'dark');

// Listen for events
sidebar.addEventListener('mode-change', (e) => {
    console.log('Mode changed:', e.detail.mode);
    console.log('Is locked:', e.detail.isLocked);
});

sidebar.addEventListener('lock-change', (e) => {
    console.log('Lock changed:', e.detail.isLocked);
});

// Menu data structure (array format)
[
    {
        "title": "Dashboard",
        "icon": "bi-speedometer2",
        "link": "/dashboard"
    },
    {
        "title": "Users",
        "icon": "bi-people",
        "sub": [
            {
                "title": "User List",
                "link": "/users/list"
            },
            {
                "title": "Add User",
                "link": "/users/add"
            }
        ]
    }
]

// Or object format with menu property (for JSON files)
{
    "menu": [
        // ... menu items
    ]
}
```

## Configuration

### Global Configuration

```javascript
sfUI.init({
    language: 'ko',           // 'ko' or 'en'
    zIndexBase: 10000,        // Base z-index for components
    animationDuration: 300    // Animation duration in ms
});

// Change language
sfUI.setLanguage('en');

// Get current language
const lang = sfUI.getLanguage();
```

### Theme Management

sfUI supports light and dark themes with automatic Bootstrap 5 integration.

```javascript
// Get current theme
const theme = sfUI.getTheme();
// Returns: 'light' or 'dark'

// Set theme (also sets Bootstrap's data-bs-theme)
sfUI.setTheme('dark');
sfUI.setTheme('light');

// Toggle theme
const newTheme = sfUI.toggleTheme();

// Listen for theme changes
sfUI.onThemeChange(function(theme) {
    console.log('Theme changed to:', theme);
});
```

**Theme Priority:**
1. Bootstrap 5's `data-bs-theme` attribute on `<html>` or `<body>`
2. Custom `data-theme` attribute
3. System preference (`prefers-color-scheme`)

**Bootstrap Integration:**
```html
<!-- Set theme via HTML attribute -->
<html data-bs-theme="dark">
<!-- or -->
<body data-bs-theme="dark">

<!-- Components will automatically follow Bootstrap theme -->
```

**Manual Theme Control:**
```javascript
// This will update both sfUI and Bootstrap themes
sfUI.setTheme('dark');

// Components automatically respond to theme changes
// No need to manually update each component
```

### Component Options

Each component supports extensive customization. See individual component documentation for details.

## Utilities

```javascript
// Format number
sfUI.formatNumber(1234567.89, 2, '.', ',');
// Output: "1,234,567.89"

// Format number to short form
sfUI.formatNumberShort(1500000);
// Output: "1.5M"

// Get current theme
const theme = sfUI.getTheme();
// Output: "light" or "dark"

// Set/Toggle theme
sfUI.setTheme('dark');
const newTheme = sfUI.toggleTheme();

// Watch theme changes
sfUI.onThemeChange(function(theme) {
    console.log('New theme:', theme);
});

// Web Font Loading
// Load Google Fonts
sfUI.loadFont({
    family: 'Noto Sans KR',
    src: 'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700&display=swap'
}).then(() => {
    console.log('Font loaded!');
    document.body.style.fontFamily = 'Noto Sans KR';
});

// Load local font files
sfUI.loadFont({
    family: 'My Custom Font',
    src: '/fonts/custom.woff2',
    weight: 400,
    style: 'normal',
    display: 'swap'
});

// Load font with multiple sources (fallback)
sfUI.loadFont({
    family: 'My Font',
    src: [
        { url: '/fonts/myfont.woff2', format: 'woff2' },
        { url: '/fonts/myfont.woff', format: 'woff' },
        { url: '/fonts/myfont.ttf', format: 'truetype' }
    ],
    weight: 400
});

// Load multiple fonts
sfUI.loadFont([
    { family: 'Font 1', src: 'https://fonts.googleapis.com/...' },
    { family: 'Font 2', src: '/fonts/font2.woff2' }
]);

// Preload fonts in background
sfUI.preloadFonts([
    { family: 'Font 1', src: '...' },
    { family: 'Font 2', src: '...' }
]);

// Check if font is loaded
if (sfUI.isFontLoaded('Noto Sans KR', 400, 'normal')) {
    console.log('Font is ready!');
}

// Wait for font to be ready
await sfUI.waitForFont('Noto Sans KR');

// Get all loaded fonts
const loadedFonts = sfUI.getLoadedFonts();
console.log(loadedFonts); // ['Noto Sans KR-400-normal', ...]

// Clear font cache
sfUI.clearFontCache();

// Icon Font Injection for Web Components (NEW in v1.1)
// Inject Bootstrap Icons to all sfUI components
await sfUI.injectIconFont({
    cssUrl: '/assets/libs/bootstrap-icons-1.13.1/font/bootstrap-icons.min.css'
});

// Inject FontAwesome
await sfUI.injectIconFont({
    cssUrl: '/assets/libs/fontawesome-free-7.1.0-web/css/all.min.css'
});

// Inject multiple icon fonts at once
await sfUI.injectIconFonts([
    { cssUrl: '/assets/libs/bootstrap-icons-1.13.1/font/bootstrap-icons.min.css' },
    { cssUrl: '/assets/libs/fontawesome-free-7.1.0-web/css/all.min.css' }
]);

// Inject to specific components only
await sfUI.injectIconFont({
    cssUrl: '/assets/libs/bootstrap-icons-1.13.1/font/bootstrap-icons.min.css',
    components: 'sf-sidebar'
});

// Remove icon font
sfUI.removeIconFont({
    cssUrl: '/assets/libs/bootstrap-icons-1.13.1/font/bootstrap-icons.min.css'
});
```

### Web Font Loading API

#### `loadFont(fontConfig)`

Load web fonts dynamically. Returns a Promise that resolves when the font is loaded.

**Parameters:**
- `fontConfig` (Object|Array): Font configuration object or array of objects
  - `family` (string): Font family name (required)
  - `src` (string|Array): Font source URL(s) (required)
    - String: URL to CSS file or single font file
    - Array: Array of `{url, format}` objects for multiple sources
  - `weight` (string|number): Font weight (default: 400)
  - `style` (string): Font style - 'normal', 'italic' (default: 'normal')
  - `display` (string): Font display - 'auto', 'block', 'swap', 'fallback', 'optional' (default: 'swap')

**Examples:**

```javascript
// Google Fonts
sfUI.loadFont({
    family: 'Roboto',
    src: 'https://fonts.googleapis.com/css?family=Roboto'
});

// Local font file
sfUI.loadFont({
    family: 'My Font',
    src: '/fonts/myfont.woff2'
});

// Multiple sources with fallback
sfUI.loadFont({
    family: 'My Font',
    src: [
        { url: '/fonts/myfont.woff2', format: 'woff2' },
        { url: '/fonts/myfont.woff', format: 'woff' },
        { url: '/fonts/myfont.ttf', format: 'truetype' }
    ],
    weight: 700,
    style: 'normal'
});

// Load multiple fonts
sfUI.loadFont([
    { family: 'Font A', src: '/fonts/a.woff2' },
    { family: 'Font B', src: '/fonts/b.woff2' }
]).then(() => {
    console.log('All fonts loaded!');
});
```

#### `isFontLoaded(family, weight, style)`

Check if a font is already loaded.

**Parameters:**
- `family` (string): Font family name
- `weight` (string|number): Font weight (optional, default: 400)
- `style` (string): Font style (optional, default: 'normal')

**Returns:** Boolean

#### `waitForFont(family, text, timeout)`

Wait for a font to become available. Returns a Promise.

**Parameters:**
- `family` (string): Font family name
- `text` (string): Sample text to check (optional, default: 'BESbswy')
- `timeout` (number): Timeout in milliseconds (optional, default: 3000)

**Returns:** Promise

#### `preloadFonts(fontConfigs)`

Load fonts in the background without blocking. Same as `loadFont()` but semantically indicates background loading.

**Parameters:**
- `fontConfigs` (Array): Array of font configuration objects

**Returns:** Promise

#### `getLoadedFonts()`

Get a list of all loaded fonts.

**Returns:** Array of strings (format: 'family-weight-style')

#### `clearFontCache()`

Clear all loaded fonts and remove dynamically created font-face rules.

**Returns:** void

### Font Loading Best Practices

1. **Use WOFF2 format when possible** - Best compression and modern browser support
2. **Provide fallbacks** - Include multiple formats for older browsers
3. **Preload critical fonts** - Use `preloadFonts()` for fonts needed at page load
4. **Use font-display: swap** - Prevents invisible text during font loading
5. **Check loading status** - Use `isFontLoaded()` before applying fonts
6. **Handle errors** - Always add `.catch()` to handle loading failures

```javascript
// Good practice example
sfUI.loadFont({
    family: 'Primary Font',
    src: [
        { url: '/fonts/primary.woff2', format: 'woff2' },
        { url: '/fonts/primary.woff', format: 'woff' }
    ],
    display: 'swap'
}).then(() => {
    document.body.style.fontFamily = 'Primary Font, sans-serif';
}).catch(err => {
    console.error('Font loading failed:', err);
    // Use fallback font
});
```


## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Opera (latest)
- IE11+ (with polyfills)

## Bootstrap Compatibility

sfUI is fully compatible with Bootstrap 5. The library uses unique class names prefixed with `sfui-` to avoid conflicts with Bootstrap classes.

### Class Naming Convention

All sfUI classes use the `sfui-` prefix:
- `.sfui-btn` (buttons)
- `.sfui-modal` (modals)
- `.sfui-alert-*` (alerts)
- `.sfui-active` (visibility state, instead of Bootstrap's `.show`)

### Bootstrap Integration

sfUI automatically integrates with Bootstrap's theme system:
- Detects `data-bs-theme` attribute changes
- Synchronizes dark/light mode automatically
- Uses Bootstrap color variables for consistency

### Using with Bootstrap

You can safely use sfUI alongside Bootstrap without conflicts:

```html
<!-- Bootstrap Modal -->
<div class="modal" tabindex="-1">
  <div class="modal-dialog">
    <div class="modal-content">
      <!-- Bootstrap's modal -->
    </div>
  </div>
</div>

<!-- sfUI Modal -->
<div class="sfui-modal">
  <div class="sfui-modal-dialog">
    <div class="sfui-modal-content">
      <!-- sfUI's modal -->
    </div>
  </div>
</div>
```

**Note:** For utility classes like text alignment and margins, we recommend using Bootstrap's built-in utilities (`text-center`, `mb-3`, etc.) instead of duplicating them in sfUI.

## Building from Source

```bash
cd /path/to/sfUI-1.0.0
chmod +x build.sh
./build.sh
```

This will create `dist/sfui.js` containing all components.

## Migration from jQuery Versions

sfUI is fully backward compatible with the old jQuery-based versions. Simply replace the old script tags with the new ones, and your existing code will continue to work.

```javascript
// Old jQuery version
$("img").sfLightBox();
$("#input").sfRangeSlide();

// New vanilla version (auto-initialized via data attributes)
// No code changes needed!

// Or use the new API
sfUI.lightbox.init("img[data-sflightbox]");
sfUI.rangeslider.init("#input");
```

## License

MIT License - feel free to use in personal and commercial projects.

## Credits

Developed by the ShakeFlat Team

## Changelog

### Version 1.0.0 (2025-10-27)
- Initial release
- Migrated from jQuery to vanilla JavaScript
- Unified all components under sfUI namespace
- Added modern ES6+ features
- Improved performance and reduced bundle size
- Added dark mode support
- Enhanced accessibility
- Better mobile support
- **NEW**: Web Font Loading API - Dynamic font loading and management
  - Support for Google Fonts and local font files
  - Multiple font sources with fallback support
  - Font loading status tracking
  - Promise-based API for async font loading
  - Font preloading capabilities
  - Automatic @font-face rule generation

### Version 1.1.0 (2025-10-28)
- **NEW**: Icon Font Injection API for Web Components
  - `injectIconFont()` - Inject icon fonts into Shadow DOM
  - `injectIconFonts()` - Inject multiple icon fonts at once
  - `removeIconFont()` - Remove injected icon fonts
  - Support for FontAwesome and Bootstrap Icons
  - Automatic CSS URL path resolution
  - Per-component injection support
- Enhanced Sidebar component with proper icon font support
- Fixed Shadow DOM style isolation issues for icon fonts
- See `ICON_FONT_INJECTION_GUIDE.md` for detailed documentation

## Support

For issues, questions, or contributions, please visit our repository or contact the development team.
