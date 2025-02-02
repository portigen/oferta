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
            
            // Retry initialization if attempts remain
            if (this.initializationAttempts < this.maxInitializationAttempts) {
                this.initializationAttempts++;
                logger.warning(`Retrying initialization (attempt ${this.initializationAttempts}/${this.maxInitializationAttempts})`);
                await new Promise(resolve => setTimeout(resolve, 1000));
                return this.init();
            }

            this.handleInitializationError(error);
        }
    }

    setupURLHandling() {
        // Handle browser back/forward buttons
        window.addEventListener('popstate', () => {
            const filters = loadFiltersFromURL();
            this.productManager.currentFilters = filters;
            this.productManager.applyFilters();
        });

        // Update URL when filters change
        this.productManager.onFiltersChange = (filters) => {
            updateURL(filters);
        };
    }

    async setupComparisonHandlers() {
        logger.debug('Setting up comparison handlers');
        
        // Handle tab switching
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const tab = e.target.textContent.toLowerCase();
                this.productManager.refreshComparisonTable(tab);
            });
        });

        // Handle comparison clearing
        window.clearComparison = () => {
            if (confirm('Czy na pewno chcesz wyczyścić porównanie?')) {
                localStorage.removeItem('compareProducts');
                this.productManager.refreshComparisonTable();
            }
        };

        // Handle comparison export
        window.exportComparison = (format) => {
            this.productManager.exportComparison(format);
        };

        // Handle product removal from comparison
        window.removeFromComparison = (productId) => {
            this.productManager.removeFromComparison(productId);
        };
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

// Wait for DOM content to be loaded
document.addEventListener('DOMContentLoaded', () => {
    logger.info('DOM Content Loaded, starting application');
    
    const app = new App();
    app.init().catch(error => {
        logger.error('Unhandled error during application startup', error);
    });
});

// Handle global errors
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

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', event => {
    logger.error('Unhandled promise rejection:', event.reason);
});
