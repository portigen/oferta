// js/config.js
const config = {
    // App settings
    appName: 'PORTIGEN Catalog',
    appVersion: '1.0.0',
    debug: true,
    
    // API endpoints
    apiEndpoint: '/products.json',
    
    // Paths
    paths: {
        products: '/products',
        compare: '/compare.html',
        documentation: '/docs',
        assets: '/assets'
    },
    
    // Template paths
    templates: {
        productCard: 'templates/product-card.html',
        productPage: 'templates/product-page.html',
        comparePage: 'templates/compare-page.html'
    },
    
    // Product settings
    maxCompareProducts: 4,
    defaultCompare: ['PS16T500W12V', 'PS10S25W12V'],
    
    // Categories
    categories: {
        power: 'Zasilanie',
        sensors: 'Sensory',
        mounting: 'Montaż',
        communication: 'Komunikacja',
        camera: 'Kamery',
        accessories: 'Akcesoria'
    },
    
    // Export settings
    export: {
        pdf: {
            pageSize: 'A4',
            orientation: 'landscape',
            margin: 10
        },
        excel: {
            sheetNames: {
                features: 'Cechy główne',
                specs: 'Specyfikacja',
                package: 'Zawartość zestawu'
            }
        }
    },

    // UI settings
    ui: {
        theme: {
            primary: '#2C3E50',
            secondary: '#4CAF50',
            accent: '#3498db',
            background: '#f5f5f5',
            card: '#ffffff',
            text: '#333333',
            error: '#ff5252',
            success: '#4CAF50',
            warning: '#FFC107'
        },
        spacing: {
            unit: 20,
            small: 10,
            medium: 20,
            large: 40
        },
        breakpoints: {
            mobile: 576,
            tablet: 768,
            desktop: 1024,
            wide: 1200
        }
    },
    
    // Feature flags
    features: {
        enableComparison: true,
        enableExport: true,
        enableFilters: true,
        enableSearch: true,
        enableSort: true,
        enableURLParams: true
    }
};

export default config;
