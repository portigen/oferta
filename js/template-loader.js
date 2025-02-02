// js/template-loader.js
import config from './config.js';

class TemplateLoader {
    constructor() {
        this.templates = new Map();
        this.templatePath = '/templates/';
    }

    async loadTemplate(name) {
        if (this.templates.has(name)) {
            return this.templates.get(name);
        }

        try {
            const response = await fetch(`${this.templatePath}${name}.html`);
            if (!response.ok) throw new Error(`Template ${name} not found`);
            
            const template = await response.text();
            this.templates.set(name, template);
            return template;
        } catch (error) {
            console.error('Error loading template:', error);
            throw error;
        }
    }

    // Prosty silnik szablonów
    render(template, data) {
        return template.replace(/\{\{(.*?)\}\}/g, (match, key) => {
            // Obsługa zagnieżdżonych właściwości (np. product.name)
            const value = key.trim().split('.').reduce((obj, key) => 
                obj ? obj[key] : null, data
            );
            return value !== undefined ? value : '';
        });
    }

    // Metoda do renderowania sekcji #each
    renderEach(template, data) {
        // Znajdujemy wszystkie bloki #each
        const eachRegex = /\{\{#each\s+(.+?)\}\}([\s\S]+?)\{\{\/each\}\}/g;
        
        return template.replace(eachRegex, (match, key, content) => {
            const items = key.trim().split('.').reduce((obj, key) => 
                obj ? obj[key] : [], data
            );

            if (!Array.isArray(items)) return '';

            return items.map(item => this.render(content, { 
                ...data, 
                this: item,
                '@index': items.indexOf(item)
            })).join('');
        });
    }

    // Metoda do renderowania warunków #if
    renderConditions(template, data) {
        // Znajdujemy wszystkie bloki #if
        const ifRegex = /\{\{#if\s+(.+?)\}\}([\s\S]+?)(?:\{\{else\}\}([\s\S]+?))?\{\{\/if\}\}/g;
        
        return template.replace(ifRegex, (match, condition, ifContent, elseContent = '') => {
            const value = condition.trim().split('.').reduce((obj, key) => 
                obj ? obj[key] : null, data
            );
            
            return value ? this.render(ifContent, data) : this.render(elseContent, data);
        });
    }

    // Główna metoda renderująca
    async renderTemplate(name, data) {
        let template = await this.loadTemplate(name);
        
        // Renderujemy w odpowiedniej kolejności
        template = this.renderConditions(template, data);
        template = this.renderEach(template, data);
        template = this.render(template, data);
        
        return template;
    }
}

export default new TemplateLoader();
