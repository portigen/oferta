// js/main.js
import config from './config.js';
import ProductManager from './managers/ProductManager.js';
import { loadFiltersFromURL, updateURL } from './utils/productUtils.js';
import logger from './utils/logger.js';

class App {
    constructor() {
        logger.info('Initializing App');
        this.productManager = ProductManager;
        this.initializationAttempts = 0;
        this.maxInitializationAttempts = 3;
    }

    async init() {
        try {
            logger.group('App Initialization', () => {
                logger.debug('Starting app initialization');
                logger.debug('Current path:', window.location.pathname);
            });

            // Initialize global handlers
            this.initializeGlobalHandlers();

            // Load filters from URL
            const savedFilters = loadFiltersFromURL();
            if (savedFilters) {
                this.productManager.currentFilters = savedFilters;
            }

            // Initialize ProductManager
            await this.productManager.init();

            // Setup comparison handlers
            await this.setupComparisonHandlers();

            // Setup URL handling
            this.setupURLHandling();

            logger.success('App initialization completed successfully');
        } catch (error) {
            logger.error('Error during app initialization', error);
            this.handleInitializationError(error);
        }
    }

    initializeGlobalHandlers() {
        // Bind methods to window object
        window.appHandlers = {
            toggleDifferences: () => {
                logger.debug('Toggle differences called');
                this.toggleDifferences();
            },
            clearComparison: () => {
                logger.debug('Clear comparison called');
                this.clearComparison();
            },
            removeFromComparison: (productId) => {
                logger.debug('Remove from comparison called', { productId });
                this.removeFromComparison(productId);
            },
            exportComparison: (format) => {
                logger.debug('Export comparison called', { format });
                this.exportComparison(format);
            },
            switchTab: (tab) => {
                logger.debug('Switch tab called', { tab });
                this.switchComparisonTab(tab);
            }
        };
    }

    setupURLHandling() {
        window.addEventListener('popstate', () => {
            const filters = loadFiltersFromURL();
            this.productManager.currentFilters = filters;
            this.productManager.applyFilters();
        });

        this.productManager.onFiltersChange = (filters) => {
            updateURL(filters);
        };
    }

    async setupComparisonHandlers() {
        logger.debug('Setting up comparison handlers');
        
        const tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const tab = e.target.textContent.toLowerCase();
                this.switchComparisonTab(tab);
            });
        });

        // Initialize comparison if needed
        await this.productManager.initDefaultComparison();
    }

    toggleDifferences() {
        logger.debug('Toggling differences highlighting');
        try {
            const button = document.getElementById('toggleDifferences');
            if (!button) {
                throw new Error('Toggle differences button not found');
            }

            const isHighlighting = button.classList.toggle('active');
            const currentTab = this.getCurrentTab();

            if (typeof this.productManager.refreshComparisonTable === 'function') {
                this.productManager.refreshComparisonTable(currentTab, isHighlighting);
            } else {
                throw new Error('refreshComparisonTable method not found in ProductManager');
            }
        } catch (error) {
            logger.error('Error in toggleDifferences:', error);
        }
    }

    getCurrentTab() {
        const activeTab = document.querySelector('.tab-button.active');
        return activeTab ? activeTab.textContent.toLowerCase() : 'features';
    }

    clearComparison() {
        try {
            if (confirm('Czy na pewno chcesz wyczyścić porównanie?')) {
                localStorage.removeItem('compareProducts');
                if (typeof this.productManager.refreshComparisonTable === 'function') {
                    this.productManager.refreshComparisonTable();
                }
            }
        } catch (error) {
            logger.error('Error in clearComparison:', error);
        }
    }

    removeFromComparison(productId) {
        try {
            if (typeof this.productManager.removeFromComparison === 'function') {
                this.productManager.removeFromComparison(productId);
            }
        } catch (error) {
            logger.error('Error in removeFromComparison:', error);
        }
    }

    exportComparison(format) {
        try {
            if (typeof this.productManager.exportComparison === 'function') {
                this.productManager.exportComparison(format);
            }
        } catch (error) {
            logger.error('Error in exportComparison:', error);
        }
    }

    switchComparisonTab(tab) {
        try {
            const buttons = document.querySelectorAll('.tab-button');
            buttons.forEach(button => {
                button.classList.toggle('active', 
                    button.textContent.toLowerCase() === tab.toLowerCase());
            });

            const isHighlighting = document.getElementById('toggleDifferences')
                ?.classList.contains('active') || false;

            if (typeof this.productManager.refreshComparisonTable === 'function') {
                this.productManager.refreshComparisonTable(tab, isHighlighting);
            }
        } catch (error) {
            logger.error('Error in switchComparisonTab:', error);
        }
    }

    handleInitializationError(error) {
        logger.error('Fatal initialization error', error);
        const errorMessage = 'Nie udało się zainicjalizować aplikacji. Spróbuj odświeżyć stronę.';
        
        const errorState = document.getElementById('errorState');
        if (errorState) {
            errorState.style.display = 'block';
            errorState.innerHTML = `
                <p>${errorMessage}</p>
                <button class="button button-primary" onclick="window.location.reload()">
                    Odśwież stronę
                </button>
            `;
        }

        const loadingState = document.getElementById('loadingState');
        if (loadingState) {
            loadingState.style.display = 'none';
        }
    }
}

// Initialize application
let app;
document.addEventListener('DOMContentLoaded', () => {
    logger.info('DOM Content Loaded, starting application');
    app = new App();
    app.init().catch(error => {
        logger.error('Unhandled error during application startup', error);
    });
});

// Global error handlers
window.onerror = function(msg, url, lineNo, columnNo, error) {
    logger.error('Global error:', {
        message: msg,
        url: url,
        line: lineNo,
        column: columnNo,
        error: error
    });
    return false;
};

window.addEventListener('unhandledrejection', event => {
    logger.error('Unhandled promise rejection:', event.reason);
});
