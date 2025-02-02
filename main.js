// main.js
import config from './config.js';
import CompareSystem from './compare-system.js';
import ProductManager from './product-manager.js';

class App {
    constructor() {
        this.compareSystem = new CompareSystem();
        this.productManager = new ProductManager();
    }

    async init() {
        await this.productManager.init();

        if (config.isProductPage) {
            const productId = window.location.pathname.split('/')[2];
            await this.productManager.renderProductPage(productId);
        } else if (config.isComparePage) {
            await this.productManager.renderComparePage();
        } else {
            await this.productManager.renderProducts();
        }

        // Inicjalizacja dodatkowych funkcji
        this.initBarcode();
        this.initLightbox();
    }

    initBarcode() {
        const barcodeElement = document.getElementById('barcode');
        if (barcodeElement && window.JsBarcode) {
            const ean = barcodeElement.dataset.ean;
            JsBarcode("#barcode", ean, {
                format: "EAN13",
                width: 2,
                height: 100,
                displayValue: true
            });
        }
    }

    initLightbox() {
        if (window.lightbox) {
            lightbox.option({
                'resizeDuration': 200,
                'wrapAround': true
            });
        }
    }
}

// Inicjalizacja aplikacji
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();
});

export default App;
