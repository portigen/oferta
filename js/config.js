// config.js
const config = {
    isProductPage: false,
    isComparePage: false,
    isHomePage: true,
    maxCompareProducts: 4,
    apiEndpoint: '/products.json',
    paths: {
        compare: '/compare.html',
        products: ''
    },
    templates: {
        productCard: 'templates/product-card.html',
        productPage: 'templates/product-page.html',
        comparePage: 'templates/compare-page.html'
    }
};

export default config;
