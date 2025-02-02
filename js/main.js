// js/main.js
import config from './config.js';
import CompareSystem from './compare-system.js';
import ProductManager from './product-manager.js';

class App {
    constructor() {
        this.compareSystem = new CompareSystem();
        this.productManager = ProductManager;
    }

    async init() {
        try {
            // Inicjalizacja lightbox tylko jeśli jest załadowany
            if (window.lightbox) {
                window.lightbox.option({
                    'resizeDuration': 200,
                    'wrapAround': true
                });
            }

            // Wybór odpowiedniej strony na podstawie URL
            const path = window.location.pathname;
            
            if (path.startsWith('/products/')) {
                // Strona produktu
                const productId = path.split('/')[2];
                await this.productManager.renderProductPage(productId);
            } else if (path === '/compare') {
                // Strona porównania
                await this.productManager.renderComparePage();
            } else {
                // Strona główna
                await this.productManager.init();
            }
        } catch (error) {
            console.error('Application initialization error:', error);
            this.showError('Wystąpił błąd podczas inicjalizacji aplikacji');
        }
    }

    showError(message) {
        const errorState = document.getElementById('errorState');
        if (errorState) {
            errorState.style.display = 'block';
            errorState.querySelector('p').textContent = message;
        }
    }
}

// Inicjalizacja aplikacji po załadowaniu DOM
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init().catch(error => {
        console.error('Fatal error:', error);
    });
});
