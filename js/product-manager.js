// js/product-manager.js
import config from './config.js';
import templateLoader from './template-loader.js';

class ProductManager {
    constructor() {
        this.products = [];
        this.filteredProducts = [];
        this.currentFilters = {
            category: '',
            search: '',
            sorting: 'name'
        };
    }

    async init() {
        await this.loadProducts();
        this.setupEventListeners();
        await this.renderProducts();
    }

    setupEventListeners() {
        // Filtrowanie po kategorii
        const categorySelect = document.querySelector('[data-filter="category"]');
        if (categorySelect) {
            categorySelect.addEventListener('change', (e) => {
                this.currentFilters.category = e.target.value;
                this.applyFilters();
            });
        }

        // Wyszukiwarka
        const searchInput = document.querySelector('[data-search]');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.currentFilters.search = e.target.value.toLowerCase();
                this.applyFilters();
            });
        }

        // Sortowanie
        const sortSelect = document.querySelector('[data-filter="sorting"]');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.currentFilters.sorting = e.target.value;
                this.applyFilters();
            });
        }
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
            this.showError('Nie udało się załadować produktów');
            return [];
        }
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
            filtered = filtered.filter(product => 
                product.name.toLowerCase().includes(this.currentFilters.search) ||
                product.shortDescription.toLowerCase().includes(this.currentFilters.search)
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
        const loadingState = document.getElementById('loadingState');
        const errorState = document.getElementById('errorState');

        if (!container) return;

        try {
            // Pokazujemy stan ładowania
            if (loadingState) loadingState.style.display = 'block';
            if (errorState) errorState.style.display = 'none';
            container.style.display = 'none';

            // Renderujemy produkty
            const productCards = await Promise.all(
                this.filteredProducts.map(async product => {
                    return templateLoader.renderTemplate('product-card', { product });
                })
            );

            container.innerHTML = productCards.join('');

            // Ukrywamy stan ładowania i pokazujemy produkty
            if (loadingState) loadingState.style.display = 'none';
            container.style.display = 'grid';
        } catch (error) {
            console.error('Error rendering products:', error);
            this.showError('Wystąpił błąd podczas renderowania produktów');
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

export default new ProductManager();
