// product-manager.js
import config from './config.js';

export class ProductManager {
    constructor() {
        this.products = [];
        this.filteredProducts = [];
        this.currentFilters = {
            category: null,
            search: '',
            sorting: 'name'
        };
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

    bindEvents() {
        // Nasłuchiwanie zmian filtrów
        document.querySelectorAll('[data-filter]').forEach(filter => {
            filter.addEventListener('change', (e) => {
                this.updateFilters(e.target.dataset.filter, e.target.value);
            });
        });

        // Nasłuchiwanie wyszukiwania
        const searchInput = document.querySelector('[data-search]');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.updateFilters('search', e.target.value);
            });
        }
    }

    updateFilters(filterType, value) {
        this.currentFilters[filterType] = value;
        this.applyFilters();
    }

    applyFilters() {
        let filtered = [...this.products];

        // Filtrowanie po kategorii
        if (this.currentFilters.category) {
            filtered = filtered.filter(product => 
                product.category === this.currentFilters.category
            );
        }

        // Filtrowanie po wyszukiwaniu
        if (this.currentFilters.search) {
            const searchTerm = this.currentFilters.search.toLowerCase();
            filtered = filtered.filter(product => 
                product.name.toLowerCase().includes(searchTerm) ||
                product.shortDescription.toLowerCase().includes(searchTerm)
            );
        }

        // Sortowanie
        filtered.sort((a, b) => {
            switch (this.currentFilters.sorting) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'category':
                    return a.category.localeCompare(b.category);
                default:
                    return 0;
            }
        });

        this.filteredProducts = filtered;
        this.renderProducts();
    }

    async renderProducts() {
        const container = document.getElementById('productGrid');
        if (!container) return;

        container.innerHTML = this.filteredProducts.map(product => `
            <div class="product-card" data-product-id="${product.id}">
                <img src="${product.media.mainImage}" alt="${product.name}" class="product-image">
                <h3>${product.name}</h3>
                <p>${product.shortDescription}</p>
                <div class="product-actions">
                    <a href="${config.paths.products}/${product.id}" class="product-link">
                        Szczegóły
                    </a>
                    <button data-compare-button data-product-id="${product.id}">
                        Dodaj do porównania
                    </button>
                </div>
            </div>
        `).join('');
    }

    async renderProductPage(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) {
            this.renderError('Produkt nie został znaleziony');
            return;
        }

        document.title = product.fullName;
        const container = document.getElementById('app');
        // Tu dodaj kod renderowania strony produktu
    }

    async renderComparePage() {
        const compareList = JSON.parse(localStorage.getItem('compareProducts') || '[]');
        const products = this.products.filter(p => compareList.includes(p.id));
        // Tu dodaj kod renderowania strony porównania
    }

    renderError(message) {
        const container = document.getElementById('app');
        container.innerHTML = `
            <div class="error-message">
                <h2>Błąd</h2>
                <p>${message}</p>
                <a href="/" class="button">Wróć do strony głównej</a>
            </div>
        `;
    }
}

export default ProductManager;
