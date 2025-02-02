// js/product-manager.js
import config from './config.js';
import templateLoader from './template-loader.js';
import logger from './utils/logger.js';

class ProductManager {
    constructor() {
        logger.info('Initializing ProductManager');
        this.products = [];
        this.filteredProducts = [];
        this.currentFilters = {
            category: '',
            search: '',
            sorting: 'name'
        };
        this.isInitialized = false;
    }

    async init() {
        try {
            logger.group('ProductManager Initialization', () => {
                logger.debug('Starting initialization');
            });

            if (this.isInitialized) {
                logger.warning('ProductManager already initialized');
                return;
            }

            await this.loadProducts();
            this.setupEventListeners();
            await this.renderProducts();

            this.isInitialized = true;
            logger.success('ProductManager initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize ProductManager', error);
            throw new Error('ProductManager initialization failed');
        }
    }

    setupEventListeners() {
        logger.debug('Setting up event listeners');
        try {
            // Filtrowanie po kategorii
            const categorySelect = document.querySelector('[data-filter="category"]');
            if (categorySelect) {
                logger.debug('Setting up category filter listener');
                categorySelect.addEventListener('change', (e) => {
                    logger.debug('Category changed:', e.target.value);
                    this.currentFilters.category = e.target.value;
                    this.applyFilters();
                });
            } else {
                logger.warning('Category select element not found');
            }

            // Wyszukiwarka
            const searchInput = document.querySelector('[data-search]');
            if (searchInput) {
                logger.debug('Setting up search input listener');
                searchInput.addEventListener('input', (e) => {
                    logger.debug('Search query:', e.target.value);
                    this.currentFilters.search = e.target.value.toLowerCase();
                    this.applyFilters();
                });
            } else {
                logger.warning('Search input element not found');
            }

            // Sortowanie
            const sortSelect = document.querySelector('[data-filter="sorting"]');
            if (sortSelect) {
                logger.debug('Setting up sort select listener');
                sortSelect.addEventListener('change', (e) => {
                    logger.debug('Sort option changed:', e.target.value);
                    this.currentFilters.sorting = e.target.value;
                    this.applyFilters();
                });
            } else {
                logger.warning('Sort select element not found');
            }

            logger.success('Event listeners setup completed');
        } catch (error) {
            logger.error('Error setting up event listeners', error);
            throw new Error('Failed to setup event listeners');
        }
    }

    async loadProducts() {
        logger.debug('Loading products from:', config.apiEndpoint);
        try {
            const response = await fetch(config.apiEndpoint);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            this.products = data.products;
            this.filteredProducts = [...this.products];
            
            logger.success(`Loaded ${this.products.length} products`);
            logger.debug('Products data:', this.products);
            return this.products;
        } catch (error) {
            logger.error('Failed to load products', error);
            this.showError('Nie udało się załadować produktów');
            return [];
        }
    }

    applyFilters() {
        logger.debug('Applying filters:', this.currentFilters);
        try {
            let filtered = [...this.products];
            const initialCount = filtered.length;

            // Filtrowanie po kategorii
            if (this.currentFilters.category) {
                filtered = filtered.filter(product => 
                    product.category === this.currentFilters.category
                );
                logger.debug(`Category filter applied: ${filtered.length}/${initialCount} products remaining`);
            }

            // Filtrowanie po wyszukiwaniu
            if (this.currentFilters.search) {
                filtered = filtered.filter(product => 
                    product.name.toLowerCase().includes(this.currentFilters.search) ||
                    product.shortDescription.toLowerCase().includes(this.currentFilters.search)
                );
                logger.debug(`Search filter applied: ${filtered.length}/${initialCount} products remaining`);
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
            logger.success(`Filters applied: ${filtered.length} products shown`);
            this.renderProducts();
        } catch (error) {
            logger.error('Error applying filters', error);
            this.showError('Wystąpił błąd podczas filtrowania produktów');
        }
    }

    async renderProducts() {
        logger.debug('Starting products render');
        const container = document.getElementById('productGrid');
        const loadingState = document.getElementById('loadingState');
        const errorState = document.getElementById('errorState');

        if (!container) {
            logger.error('Product grid container not found');
            return;
        }

        try {
            // Pokazujemy stan ładowania
            if (loadingState) loadingState.style.display = 'block';
            if (errorState) errorState.style.display = 'none';
            container.style.display = 'none';

            logger.debug(`Rendering ${this.filteredProducts.length} products`);

            // Renderujemy produkty
            const productCards = await Promise.all(
                this.filteredProducts.map(async product => {
                    return templateLoader.renderTemplate('product-card', { product });
                })
            );

            container.innerHTML = productCards.join('');
            logger.success('Products rendered successfully');

            // Ukrywamy stan ładowania i pokazujemy produkty
            if (loadingState) loadingState.style.display = 'none';
            container.style.display = 'grid';
        } catch (error) {
            logger.error('Error rendering products', error);
            this.showError('Wystąpił błąd podczas renderowania produktów');
        }
    }

    showError(message) {
        logger.error('Showing error message:', message);
        const errorState = document.getElementById('errorState');
        if (errorState) {
            errorState.style.display = 'block';
            errorState.querySelector('p').textContent = message;
        } else {
            logger.warning('Error state element not found');
        }
    }
}

const instance = new ProductManager();
logger.info('ProductManager instance created');
export default instance;
