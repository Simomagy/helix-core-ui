class Menu {
    constructor() {
        // DOM element references
        this.elements = {
            screen: document.querySelector('.screen'),
            menu: document.querySelector('.side-menu'),
            container: document.getElementById('menu-container'),
            title: document.querySelector('.header .title'),
            info: document.querySelector('.info'),
            infoHead: document.querySelector('.info .head p'),
            infoDescription: document.querySelector('.info .description'),
            notificationsContainer: document.getElementById('notifications-container')
        };

        // Bind methods
        this.handleMessage = this.handleMessage.bind(this);

        // Initialize
        this.init();
    }

    init() {
        // Listen for NUI messages
        window.addEventListener('message', this.handleMessage);

        // Close button handler
        const closeBtn = document.querySelector('.close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.close();
            });
        }

        // Notify Lua that UI is ready
        setTimeout(() => {
            this.sendEvent('Ready', {});
        }, 100);
    }

    /**
     * Send event to Lua via hEvent callback
     */
    sendEvent(eventName, data) {
        if (typeof hEvent === 'function') {
            hEvent(eventName, data);
        }
    }

    /**
     * Handle incoming NUI messages
     */
    handleMessage(event) {
        const { name, action, args } = event.data;
        const eventAction = name || action;

        const handlers = {
            'ClearMenuItems': () => this.clearMenuItems(),
            'AddMenuItem': () => this.addMenuItem(args?.[0]),
            'BuildMenu': () => this.show(), // Just show, items are added progressively
            'CloseMenu': () => this.close(),
            'SetHeader': () => this.setHeader(args?.[0]),
            'SetMenuInfo': () => this.setMenuInfo(args?.[0]),
            'ShowNotification': () => this.showNotification(args?.[0])
        };

        handlers[eventAction]?.();
    }

    /**
     * Clear menu items
     */
    clearMenuItems() {
        if (this.elements.container) {
            this.elements.container.innerHTML = '';
        }
    }

    /**
     * Add item to menu
     */
    addMenuItem(item) {
        if (!item || !this.elements.container) return;

        const element = this.createMenuItem(item);
        if (element) {
            this.elements.container.appendChild(element);
        }
    }

    /**
     * Show the menu
     */
    show() {
        this.elements.menu?.classList.remove('hidden');
        this.elements.screen?.classList.remove('hidden');
    }

    /**
     * Close the menu
     */
    close() {
        this.elements.menu?.classList.add('hidden');
        this.elements.screen?.classList.add('hidden');
        this.clearMenuItems();
        this.sendEvent('CloseMenu');
    }

    /**
     * Set menu header
     */
    setHeader(data) {
        if (data?.header && this.elements.title) {
            this.elements.title.textContent = data.header;
        }
    }

    /**
     * Set menu info section
     */
    setMenuInfo(data) {
        if (!data) return;

        if (data.description) {
            if (this.elements.infoHead) {
                this.elements.infoHead.textContent = data.title || 'Information';
            }
            if (this.elements.infoDescription) {
                this.elements.infoDescription.textContent = data.description;
            }
            if (this.elements.info) {
                this.elements.info.style.display = 'flex';
            }
        } else {
            if (this.elements.info) {
                this.elements.info.style.display = 'none';
            }
        }
    }

    /**
     * Create a menu item element based on type
     */
    createMenuItem(item) {
        const creators = {
            'button': () => this.createButton(item),
            'checkbox': () => this.createCheckbox(item),
            'dropdown': () => this.createDropdown(item),
            'range': () => this.createRange(item),
            'text-input': () => this.createTextInput(item),
            'password': () => this.createPasswordInput(item),
            'radio': () => this.createRadio(item),
            'number': () => this.createNumberInput(item),
            'select': () => this.createSelect(item),
            'color': () => this.createColorPicker(item),
            'date': () => this.createDateInput(item),
            'list-picker': () => this.createListPicker(item),
            'text-display': () => this.createTextDisplay(item)
        };

        return creators[item.type]?.();
    }

    // --- Component Creators ---

    sanitizeHTML(str) {
        if (str === null || str === undefined) return '';
        const div = document.createElement('div');
        div.textContent = String(str);
        return div.innerHTML;
    }

    executeCallback(id, params) {
        this.sendEvent('ExecuteCallback', { id, params });
    }

    createButton(item) {
        const div = document.createElement('div');
        const isPrimary = item.primary || item.variant === 'primary';
        div.className = `option action ${isPrimary ? 'primary' : ''}`;
        div.innerHTML = `
            <p class="name">${this.sanitizeHTML(item.text || item.label)}</p>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M7 7h10v10"/>
                <path d="M7 17 17 7"/>
            </svg>
        `;
        div.addEventListener('click', () => this.executeCallback(item.id, null));
        return div;
    }

    createCheckbox(item) {
        const div = document.createElement('div');
        div.className = `option checkbox ${item.checked ? 'active' : ''}`;
        div.innerHTML = `
            <p class="name">${this.sanitizeHTML(item.label)}</p>
            <div class="check">
                <svg width="16" height="12" viewBox="0 0 16 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5.90784 8.62145L2.66811 5.38172C2.47662 5.19022 2.2169 5.08265 1.94609 5.08265C1.67528 5.08265 1.41556 5.19022 1.22407 5.38172C1.03258 5.57321 0.924999 5.83292 0.924999 6.10373C0.924999 6.23783 0.95141 6.3706 1.00272 6.49449C1.05404 6.61837 1.12925 6.73094 1.22407 6.82575L5.19053 10.7922C5.5899 11.1916 6.2352 11.1916 6.63457 10.7922L14.7763 2.65053C14.9677 2.45904 15.0753 2.19932 15.0753 1.92851C15.0753 1.6577 14.9677 1.39798 14.7763 1.20649C14.5848 1.015 14.325 0.907421 14.0542 0.907421C13.7834 0.907421 13.5237 1.01499 13.3323 1.20646C13.3322 1.20647 13.3322 1.20648 13.3322 1.20649M5.90784 8.62145L13.3322 1.20649M5.90784 8.62145L13.3322 1.20649M5.90784 8.62145L13.3322 1.20649" stroke-width="0.150002" />
                </svg>
            </div>
        `;
        div.addEventListener('click', () => {
            div.classList.toggle('active');
            this.executeCallback(item.id, div.classList.contains('active'));
        });
        return div;
    }

    createDropdown(item) {
        const div = document.createElement('div');
        div.className = 'option dropdown';
        div.innerHTML = `
            <div class="dropdown-header">
                <p class="name">${this.sanitizeHTML(item.label)}</p>
                <span class="arrow">▼</span>
            </div>
            <div class="dropdown-content hidden"></div>
        `;

        const content = div.querySelector('.dropdown-content');
        item.options?.forEach(opt => {
            const subElement = this.createMenuItem(opt);
            if (subElement) {
                content.appendChild(subElement);
            }
        });

        div.querySelector('.dropdown-header').addEventListener('click', () => {
            content.classList.toggle('hidden');
            div.querySelector('.arrow').textContent = content.classList.contains('hidden') ? '▼' : '▲';
        });

        return div;
    }

    createRange(item) {
        const div = document.createElement('div');
        div.className = 'option range-input';
        div.innerHTML = `
            <p class="name">${this.sanitizeHTML(item.label)}</p>
            <input type="range" min="${this.sanitizeHTML(item.min)}" max="${this.sanitizeHTML(item.max)}" value="${this.sanitizeHTML(item.value)}">
            <span class="range-value">${this.sanitizeHTML(item.value)}</span>
        `;

        const input = div.querySelector('input');
        const valueSpan = div.querySelector('.range-value');

        const updateRangeBackground = () => {
            const min = parseFloat(input.min) || 0;
            const max = parseFloat(input.max) || 100;
            const value = parseFloat(input.value) || 0;
            const percentage = ((value - min) / (max - min)) * 100;
            input.style.background = `linear-gradient(to right, var(--primary) 0%, var(--primary) ${percentage}%, #2a2a2a ${percentage}%, #2a2a2a 100%)`;
        };

        updateRangeBackground();

        input.addEventListener('input', () => {
            valueSpan.textContent = input.value;
            updateRangeBackground();
            this.executeCallback(item.id, parseFloat(input.value));
        });

        return div;
    }

    createTextInput(item) {
        const div = document.createElement('div');
        div.className = 'option text-input';
        div.innerHTML = `
            <p class="name">${this.sanitizeHTML(item.label)}</p>
            <div class="input">
                <input type="text" placeholder="${this.sanitizeHTML(item.placeholder || 'Enter text')}">
            </div>
        `;

        div.querySelector('input').addEventListener('change', (e) => {
            this.executeCallback(item.id, e.target.value);
        });

        return div;
    }

    createPasswordInput(item) {
        const div = document.createElement('div');
        div.className = 'option password-input';
        div.innerHTML = `
            <p class="name">${this.sanitizeHTML(item.label)}</p>
            <div class="input">
                <input type="password" placeholder="${this.sanitizeHTML(item.placeholder || '')}">
            </div>
        `;

        div.querySelector('input').addEventListener('change', (e) => {
            this.executeCallback(item.id, e.target.value);
        });

        return div;
    }

    createRadio(item) {
        const div = document.createElement('div');
        div.className = 'option radio-group';

        const radioHTML = item.options.map(opt => `
            <label>
                <input type="radio" name="${this.sanitizeHTML(item.id)}" value="${this.sanitizeHTML(opt.value)}" ${opt.checked ? 'checked' : ''}>
                ${this.sanitizeHTML(opt.text)}
            </label>
        `).join('');

        div.innerHTML = `
            <p class="name">${this.sanitizeHTML(item.label)}</p>
            <div class="radio-options">${radioHTML}</div>
        `;

        div.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.executeCallback(item.id, e.target.value);
            });
        });

        return div;
    }

    createNumberInput(item) {
        const div = document.createElement('div');
        div.className = 'option number-input';
        div.innerHTML = `
            <p class="name">${this.sanitizeHTML(item.label)}</p>
            <div class="input">
                <input type="number" value="${this.sanitizeHTML(item.value)}">
            </div>
        `;

        div.querySelector('input').addEventListener('change', (e) => {
            this.executeCallback(item.id, parseFloat(e.target.value));
        });

        return div;
    }

    createSelect(item) {
        const currentSelected = item.options.find(opt => opt.selected) || item.options[0];

        const div = document.createElement('div');
        div.className = 'option select-input';
        div.innerHTML = `
            <p class="name">${this.sanitizeHTML(item.label)}</p>
            <div class="input custom-select">
                <div class="select-display">${this.sanitizeHTML(currentSelected?.text || 'Select...')}</div>
                <div class="select-dropdown hidden"></div>
            </div>
        `;

        const customSelect = div.querySelector('.custom-select');
        const display = div.querySelector('.select-display');
        const dropdown = div.querySelector('.select-dropdown');

        item.options.forEach(opt => {
            const optionEl = document.createElement('div');
            optionEl.className = `select-option ${opt.selected ? 'selected' : ''}`;
            optionEl.dataset.value = this.sanitizeHTML(opt.value);
            optionEl.textContent = this.sanitizeHTML(opt.text);

            optionEl.addEventListener('click', (e) => {
                e.stopPropagation();
                display.textContent = opt.text;
                dropdown.querySelectorAll('.select-option').forEach(o => o.classList.remove('selected'));
                optionEl.classList.add('selected');
                dropdown.classList.add('hidden');
                customSelect.classList.remove('open');
                this.executeCallback(item.id, opt.value);
            });

            dropdown.appendChild(optionEl);
        });

        display.addEventListener('click', (e) => {
            e.stopPropagation();

            // Close other dropdowns
            document.querySelectorAll('.select-dropdown').forEach(d => {
                if (d !== dropdown) d.classList.add('hidden');
            });
            document.querySelectorAll('.custom-select').forEach(s => {
                if (s !== customSelect) s.classList.remove('open');
            });

            dropdown.classList.toggle('hidden');
            customSelect.classList.toggle('open');
        });

        return div;
    }

    createColorPicker(item) {
        const initialColor = this.sanitizeHTML(item.value || '#ffffff');
        const div = document.createElement('div');
        div.className = 'option color-input';
        div.innerHTML = `
            <p class="name">${this.sanitizeHTML(item.label)}</p>
            <div class="input custom-color-picker">
                <div class="color-display" style="background-color: ${initialColor}"></div>
                <div class="color-value">${initialColor}</div>
                <div class="color-palette hidden">
                    <div class="preset-colors"></div>
                </div>
            </div>
        `;

        const colorPicker = div.querySelector('.custom-color-picker');
        const colorDisplay = div.querySelector('.color-display');
        const colorValue = div.querySelector('.color-value');
        const colorPalette = div.querySelector('.color-palette');
        const presetColors = div.querySelector('.preset-colors');

        const presets = [
            '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
            '#FFFFFF', '#000000', '#808080', '#FFA500', '#800080', '#00FBDD',
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA5E9'
        ];

        presets.forEach(color => {
            const colorBox = document.createElement('div');
            colorBox.className = 'preset-color';
            colorBox.style.backgroundColor = color;

            colorBox.addEventListener('click', (e) => {
                e.stopPropagation();
                colorDisplay.style.backgroundColor = color;
                colorValue.textContent = color;
                colorPalette.classList.add('hidden');
                colorPicker.classList.remove('open');
                this.executeCallback(item.id, color);
            });

            presetColors.appendChild(colorBox);
        });

        colorPicker.addEventListener('click', (e) => {
            e.stopPropagation();
             // Close others
            document.querySelectorAll('.color-palette').forEach(p => {
                if (p !== colorPalette) p.classList.add('hidden');
            });

            colorPalette.classList.toggle('hidden');
            colorPicker.classList.toggle('open');
        });

        return div;
    }

    createDateInput(item) {
        const div = document.createElement('div');
        div.className = 'option date-input';
        div.innerHTML = `
            <p class="name">${this.sanitizeHTML(item.label)}</p>
            <div class="input">
                <input type="date" value="${this.sanitizeHTML(item.value || '2024-01-01')}">
            </div>
        `;

        div.querySelector('input').addEventListener('change', (e) => {
            this.executeCallback(item.id, e.target.value);
        });

        return div;
    }

    createListPicker(item) {
        let currentIndex = 0;
        const div = document.createElement('div');
        div.className = 'option list-picker';
        div.innerHTML = `
            <p class="name">${this.sanitizeHTML(item.label)}</p>
            <div class="list-picker-controls">
                <div class="controls">
                    <button class="left">◀</button>
                    <span class="value">${this.sanitizeHTML(item.list[0].label)}</span>
                    <button class="right">▶</button>
                </div>
            </div>
        `;

        const valueSpan = div.querySelector('.value');
        const leftBtn = div.querySelector('.left');
        const rightBtn = div.querySelector('.right');

        const updateValue = () => {
            valueSpan.textContent = this.sanitizeHTML(item.list[currentIndex].label);
            this.executeCallback(item.id, item.list[currentIndex]);
        };

        leftBtn.addEventListener('click', () => {
            currentIndex = (currentIndex - 1 + item.list.length) % item.list.length;
            updateValue();
        });

        rightBtn.addEventListener('click', () => {
            currentIndex = (currentIndex + 1) % item.list.length;
            updateValue();
        });

        return div;
    }

    createTextDisplay(item) {
        const div = document.createElement('div');
        div.className = 'option text-display';
        div.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="separator-icon">
                <path d="m16 16-4 4-4-4"/>
                <path d="M3 12h18"/>
                <path d="m8 8 4-4 4 4"/>
            </svg>
            <div class="text-content"></div>
        `;

        const textContent = div.querySelector('.text-content');

        if (item.is_list && Array.isArray(item.data)) {
            const ul = document.createElement('ul');
            item.data.forEach(line => {
                const li = document.createElement('li');
                li.textContent = this.sanitizeHTML(line);
                ul.appendChild(li);
            });
            textContent.appendChild(ul);
        } else {
            textContent.textContent = this.sanitizeHTML(item.data);
        }

        return div;
    }

    showNotification(data) {
        if (!data || !this.elements.notificationsContainer) return;

        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.innerHTML = `
            <div class="notification-title">${this.sanitizeHTML(data.title)}</div>
            <div class="notification-message">${this.sanitizeHTML(data.message)}</div>
        `;

        if (data.color) {
            notification.style.borderLeftColor = data.color;
        }

        this.elements.notificationsContainer.appendChild(notification);

        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, data.duration || 3000);
    }
}

// Close dropdowns when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.select-input')) {
        document.querySelectorAll('.select-dropdown').forEach(d => d.classList.add('hidden'));
        document.querySelectorAll('.custom-select').forEach(s => s.classList.remove('open'));
    }
    if (!e.target.closest('.color-input')) {
        document.querySelectorAll('.color-palette').forEach(p => p.classList.add('hidden'));
        document.querySelectorAll('.custom-color-picker').forEach(s => s.classList.remove('open'));
    }
});

// Initialize menu
const menu = new Menu();
