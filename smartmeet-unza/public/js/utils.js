// Security Utilities
const security = {
    // Sanitize user input to prevent XSS
    sanitize: (str) => {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
    },

    // Generate a secure random string for salts
    generateSalt: () => {
        return crypto.getRandomValues(new Uint8Array(16)).join('');
    }
};

// DOM Utilities
const dom = {
    // Create element with attributes and children
    createElement: (tag, attributes = {}, children = []) => {
        const el = document.createElement(tag);
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'class') {
                el.className = value;
            } else if (key.startsWith('data-')) {
                el.setAttribute(key, value);
            } else if (key === 'text') {
                el.textContent = value;
            } else if (key === 'html') {
                el.innerHTML = value;
            } else if (key === 'on') {
                Object.entries(value).forEach(([event, handler]) => {
                    el.addEventListener(event, handler);
                });
            } else if (value !== undefined) {
                el[key] = value;
            }
        });

        children.forEach(child => {
            if (typeof child === 'string') {
                el.appendChild(document.createTextNode(child));
            } else if (child) {
                el.appendChild(child);
            }
        });

        return el;
    },

    // Batch DOM updates using DocumentFragment
    batchUpdate: (parent, elements) => {
        const fragment = document.createDocumentFragment();
        elements.forEach(element => {
            if (element) {
                fragment.appendChild(element);
            }
        });
        parent.innerHTML = '';
        parent.appendChild(fragment);
    },

    // Safe HTML rendering with sanitization
    safeHTML: (strings, ...values) => {
        return strings.reduce((result, str, i) => {
            const value = i < values.length ? security.sanitize(values[i]) : '';
            return result + str + value;
        }, '');
    }
};

// API Utilities
const api = {
    // Centralized fetch with error handling
    request: async (endpoint, options = {}) => {
        const defaultHeaders = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };

        const config = {
            ...options,
            headers: {
                ...defaultHeaders,
                ...(options.headers || {})
            }
        };

        try {
            const response = await fetch(`/api${endpoint}`, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // Common API methods
    get: (endpoint) => api.request(endpoint, { method: 'GET' }),
    post: (endpoint, data) => api.request(endpoint, {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    put: (endpoint, data) => api.request(endpoint, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    delete: (endpoint) => api.request(endpoint, { method: 'DELETE' })
};

// Template Engine
const template = {
    // Simple template engine with caching
    cache: new Map(),

    // Compile template string to function
    compile: (templateString) => {
        if (template.cache.has(templateString)) {
            return template.cache.get(templateString);
        }

        const fn = new Function('data', `
            with(data) {
                return \`${templateString}\`;
            }
        `);

        template.cache.set(templateString, fn);
        return fn;
    },

    // Render template with data
    render: (templateString, data = {}) => {
        try {
            const compiled = template.compile(templateString);
            return compiled(data);
        } catch (error) {
            console.error('Template error:', error);
            return '';
        }
    }
};

// Loading State Management
const loading = {
    show: (element, text = 'Loading...') => {
        const loader = dom.createElement('div', {
            class: 'loading-overlay',
            style: 'position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(255,255,255,0.8); display: flex; justify-content: center; align-items: center; z-index: 1000;'
        }, [
            dom.createElement('div', { class: 'spinner' }),
            dom.createElement('span', { style: 'margin-left: 10px;' }, text)
        ]);

        element.style.position = 'relative';
        element.appendChild(loader);
        return () => loading.hide(loader);
    },

    hide: (loader) => {
        if (loader && loader.parentNode) {
            loader.parentNode.removeChild(loader);
        }
    }
};

// Event Delegation
const events = {
    // Add delegated event listener
    on: (selector, eventType, handler, parent = document) => {
        parent.addEventListener(eventType, (e) => {
            const target = e.target.closest(selector);
            if (target) {
                handler(e, target);
            }
        });
    },

    // Remove delegated event listener
    off: (selector, eventType, handler, parent = document) => {
        parent.removeEventListener(eventType, (e) => {
            const target = e.target.closest(selector);
            if (target) {
                handler(e, target);
            }
        });
    }
};

export { security, dom, api, template, loading, events };
