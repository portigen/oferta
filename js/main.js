// js/main.js
import config from './config.js';
import CompareSystem from './compare-system.js';
import ProductManager from './product-manager.js';
import TemplateLoader from './template-loader.js';

class App {
    constructor() {
        this.compareSystem = new CompareSystem();
        this.productManager = ProductManager;
        this.templateLoader = TemplateLoader;
    }

    async init() {
        await this.productManager.init();

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
            await this.productManager.renderProducts();
        }
    }
}

// Inicjalizacja aplikacji
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();
});
