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
        
        // Bind methods to window for global access
        window.app = this; // Expose app instance to window
        window.toggleDifferences = this.toggleDifferences.bind(this);
        window.clearComparison = this.clearComparison.bind(this);
        window.removeFromComparison = this.removeFromComparison.bind(this);
        window.exportComparison = this.exportComparison.bind(this);
    }

    async init() {
        try {
            logger.group('App Initialization', () => {
                logger.debug('Starting app initialization');
                logger.debug('Current path:', window.location.pathname);
            });

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
        
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const tab = e.target.textContent.toLowerCase();
                this.switchComparisonTab(tab);
            });
        });
    }

    toggleDifferences() {
        logger.debug('Toggling differences highlighting');
        const button = document.getElementById('toggleDifferences');
        const isHighlighting = button?.classList.toggle('active');
        const currentTab = this.getCurrentTab();
        
        if (this.productManager.refreshComparisonTable) {
            this.productManager.refreshComparisonTable(currentTab, isHighlighting);
        } else {
            logger.error('refreshComparisonTable method not found in ProductManager');
        }
    }

    getCurrentTab() {
        return document.querySelector('.tab-button.active')?.textContent.toLowerCase() || 'features';
    }

    clearComparison() {
        if (confirm('Czy na pewno chcesz wyczyścić porównanie?')) {
            localStorage.removeItem('compareProducts');
            this.productManager.refreshComparisonTable();
        }
    }

    removeFromComparison(productId) {
        this.productManager.removeFromComparison(productId);
    }

    exportComparison(format) {
        this.productManager.exportComparison(format);
    }

    switchComparisonTab(tab) {
        document.querySelectorAll('.tab-button').forEach(button => {
            button.classList.toggle('active', 
                button.textContent.toLowerCase() === tab.toLowerCase());
        });
        
        const isHighlighting = document.getElementById('toggleDifferences')
            ?.classList.contains('active');
        
        this.productManager.refreshComparisonTable(tab, isHighlighting);
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
document.addEventListener('DOMContentLoaded', () => {
    logger.info('DOM Content Loaded, starting application');
    const app = new App();
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
