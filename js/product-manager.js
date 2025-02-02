// js/product-manager.js
import config from './config.js';
import templateLoader from './template-loader.js';

export class ProductManager {
    constructor() {
        this.products = [];
        this.filteredProducts = [];
    }

    async init() {
        await this.loadProducts();
        this.bindEvents();
    }

    async loadProducts() {
        try {
            const response = await fetch(config.apiEndpoint);
            const data = await response.json();
            this.products = data.products;
            this.filteredProducts = [...this.products];
            return this.products;
        } catch (error) {
            console.error('Error loading products:', error);
            return [];
        }
    }

    async renderProducts() {
        const container = document.getElementById('productGrid');
        if (!container) return;

        try {
            // Renderujemy każdy produkt używając szablonu karty produktu
            const productCards = await Promise.all(
                this.filteredProducts.map(async product => {
                    return templateLoader.renderTemplate('product-card', { product });
                })
            );

            container.innerHTML = productCards.join('');
        } catch (error) {
            console.error('Error rendering products:', error);
            container.innerHTML = '<div class="error">Błąd ładowania produktów</div>';
        }
    }

    async renderProductPage(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) {
            this.renderError('Produkt nie został znaleziony');
            return;
        }

        try {
            const container = document.getElementById('app');
            const renderedPage = await templateLoader.renderTemplate('product-page', { product });
            container.innerHTML = renderedPage;

            // Inicjalizacja dodatkowych funkcjonalności po załadowaniu strony
            this.initProductPage(product);
        } catch (error) {
            console.error('Error rendering product page:', error);
            this.renderError('Błąd ładowania strony produktu');
        }
    }

    async renderComparePage() {
        try {
            const compareList = JSON.parse(localStorage.getItem('compareProducts') || '[]');
            const products = this.products.filter(p => compareList.includes(p.id));

            const container = document.getElementById('app');
            const renderedPage = await templateLoader.renderTemplate('compare-page', { 
                products,
                technicalSpecs: this.prepareComparisonSpecs(products),
                features: this.prepareComparisonFeatures(products),
                package: this.prepareComparisonPackage(products)
            });

            container.innerHTML = renderedPage;
        } catch (error) {
            console.error('Error rendering compare page:', error);
            this.renderError('Błąd ładowania strony porównania');
        }
    }

    prepareComparisonSpecs(products) {
        // Przygotowanie danych do porównania specyfikacji
        const allSpecs = new Set(products.flatMap(p => Object.keys(p.technicalSpecs)));
        return Array.from(allSpecs).map(spec => ({
            label: products.find(p => p.technicalSpecs[spec])?.technicalSpecs[spec].label || spec,
            values: products.map(p => p.technicalSpecs[spec]?.value || '-'),
            className: this.getComparisonClassName(products, p => p.technicalSpecs[spec]?.value)
        }));
    }

    prepareComparisonFeatures(products) {
        const maxFeatures = Math.max(...products.map(p => p.keyFeatures.length));
        return Array.from({ length: maxFeatures }, (_, i) => ({
            values: products.map(p => p.keyFeatures[i] || null),
            className: this.getComparisonClassName(products, p => p.keyFeatures[i])
        }));
    }

    prepareComparisonPackage(products) {
        const maxItems = Math.max(...products.map(p => p.package.length));
        return Array.from({ length: maxItems }, (_, i) => ({
            values: products.map(p => p.package[i] || '-'),
            className: this.getComparisonClassName(products, p => p.package[i])
        }));
    }

    getComparisonClassName(products, valueGetter) {
        const values = products.map(valueGetter);
        const allSame = values.every(v => JSON.stringify(v) === JSON.stringify(values[0]));
        return allSame ? 'feature-match' : 'feature-different';
    }

    initProductPage(product) {
        // Inicjalizacja kodu kreskowego
        if (product.ean) {
            JsBarcode("#barcode", product.ean, {
                format: "EAN13",
                width: 2,
                height: 100,
                displayValue: true
            });
        }

        // Inicjalizacja lightbox dla galerii
        if (window.lightbox) {
            lightbox.option({
                'resizeDuration': 200,
                'wrapAround': true
            });
        }
    }

    renderError(message) {
        const container = document.getElementById('app');
        container.innerHTML = `
            <div class="error-message">
                <h2>Błąd</h2>
                <p>${message}</p>
                <a href="/" class="button button-primary">Wróć do strony głównej</a>
            </div>
        `;
    }
}

export default new ProductManager();
