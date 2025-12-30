/**
 * UI Controller - Handles all UI interactions
 * Global navigation, modals, dropdowns, tabs, etc.
 */

class UIController {
    constructor() {
        this.init();
    }

    init() {
        this.initMobileMenu();
        this.initModals();
        this.initDropdowns();
        this.initTabs();
        this.initTooltips();
        this.initSmoothScroll();
        this.initBackToTop();
        this.initSearchToggle();
    }

    // Mobile Menu Toggle
    initMobileMenu() {
        const menuToggle = document.querySelector('.mobile-menu-toggle');
        const navMenu = document.querySelector('.navbar-nav');

        if (menuToggle && navMenu) {
            menuToggle.addEventListener('click', () => {
                navMenu.classList.toggle('active');
                menuToggle.classList.toggle('active');
                document.body.classList.toggle('menu-open');
            });

            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.navbar') && navMenu.classList.contains('active')) {
                    navMenu.classList.remove('active');
                    menuToggle.classList.remove('active');
                    document.body.classList.remove('menu-open');
                }
            });

            // Close menu on route change
            navMenu.querySelectorAll('.navbar-item').forEach(item => {
                item.addEventListener('click', () => {
                    navMenu.classList.remove('active');
                    menuToggle.classList.remove('active');
                    document.body.classList.remove('menu-open');
                });
            });
        }
    }

    // Modal System
    initModals() {
        const modalTriggers = document.querySelectorAll('[data-modal-target]');
        const modalCloses = document.querySelectorAll('[data-modal-close]');
        const modalBackdrops = document.querySelectorAll('.modal-backdrop');

        modalTriggers.forEach(trigger => {
            trigger.addEventListener('click', (e) => {
                e.preventDefault();
                const modalId = trigger.getAttribute('data-modal-target');
                this.openModal(modalId);
            });
        });

        modalCloses.forEach(close => {
            close.addEventListener('click', () => {
                this.closeAllModals();
            });
        });

        modalBackdrops.forEach(backdrop => {
            backdrop.addEventListener('click', () => {
                this.closeAllModals();
            });
        });

        // Close modals on ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        const backdrop = modal?.previousElementSibling;

        if (modal && backdrop) {
            backdrop.classList.add('active');
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
        document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
            backdrop.classList.remove('active');
        });
        document.body.style.overflow = '';
    }

    // Dropdown System
    initDropdowns() {
        const dropdownToggles = document.querySelectorAll('.dropdown-toggle');

        dropdownToggles.forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                const dropdown = toggle.closest('.dropdown');
                const menu = dropdown.querySelector('.dropdown-menu');

                // Close other dropdowns
                document.querySelectorAll('.dropdown-menu.active').forEach(otherMenu => {
                    if (otherMenu !== menu) {
                        otherMenu.classList.remove('active');
                    }
                });

                menu.classList.toggle('active');
            });
        });

        // Close dropdowns when clicking outside
        document.addEventListener('click', () => {
            document.querySelectorAll('.dropdown-menu.active').forEach(menu => {
                menu.classList.remove('active');
            });
        });
    }

    // Tab System
    initTabs() {
        const tabs = document.querySelectorAll('.tab');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabGroup = tab.closest('.tabs');
                const targetId = tab.getAttribute('data-tab-target');

                // Remove active from all tabs in group
                tabGroup.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));

                // Add active to clicked tab
                tab.classList.add('active');

                // Hide all tab contents
                const container = tabGroup.nextElementSibling;
                if (container) {
                    container.querySelectorAll('.tab-content').forEach(content => {
                        content.classList.remove('active');
                    });

                    // Show target content
                    const target = document.getElementById(targetId);
                    if (target) {
                        target.classList.add('active');
                    }
                }
            });
        });
    }

    // Tooltip System
    initTooltips() {
        const tooltipTriggers = document.querySelectorAll('[data-tooltip]');

        tooltipTriggers.forEach(trigger => {
            const tooltipText = trigger.getAttribute('data-tooltip');

            trigger.addEventListener('mouseenter', (e) => {
                this.showTooltip(e.target, tooltipText);
            });

            trigger.addEventListener('mouseleave', () => {
                this.hideTooltip();
            });
        });
    }

    showTooltip(element, text) {
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = text;
        tooltip.id = 'active-tooltip';

        document.body.appendChild(tooltip);

        const rect = element.getBoundingClientRect();
        tooltip.style.position = 'fixed';
        tooltip.style.top = `${rect.top - tooltip.offsetHeight - 8}px`;
        tooltip.style.left = `${rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2)}px`;
        tooltip.style.zIndex = '9999';
        tooltip.style.backgroundColor = 'var(--gray-900)';
        tooltip.style.color = 'white';
        tooltip.style.padding = '0.5rem 1rem';
        tooltip.style.borderRadius = 'var(--radius-md)';
        tooltip.style.fontSize = 'var(--text-sm)';
        tooltip.style.pointerEvents = 'none';
        tooltip.style.animation = 'fadeIn 150ms ease';
    }

    hideTooltip() {
        const tooltip = document.getElementById('active-tooltip');
        if (tooltip) {
            tooltip.remove();
        }
    }

    // Smooth Scroll
    initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                const href = this.getAttribute('href');
                if (href !== '#' && href !== '#!') {
                    e.preventDefault();
                    const target = document.querySelector(href);
                    if (target) {
                        target.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
                }
            });
        });
    }

    // Back to Top Button
    initBackToTop() {
        const backToTop = document.getElementById('back-to-top');

        if (backToTop) {
            window.addEventListener('scroll', () => {
                if (window.pageYOffset > 300) {
                    backToTop.style.display = 'flex';
                } else {
                    backToTop.style.display = 'none';
                }
            });

            backToTop.addEventListener('click', () => {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            });
        }
    }

    // Search Toggle
    initSearchToggle() {
        const searchToggle = document.querySelector('.search-toggle');
        const searchBar = document.querySelector('.search-bar');

        if (searchToggle && searchBar) {
            searchToggle.addEventListener('click', () => {
                searchBar.classList.toggle('active');
                const searchInput = searchBar.querySelector('input');
                if (searchInput && searchBar.classList.contains('active')) {
                    searchInput.focus();
                }
            });
        }
    }
}

// Toast Notification System
class ToastNotification {
    constructor() {
        this.container = this.createContainer();
    }

    createContainer() {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
        return container;
    }

    show(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast alert-${type}`;
        toast.textContent = message;

        this.container.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'fadeOut 300ms ease';
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, duration);
    }

    success(message, duration) {
        this.show(message, 'success', duration);
    }

    error(message, duration) {
        this.show(message, 'error', duration);
    }

    warning(message, duration) {
        this.show(message, 'warning', duration);
    }

    info(message, duration) {
        this.show(message, 'info', duration);
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.uiController = new UIController();
    window.toast = new ToastNotification();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { UIController, ToastNotification };
}
