// js/utils/productUtils.js
import logger from './logger.js';

// Formatowanie danych produktu
export function formatProductData(product) {
    return {
        ...product,
        formattedPrice: product.price ? `${product.price.toFixed(2)} zł` : 'Cena na zapytanie',
        categoryName: getCategoryName(product.category),
        availability: product.purchase.availability ? 'Dostępny' : 'Niedostępny',
        deliveryTime: product.purchase.leadTime || 'Brak informacji'
    };
}

// Nazwy kategorii
export function getCategoryName(category) {
    const categories = {
        power: 'Zasilanie',
        sensors: 'Sensory',
        mounting: 'Montaż',
        communication: 'Komunikacja',
        camera: 'Kamery',
        accessories: 'Akcesoria'
    };
    return categories[category] || category;
}

// Przygotowanie danych do porównania
export function prepareComparisonData(state) {
    return {
        products: state.products.map(p => formatProductData(p)),
        features: prepareFeaturesComparison(state.products),
        specs: prepareSpecsComparison(state.products),
        package: preparePackageComparison(state.products),
        generateHTML: () => generateComparisonHTML(state)
    };
}

// Eksport do PDF
export async function exportToPDF(state) {
    logger.debug('Starting PDF export');
    try {
        const comparisonData = prepareComparisonData(state);
        const html = generatePDFTemplate(comparisonData);
        const pdfBlob = await generatePDF(html);
        downloadFile(pdfBlob, `portigen-porownanie-${new Date().toISOString().slice(0,10)}.pdf`, 'application/pdf');
        logger.success('PDF export completed');
    } catch (error) {
        logger.error('Error exporting to PDF', error);
        throw error;
    }
}

// Eksport do Excel
export async function exportToExcel(state) {
    logger.debug('Starting Excel export');
    try {
        const comparisonData = prepareComparisonData(state);
        const workbook = createExcelWorkbook(comparisonData);
        const excelBlob = await generateExcel(workbook);
        downloadFile(excelBlob, `portigen-porownanie-${new Date().toISOString().slice(0,10)}.xlsx`);
        logger.success('Excel export completed');
    } catch (error) {
        logger.error('Error exporting to Excel', error);
        throw error;
    }
}

// Funkcje pomocnicze dla porównań
export function renderFeaturesComparison(products, highlight) {
    const maxFeatures = Math.max(...products.map(p => p.keyFeatures.length));
    return Array.from({ length: maxFeatures }).map((_, i) => {
        const values = products.map(p => p.keyFeatures[i]);
        return {
            label: `Cecha ${i + 1}`,
            values: values.map(v => v ? `${v.title}: ${v.description}` : '-'),
            className: highlight ? getComparisonClass(values) : ''
        };
    });
}

export function renderSpecsComparison(products, highlight) {
    const allSpecs = new Set(products.flatMap(p => Object.keys(p.technicalSpecs)));
    return Array.from(allSpecs).map(spec => {
        const values = products.map(p => p.technicalSpecs[spec]?.value || '-');
        return {
            label: products.find(p => p.technicalSpecs[spec])?.technicalSpecs[spec].label || spec,
            values,
            className: highlight ? getComparisonClass(values) : ''
        };
    });
}

export function renderPackageComparison(products, highlight) {
    const maxItems = Math.max(...products.map(p => p.package.length));
    return Array.from({ length: maxItems }).map((_, i) => {
        const values = products.map(p => p.package[i] || '-');
        return {
            label: `Element ${i + 1}`,
            values,
            className: highlight ? getComparisonClass(values) : ''
        };
    });
}

// Funkcje pomocnicze dla eksportu
function generatePDFTemplate(data) {
    return `
        <style>
            ${getPDFStyles()}
        </style>
        <h1>Porównanie produktów PORTIGEN</h1>
        <p>Data wygenerowania: ${new Date().toLocaleString()}</p>
        ${generateComparisonHTML(data)}
    `;
}

function getPDFStyles() {
    return `
        body { font-family: Arial, sans-serif; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 8px; border: 1px solid #ddd; }
        th { background-color: #f5f5f5; }
        .feature-match { background-color: #e8f5e9; }
        .feature-different { background-color: #fce4ec; }
        .product-image { width: 100px; height: auto; }
    `;
}

function generateComparisonHTML(data) {
    // Implementation of HTML generation for comparison table
    return `
        <table>
            <thead>${generateTableHeader(data.products)}</thead>
            <tbody>
                ${generateTableBody(data)}
            </tbody>
        </table>
    `;
}

// Funkcje pomocnicze dla generowania HTML
function generateTableHeader(products) {
    return `
        <tr>
            <th>Cecha</th>
            ${products.map(p => `
                <th>
                    <img src="${p.media.mainImage}" alt="${p.name}" class="product-image">
                    <div>${p.name}</div>
                </th>
            `).join('')}
        </tr>
    `;
}

function generateTableBody(data) {
    return `
        ${generateFeatureRows(data.features)}
        ${generateSpecRows(data.specs)}
        ${generatePackageRows(data.package)}
    `;
}

function generateFeatureRows(features) {
    return features.map(feature => `
        <tr class="${feature.className}">
            <td><strong>${feature.label}</strong></td>
            ${feature.values.map(value => `<td>${value}</td>`).join('')}
        </tr>
    `).join('');
}

function generateSpecRows(specs) {
    return specs.map(spec => `
        <tr class="${spec.className}">
            <td><strong>${spec.label}</strong></td>
            ${spec.values.map(value => `<td>${value}</td>`).join('')}
        </tr>
    `).join('');
}

function generatePackageRows(packageItems) {
    return packageItems.map(item => `
        <tr class="${item.className}">
            <td><strong>${item.label}</strong></td>
            ${item.values.map(value => `<td>${value}</td>`).join('')}
        </tr>
    `).join('');
}

// Excel specific functions
function createExcelWorkbook(data) {
    const wb = XLSX.utils.book_new();
    
    // Dodawanie arkuszy
    const sheets = {
        'Cechy główne': prepareFeaturesSheet(data),
        'Specyfikacja': prepareSpecsSheet(data),
        'Zawartość zestawu': preparePackageSheet(data)
    };

    Object.entries(sheets).forEach(([name, sheetData]) => {
        const ws = XLSX.utils.json_to_sheet(sheetData);
        XLSX.utils.book_append_sheet(wb, ws, name);
    });

    return wb;
}

function prepareFeaturesSheet(data) {
    return data.products.map(product => ({
        'Produkt': product.name,
        'Kategoria': product.categoryName,
        ...data.features.reduce((acc, feature, index) => ({
            ...acc,
            [feature.label]: feature.values[data.products.indexOf(product)]
        }), {})
    }));
}

function prepareSpecsSheet(data) {
    return data.products.map(product => ({
        'Produkt': product.name,
        ...data.specs.reduce((acc, spec) => ({
            ...acc,
            [spec.label]: spec.values[data.products.indexOf(product)]
        }), {})
    }));
}

function preparePackageSheet(data) {
    return data.products.map(product => ({
        'Produkt': product.name,
        ...data.package.reduce((acc, item) => ({
            ...acc,
            [item.label]: item.values[data.products.indexOf(product)]
        }), {})
    }));
}

// File handling utilities
async function generatePDF(html) {
    // Using html2pdf.js or similar library
    const options = {
        margin: 10,
        filename: 'comparison.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };

    try {
        const blob = await html2pdf().from(html).set(options).outputPdf('blob');
        return blob;
    } catch (error) {
        logger.error('Error generating PDF', error);
        throw error;
    }
}

async function generateExcel(workbook) {
    try {
        const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        return new Blob([buffer], { 
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        });
    } catch (error) {
        logger.error('Error generating Excel', error);
        throw error;
    }
}

function downloadFile(blob, fileName, type = '') {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
}

// Comparison utilities
function getComparisonClass(values) {
    if (!values || values.length === 0) return '';
    const allSame = values.every(v => v === values[0]);
    return allSame ? 'feature-match' : 'feature-different';
}

// URL and state management
export function updateURL(filters) {
    const url = new URL(window.location);
    Object.entries(filters).forEach(([key, value]) => {
        if (value) {
            url.searchParams.set(key, value);
        } else {
            url.searchParams.delete(key);
        }
    });
    window.history.pushState({}, '', url);
}

export function loadFiltersFromURL() {
    const params = new URLSearchParams(window.location.search);
    return {
        category: params.get('category') || '',
        search: params.get('search') || '',
        sorting: params.get('sorting') || 'name'
    };
}

// Data validation utilities
export function validateProduct(product) {
    const requiredFields = ['id', 'name', 'category', 'shortDescription', 'media'];
    const missingFields = requiredFields.filter(field => !product[field]);
    
    if (missingFields.length > 0) {
        logger.warning(`Product validation failed: missing fields ${missingFields.join(', ')}`, product);
        return false;
    }
    return true;
}

// Export all utility functions
export {
    generateComparisonHTML,
    createExcelWorkbook,
    generatePDF,
    generateExcel,
    downloadFile,
    getComparisonClass
};
