// js/utils/logger.js
class Logger {
    constructor() {
        this.isDebug = true; // Możesz zmienić na false w produkcji
        this.styles = {
            info: 'color: #2196F3; font-weight: bold;',
            success: 'color: #4CAF50; font-weight: bold;',
            warning: 'color: #FFC107; font-weight: bold;',
            error: 'color: #F44336; font-weight: bold;',
            debug: 'color: #9C27B0; font-weight: bold;'
        };
    }

    info(message, data = null) {
        console.log(`%c[INFO] ${message}`, this.styles.info);
        if (data) console.log(data);
    }

    success(message, data = null) {
        console.log(`%c[SUCCESS] ${message}`, this.styles.success);
        if (data) console.log(data);
    }

    warning(message, data = null) {
        console.warn(`%c[WARNING] ${message}`, this.styles.warning);
        if (data) console.warn(data);
    }

    error(message, error = null) {
        console.error(`%c[ERROR] ${message}`, this.styles.error);
        if (error) {
            console.error('Error details:', error);
            console.error('Stack trace:', error.stack);
        }
    }

    debug(message, data = null) {
        if (!this.isDebug) return;
        console.log(`%c[DEBUG] ${message}`, this.styles.debug);
        if (data) console.log(data);
    }

    group(name, fn) {
        console.group(`%c[GROUP] ${name}`, this.styles.info);
        try {
            fn();
        } finally {
            console.groupEnd();
        }
    }
}

export default new Logger();
