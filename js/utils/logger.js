// js/utils/logger.js
import config from '../config.js';

class Logger {
    constructor() {
        this.isDebug = config.debug;
        this.enabled = true;
        this.logLevel = this.getLogLevel();
        this.history = [];
        this.maxHistorySize = 1000;

        this.styles = {
            info: 'color: #2196F3; font-weight: bold;',
            success: 'color: #4CAF50; font-weight: bold;',
            warning: 'color: #FFC107; font-weight: bold;',
            error: 'color: #F44336; font-weight: bold;',
            debug: 'color: #9C27B0; font-weight: bold;',
            group: 'color: #607D8B; font-weight: bold;'
        };
    }

    getLogLevel() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('logLevel') || 'info';
    }

    shouldLog(level) {
        const levels = {
            debug: 0,
            info: 1,
            success: 2,
            warning: 3,
            error: 4
        };

        return this.enabled && levels[level] >= levels[this.logLevel];
    }

    formatMessage(level, message) {
        const timestamp = new Date().toISOString();
        return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    }

    addToHistory(level, message, data) {
        this.history.push({
            timestamp: new Date(),
            level,
            message,
            data
        });

        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
        }
    }

    info(message, data = null) {
        if (!this.shouldLog('info')) return;
        
        console.log(`%c${this.formatMessage('info', message)}`, this.styles.info);
        if (data) console.log(data);
        
        this.addToHistory('info', message, data);
    }

    success(message, data = null) {
        if (!this.shouldLog('success')) return;
        
        console.log(`%c${this.formatMessage('success', message)}`, this.styles.success);
        if (data) console.log(data);
        
        this.addToHistory('success', message, data);
    }

    warning(message, data = null) {
        if (!this.shouldLog('warning')) return;
        
        console.warn(`%c${this.formatMessage('warning', message)}`, this.styles.warning);
        if (data) console.warn(data);
        
        this.addToHistory('warning', message, data);
    }

    error(message, error = null) {
        if (!this.shouldLog('error')) return;
        
        console.error(`%c${this.formatMessage('error', message)}`, this.styles.error);
        if (error) {
            console.error('Error details:', error);
            console.error('Stack trace:', error.stack);
        }
        
        this.addToHistory('error', message, error);
    }

    debug(message, data = null) {
        if (!this.isDebug || !this.shouldLog('debug')) return;
        
        console.log(`%c${this.formatMessage('debug', message)}`, this.styles.debug);
        if (data) console.log(data);
        
        this.addToHistory('debug', message, data);
    }

    group(name, fn) {
        if (!this.enabled) return;

        console.group(`%c${this.formatMessage('group', name)}`, this.styles.group);
        try {
            fn();
        } finally {
            console.groupEnd();
        }
    }

    getHistory(level = null) {
        if (level) {
            return this.history.filter(log => log.level === level);
        }
        return [...this.history];
    }

    clearHistory() {
        this.history = [];
    }

    enable() {
        this.enabled = true;
    }

    disable() {
        this.enabled = false;
    }

    setLogLevel(level) {
        this.logLevel = level;
    }
}

export default new Logger();
