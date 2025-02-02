// js/managers/ProductManager.js
import config from '../config.js';
import logger from '../utils/logger.js';
import { 
    formatProductData,
    exportToPDF,
    exportToExcel,
    prepareComparisonData,
    renderFeaturesComparison,
    renderSpecsComparison,
    renderPackageComparison,
    getCategoryName
} from '../utils/productUtils.js';

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
            await this.initDefaultComparison();
            await this.renderProducts();

            this.isInitialized = true;
            logger.success('ProductManager initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize ProductManager', error);
            throw new Error('ProductManager initialization failed');
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
            }

            // Wyszukiwarka
            const searchInput = document.querySelector('[data-search]');
            if (searchInput) {
                logger.debug('Setting up search input listener');
                let searchTimeout;
                searchInput.addEventListener('input', (e) => {
                    clearTimeout(searchTimeout);
                    searchTimeout = setTimeout(() => {
                        logger.debug('Search query:', e.target.value);
                        this.currentFilters.search = e.target.value.toLowerCase();
                        this.applyFilters();
                    }, 300);
                });
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
            }

            logger.success('Event listeners setup completed');
        } catch (error) {
            logger.error('Error setting up event listeners', error);
            throw new Error('Failed to setup event listeners');
        }
    }

    async initDefaultComparison() {
        logger.debug('Initializing default comparison');
        try {
            const currentCompare = JSON.parse(localStorage.getItem('compareProducts') || '[]');
            if (currentCompare.length === 0 && config.defaultCompare) {
                localStorage.setItem('compareProducts', JSON.stringify(config.defaultCompare));
                logger.success('Default comparison products set');
            }
            await this.refreshComparisonTable();
        } catch (error) {
            logger.error('Error initializing default comparison', error);
        }
    }

    applyFilters() {
        logger.debug('Applying filters:', this.currentFilters);
        try {
            let filtered = [...this.products];
            const initialCount = filtered.length;

            if (this.currentFilters.category) {
                filtered = filtered.filter(product => 
                    product.category === this.currentFilters.category
                );
                logger.debug(`Category filter applied: ${filtered.length}/${initialCount} products remaining`);
            }

            if (this.currentFilters.search) {
                filtered = filtered.filter(product => 
                    product.name.toLowerCase().includes(this.currentFilters.search) ||
                    product.shortDescription.toLowerCase().includes(this.currentFilters.search)
                );
                logger.debug(`Search filter applied: ${filtered.length}/${initialCount} products remaining`);
            }

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

    async refreshComparisonTable(tab = 'features', highlightDifferences = false) {
        const state = this.getComparisonState();
        const container = document.getElementById('comparisonTable');
        
        if (!container) {
            logger.warning('Comparison table container not found');
            return;
        }

        try {
            const compareList = JSON.parse(localStorage.getItem('compareProducts') || '[]');
            const products = this.products.filter(p => compareList.includes(p.id));
            const comparisonData = prepareComparisonData({ products, tab, highlightDifferences });

            container.innerHTML = this.generateComparisonTable(comparisonData);
            logger.success('Comparison table refreshed');
        } catch (error) {
            logger.error('Error refreshing comparison table', error);
            container.innerHTML = '<div class="error-message">Błąd podczas odświeżania porównania</div>';
        }
    }

    generateComparisonTable(comparisonData) {
        // Implementation moved to productUtils.js
        return comparisonData.generateHTML();
    }

    async exportComparison(format = 'pdf') {
        const state = this.getComparisonState();
        try {
            switch (format) {
                case 'pdf':
                    await exportToPDF(state);
                    break;
                case 'excel':
                    await exportToExcel(state);
                    break;
                default:
                    throw new Error(`Unsupported export format: ${format}`);
            }
        } catch (error) {
            logger.error(`Error exporting comparison to ${format}`, error);
            this.showError(`Błąd podczas eksportu do formatu ${format.toUpperCase()}`);
        }
    }

    getComparisonState() {
        try {
            const compareList = JSON.parse(localStorage.getItem('compareProducts') || '[]');
            return {
                products: this.products.filter(p => compareList.includes(p.id)),
                currentTab: document.querySelector('.tab-button.active')?.textContent.toLowerCase() || 'features',
                highlighting: document.getElementById('toggleDifferences')?.classList.contains('active') || false
            };
        } catch (error) {
            logger.error('Error getting comparison state', error);
            return {
                products: [],
                currentTab: 'features',
                highlighting: false
            };
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

export default new ProductManager();
