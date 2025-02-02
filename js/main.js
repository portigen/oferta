// js/main.js
import config from './config.js';
import CompareSystem from './compare-system.js';
import ProductManager from './product-manager.js';
import logger from './utils/logger.js';

class App {
    constructor() {
        logger.info('Initializing App');
        this.compareSystem = new CompareSystem();
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

            // Check if ProductManager is already initialized
            if (this.productManager.isInitialized) {
                logger.warning('ProductManager already initialized, skipping initialization');
                return;
            }

            // Initialize ProductManager
            logger.debug('Initializing ProductManager');
            await this.productManager.init();
            logger.success('ProductManager initialized successfully');

            // Initialize CompareSystem
            logger.debug('Initializing CompareSystem');
            if (this.compareSystem) {
                await this.compareSystem.init();
                logger.success('CompareSystem initialized successfully');
            } else {
                logger.warning('CompareSystem not available');
            }

            logger.success('App initialization completed successfully');
        } catch (error) {
            logger.error('Error during app initialization', error);
            
            // Retry initialization if attempts remain
            if (this.initializationAttempts < this.maxInitializationAttempts) {
                this.initializationAttempts++;
                logger.warning(`Retrying initialization (attempt ${this.initializationAttempts}/${this.maxInitializationAttempts})`);
                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
                return this.init();
            }

            this.handleInitializationError(error);
        }
    }

    handleInitializationError(error) {
        logger.error('Fatal initialization error', error);
        const errorMessage = 'Nie udało się zainicjalizować aplikacji. Spróbuj odświeżyć stronę.';
        
        // Show error in UI
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

        // Hide loading state
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
