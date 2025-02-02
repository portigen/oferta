// compare-system.js
import config from './config.js';

export class CompareSystem {
    constructor() {
        this.maxProducts = config.maxCompareProducts;
        this.floatingCompare = null;
        this.init();
    }

    init() {
        this.initializeFloat();
        this.updateCompareFloat();
        this.bindEvents();
    }

    initializeFloat() {
        this.floatingCompare = document.createElement('div');
        this.floatingCompare.className = 'compare-float';
        this.floatingCompare.innerHTML = `
            <span class="compare-float-counter" id="compareCount">0</span>
            <span>produktów do porównania</span>
            <button class="compare-float-button">
                Porównaj produkty
            </button>
            <span class="compare-clear">
                Wyczyść
            </span>
        `;
        document.body.appendChild(this.floatingCompare);
    }

    bindEvents() {
        this.floatingCompare.querySelector('.compare-float-button')
            .addEventListener('click', () => this.goToComparison());
        
        this.floatingCompare.querySelector('.compare-clear')
            .addEventListener('click', () => this.clearComparison());

        // Nasłuchiwanie zmian w localStorage z innych zakładek
        window.addEventListener('storage', (e) => {
            if (e.key === 'compareProducts') {
                this.updateCompareFloat();
                this.updateButtons();
            }
        });
    }

    toggleCompare(productId) {
        let compareList = this.getCompareList();
        
        if (compareList.includes(productId)) {
            compareList = compareList.filter(id => id !== productId);
        } else {
            if (compareList.length >= this.maxProducts) {
                alert(`Możesz porównać maksymalnie ${this.maxProducts} produkty jednocześnie`);
                return;
            }
            compareList.push(productId);
        }
        
        localStorage.setItem('compareProducts', JSON.stringify(compareList));
        this.updateCompareFloat();
        this.updateButtons();

        // Wywołanie eventu dla innych komponentów
        window.dispatchEvent(new CustomEvent('compareListUpdated', {
            detail: { compareList }
        }));
    }

    getCompareList() {
        return JSON.parse(localStorage.getItem('compareProducts') || '[]');
    }

    updateCompareFloat() {
        const count = this.getCompareList().length;
        document.getElementById('compareCount').textContent = count;
        this.floatingCompare.className = `compare-float ${count > 0 ? 'visible' : ''}`;
    }

    updateButtons() {
        const compareList = this.getCompareList();
        document.querySelectorAll('[data-compare-button]').forEach(button => {
            const productId = button.dataset.productId;
            const isCompared = compareList.includes(productId);
            button.classList.toggle('active', isCompared);
            button.textContent = isCompared ? 'Usuń z porównania' : 'Dodaj do porównania';
        });
    }

    goToComparison() {
        window.location.href = config.paths.compare;
    }

    clearComparison() {
        localStorage.removeItem('compareProducts');
        this.updateCompareFloat();
        this.updateButtons();
        window.dispatchEvent(new CustomEvent('compareListUpdated', {
            detail: { compareList: [] }
        }));
    }
}

export default CompareSystem;
