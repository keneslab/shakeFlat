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
