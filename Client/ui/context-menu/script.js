class ContextMenu {
    constructor() {
        // State management
        this.state = {
            editMode: false,
            dropdownOpen: false,
            dropdownSelectedIndex: 0,
            colorPickerSelectedIndex: 0,
            radioGroupSelectedIndex: 0,
            pendingItems: [],
            persistentOptions: null,
            visibleElements: []
        };

        // DOM element references
        this.elements = {
            screen: document.querySelector('.screen'),
            menu: document.querySelector('.context-menu'),
            container: document.getElementById('context-menu-container'),
            focusCatcher: document.getElementById('ContextFocusCatcher'),
            title: document.querySelector('.header .title'),
            optionsQty: document.querySelector('.options-qty p:first-child'),
            optionsCounter: document.querySelector('.options-qty .qty'),
            info: document.querySelector('.info'),
            infoHead: document.querySelector('.info .head p'),
            infoDescription: document.querySelector('.info .description'),
            notificationsContainer: document.getElementById('notifications-container')
        };

        // Event namespace for cleanup
        this.EVENT_NAMESPACE = 'contextMenu';

        // Bind methods to preserve context
        this.handleMessage = this.handleMessage.bind(this);
        this.handleGlobalKeydown = this.handleGlobalKeydown.bind(this);
        this.handleInputFocus = this.handleInputFocus.bind(this);
        this.handleInputBlur = this.handleInputBlur.bind(this);
        this.handleInputKeydown = this.handleInputKeydown.bind(this);
        this.handleDocumentBlur = this.handleDocumentBlur.bind(this);

        // Initialize
        this.init();
    }

    init() {
        // Listen for NUI messages
        window.addEventListener('message', this.handleMessage);

        // Document blur handler for focus management
        document.addEventListener('blur', this.handleDocumentBlur, true);

        // Notify Lua that UI is ready
        setTimeout(() => {
            this.sendEvent('Ready', {});
        }, 100);
    }

    /**
     * Sanitizes HTML to prevent XSS attacks
     */
    sanitizeHTML(str) {
        if (str === null || str === undefined) return '';
        const div = document.createElement('div');
        div.textContent = String(str);
        return div.innerHTML;
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
     * Handle document blur for focus management
     */
    handleDocumentBlur(event) {
        const focusCatcher = this.elements.focusCatcher;
        const activeElement = document.activeElement;

        const isInput = activeElement?.tagName === 'INPUT' ||
                       activeElement?.tagName === 'TEXTAREA' ||
                       activeElement?.tagName === 'SELECT';

        if (focusCatcher && !document.hidden && !isInput && !this.state.editMode) {
            setTimeout(() => {
                const currentActive = document.activeElement;
                const stillNotInput = !currentActive ||
                    (currentActive.tagName !== 'INPUT' &&
                     currentActive.tagName !== 'TEXTAREA' &&
                     currentActive.tagName !== 'SELECT');

                if (stillNotInput) {
                    focusCatcher.focus();
                }
            }, 0);
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
            'BuildMenu': () => this.buildMenu(this.state.pendingItems),
            'BuildContextMenu': () => this.buildMenu(args?.[0]?.items),
            'CloseContextMenu': () => this.close(),
            'SetHeader': () => this.setHeader(args?.[0]),
            'SetMenuInfo': () => this.setMenuInfo(args?.[0]),
            'FocusOptionById': () => this.focusOptionById(args?.[0]),
            'SelectFocusedOption': () => this.selectFocusedOption(),
            'ShowNotification': () => this.showNotification(args?.[0])
        };

        handlers[eventAction]?.();
    }

    /**
     * Clear pending menu items
     */
    clearMenuItems() {
        this.state.pendingItems = [];
    }

    /**
     * Add item to pending items
     */
    addMenuItem(item) {
        if (item) {
            this.state.pendingItems.push(item);
        }
    }

    /**
     * Build and display the context menu
     */
    buildMenu(items) {
        // Parse items if string
        if (typeof items === 'string') {
            try {
                items = JSON.parse(items);
            } catch (e) {
                console.error('Failed to parse menu items:', e);
                return;
            }
        }

        // Convert to array
        let itemsArray = [];
        if (Array.isArray(items)) {
            itemsArray = items;
        } else if (typeof items === 'object') {
            itemsArray = Object.values(items);
        }

        // Clear container
        this.elements.container.innerHTML = '';

        // Build menu items
        if (itemsArray.length === 0) {
            this.elements.container.innerHTML = '<div style="color:orange; padding:20px;">Menu has 0 items</div>';
        } else {
            itemsArray.forEach(item => {
                const element = this.createMenuItem(item);
                if (element) {
                    this.elements.container.appendChild(element);
                }
            });
        }

        this.state.persistentOptions = itemsArray;

        // Bind events and show menu
        this.bindGlobalEvents();
        this.show();
        this.rebuildVisibleList();
        this.selectFirstOption();
        this.updateCounter();

        // Focus menu
        setTimeout(() => {
            this.elements.focusCatcher?.focus();
        }, 100);
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

    /**
     * Create button element
     */
    createButton(item) {
        const div = document.createElement('div');
        const isPrimary = item.primary || item.variant === 'primary';
        div.className = `option action ${isPrimary ? 'primary' : ''}`;
        div.dataset.id = this.sanitizeHTML(item.id);
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

    /**
     * Create checkbox element
     */
    createCheckbox(item) {
        const div = document.createElement('div');
        div.className = `option checkbox ${item.checked ? 'active' : ''}`;
        div.dataset.id = this.sanitizeHTML(item.id);
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

    /**
     * Create dropdown element
     */
    createDropdown(item) {
        const div = document.createElement('div');
        div.className = 'option dropdown';
        div.dataset.id = this.sanitizeHTML(item.id);
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

    /**
     * Create range input element
     */
    createRange(item) {
        const div = document.createElement('div');
        div.className = 'option range-input';
        div.dataset.id = this.sanitizeHTML(item.id);
        div.innerHTML = `
            <p class="name">${this.sanitizeHTML(item.label)}</p>
            <input type="range" min="${this.sanitizeHTML(item.min)}" max="${this.sanitizeHTML(item.max)}" value="${this.sanitizeHTML(item.value)}">
            <span class="range-value">${this.sanitizeHTML(item.value)}</span>
        `;

        const input = div.querySelector('input');
        const valueSpan = div.querySelector('.range-value');
        input.addEventListener('input', () => {
            valueSpan.textContent = input.value;
            this.executeCallback(item.id, parseFloat(input.value));
        });

        return div;
    }

    /**
     * Create text input element
     */
    createTextInput(item) {
        const div = document.createElement('div');
        div.className = 'option text-input';
        div.dataset.id = this.sanitizeHTML(item.id);
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

    /**
     * Create password input element
     */
    createPasswordInput(item) {
        const div = document.createElement('div');
        div.className = 'option password-input';
        div.dataset.id = this.sanitizeHTML(item.id);
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

    /**
     * Create radio group element
     */
    createRadio(item) {
        const div = document.createElement('div');
        div.className = 'option radio-group';
        div.dataset.id = this.sanitizeHTML(item.id);

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

    /**
     * Create number input element
     */
    createNumberInput(item) {
        const div = document.createElement('div');
        div.className = 'option number-input';
        div.dataset.id = this.sanitizeHTML(item.id);
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

    /**
     * Create select element
     */
    createSelect(item) {
        const currentSelected = item.options.find(opt => opt.selected) || item.options[0];

        const div = document.createElement('div');
        div.className = 'option select-input';
        div.dataset.id = this.sanitizeHTML(item.id);
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

        // Add options
        item.options.forEach(opt => {
            const optionEl = document.createElement('div');
            optionEl.className = `select-option ${opt.selected ? 'selected' : ''}`;
            optionEl.dataset.value = this.sanitizeHTML(opt.value);
            optionEl.textContent = this.sanitizeHTML(opt.text);
            dropdown.appendChild(optionEl);
        });

        // Toggle dropdown
        customSelect.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('hidden');
            customSelect.classList.toggle('open');
        });

        // Handle option selection
        dropdown.addEventListener('click', (e) => {
            if (e.target.classList.contains('select-option')) {
                e.stopPropagation();
                const value = e.target.dataset.value;
                const text = e.target.textContent;

                display.textContent = text;
                dropdown.querySelectorAll('.select-option').forEach(opt => opt.classList.remove('selected'));
                e.target.classList.add('selected');

                dropdown.classList.add('hidden');
                customSelect.classList.remove('open');

                this.executeCallback(item.id, value);
            }
        });

        // Close on outside click (handled globally in handleDocumentClick)
        return div;
    }

    /**
     * Create color picker element
     */
    createColorPicker(item) {
        const initialColor = this.sanitizeHTML(item.value || '#ffffff');

        const div = document.createElement('div');
        div.className = 'option color-input';
        div.dataset.id = this.sanitizeHTML(item.id);
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

        // Add preset colors
        const presets = [
            '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
            '#FFFFFF', '#000000', '#808080', '#FFA500', '#800080', '#00FBDD',
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA5E9'
        ];

        presets.forEach(color => {
            const colorBox = document.createElement('div');
            colorBox.className = 'preset-color';
            colorBox.style.backgroundColor = color;
            colorBox.dataset.color = color;
            presetColors.appendChild(colorBox);
        });

        // Toggle palette
        colorPicker.addEventListener('click', (e) => {
            e.stopPropagation();
            colorPalette.classList.toggle('hidden');
            colorPicker.classList.toggle('open');
        });

        // Select color
        presetColors.addEventListener('click', (e) => {
            if (e.target.classList.contains('preset-color')) {
                e.stopPropagation();
                const color = e.target.dataset.color;

                colorDisplay.style.backgroundColor = color;
                colorValue.textContent = color;

                colorPalette.classList.add('hidden');
                colorPicker.classList.remove('open');

                this.executeCallback(item.id, color);
            }
        });

        return div;
    }

    /**
     * Create date input element
     */
    createDateInput(item) {
        const div = document.createElement('div');
        div.className = 'option date-input';
        div.dataset.id = this.sanitizeHTML(item.id);
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

    /**
     * Create list picker element
     */
    createListPicker(item) {
        let currentIndex = 0;

        const div = document.createElement('div');
        div.className = 'option list-picker';
        div.dataset.id = this.sanitizeHTML(item.id);
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

        div.querySelector('.left').addEventListener('click', () => {
            currentIndex = (currentIndex - 1 + item.list.length) % item.list.length;
            valueSpan.textContent = this.sanitizeHTML(item.list[currentIndex].label);
            this.executeCallback(item.id, item.list[currentIndex]);
        });

        div.querySelector('.right').addEventListener('click', () => {
            currentIndex = (currentIndex + 1) % item.list.length;
            valueSpan.textContent = this.sanitizeHTML(item.list[currentIndex].label);
            this.executeCallback(item.id, item.list[currentIndex]);
        });

        return div;
    }

    /**
     * Create text display element
     */
    createTextDisplay(item) {
        const div = document.createElement('div');
        div.className = 'option text-display';
        div.dataset.id = this.sanitizeHTML(item.id);

        if (item.is_list && Array.isArray(item.data)) {
            const ul = document.createElement('ul');
            item.data.forEach(line => {
                const li = document.createElement('li');
                li.textContent = this.sanitizeHTML(line);
                ul.appendChild(li);
            });
            div.appendChild(ul);
        } else {
            div.textContent = this.sanitizeHTML(item.data);
        }

        return div;
    }

    /**
     * Execute callback to Lua
     */
    executeCallback(id, params) {
        this.sendEvent('ExecuteCallback', { id, params });
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
        this.unbindGlobalEvents();
        this.elements.menu?.classList.add('hidden');
        this.elements.screen?.classList.add('hidden');
        if (this.elements.container) {
            this.elements.container.innerHTML = '';
        }
    }

    /**
     * Set menu header
     */
    setHeader(data) {
        if (data?.header && this.elements.optionsQty) {
            this.elements.optionsQty.textContent = data.header || 'Options';
            this.updateCounter();
        }
    }

    /**
     * Set menu info section
     */
    setMenuInfo(data) {
        if (!data) return;

        if (data.title && this.elements.title) {
            this.elements.title.textContent = data.title;
        }

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
     * Focus option by ID
     */
    focusOptionById(data) {
        if (!data?.id) return;

        document.querySelectorAll('.option').forEach(opt => opt.classList.remove('selected'));
        const target = document.querySelector(`.option[data-id="${data.id}"]`);
        if (target) {
            target.classList.add('selected');
            this.scrollToSelected();
        }
    }

    /**
     * Show notification
     */
    showNotification(data) {
        if (!data || !this.elements.notificationsContainer) return;

        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.innerHTML = `
            <div class="notification-title">${this.sanitizeHTML(data.title)}</div>
            <div class="notification-message">${this.sanitizeHTML(data.message)}</div>
        `;

        if (data.color) {
            notification.style.backgroundColor = data.color;
        }

        this.elements.notificationsContainer.appendChild(notification);

        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, data.duration || 3000);
    }

    /**
     * Bind global event listeners
     */
    bindGlobalEvents() {
        document.addEventListener('keydown', this.handleGlobalKeydown);
        document.addEventListener('focusin', this.handleInputFocus);
        document.addEventListener('focusout', this.handleInputBlur);

        // Delegate input keydown events
        this.elements.container?.addEventListener('keydown', this.handleInputKeydown);
    }

    /**
     * Unbind global event listeners
     */
    unbindGlobalEvents() {
        document.removeEventListener('keydown', this.handleGlobalKeydown);
        document.removeEventListener('focusin', this.handleInputFocus);
        document.removeEventListener('focusout', this.handleInputBlur);
        this.elements.container?.removeEventListener('keydown', this.handleInputKeydown);
    }

    /**
     * Handle global keydown
     */
    handleGlobalKeydown(e) {
        if (this.state.dropdownOpen) {
            this.handleDropdownNavigation(e);
        } else if (this.state.editMode) {
            this.handleEditModeNavigation(e);
        } else {
            this.handleNavigation(e);
        }
    }

    /**
     * Handle input focus - enter edit mode
     */
    handleInputFocus(e) {
        const target = e.target;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
            this.state.editMode = true;

            const option = target.closest('.option');
            if (option) {
                document.querySelectorAll('.option').forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
            }
        }
    }

    /**
     * Handle input blur - exit edit mode
     */
    handleInputBlur(e) {
        setTimeout(() => {
            const activeElement = document.activeElement;
            const stillInInput = activeElement?.tagName === 'INPUT' ||
                                activeElement?.tagName === 'TEXTAREA' ||
                                activeElement?.tagName === 'SELECT';

            if (!stillInInput) {
                this.state.editMode = false;
            }
        }, 100);
    }

    /**
     * Handle keydown within inputs
     */
    handleInputKeydown(e) {
        const target = e.target;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && target.tagName !== 'SELECT') {
            return;
        }

        if (e.keyCode === 27) { // Escape
            e.preventDefault();
            e.stopPropagation();
            target.blur();
            this.state.editMode = false;
            setTimeout(() => this.elements.focusCatcher?.focus(), 0);
        } else if (e.keyCode === 13) { // Enter
            e.preventDefault();
            e.stopPropagation();
            target.blur();
            this.state.editMode = false;
            setTimeout(() => this.elements.focusCatcher?.focus(), 0);
        }
    }

    /**
     * Handle keyboard navigation
     */
    handleNavigation(e) {
        const selected = document.querySelector('.option.selected');
        if (!selected) return;

        switch (e.keyCode) {
            case 38: // ArrowUp
            case 40: // ArrowDown
                e.preventDefault();
                this.rebuildVisibleList();
                this.moveFocus(e.keyCode);
                break;

            case 37: // ArrowLeft
                if (selected.classList.contains('list-picker')) {
                    selected.querySelector('.controls .left')?.click();
                } else if (selected.classList.contains('range-input') || selected.classList.contains('number-input')) {
                    this.adjustValue(selected, e.keyCode);
                } else {
                    this.collapseFocused();
                }
                break;

            case 39: // ArrowRight
                if (selected.classList.contains('list-picker')) {
                    selected.querySelector('.controls .right')?.click();
                } else if (selected.classList.contains('range-input') || selected.classList.contains('number-input')) {
                    this.adjustValue(selected, e.keyCode);
                } else {
                    this.expandFocused();
                }
                break;

            case 13: // Enter
                if (selected.classList.contains('select-input')) {
                    e.preventDefault();
                    this.openDropdown(selected);
                } else if (selected.classList.contains('color-input')) {
                    e.preventDefault();
                    this.openColorPicker(selected);
                } else if (selected.classList.contains('radio-group')) {
                    e.preventDefault();
                    this.openRadioGroup(selected);
                } else if (selected.classList.contains('text-input') ||
                    selected.classList.contains('password-input') ||
                    selected.classList.contains('number-input') ||
                    selected.classList.contains('date-input')) {
                    this.state.editMode = true;
                    const input = selected.querySelector('input');
                    input?.focus();
                } else if (selected.classList.contains('range-input')) {
                    this.state.editMode = true;
                } else {
                    this.selectFocusedOption();
                }
                break;

            case 8: // Backspace
                const active = document.activeElement;
                if (active?.tagName === 'INPUT' || active?.tagName === 'TEXTAREA') {
                    return;
                }
                e.preventDefault();
                e.stopPropagation();
                this.sendEvent('CloseMenu', {});
                break;

            case 27: // Escape
                this.sendEvent('CloseMenu', {});
                break;
        }
    }

    /**
     * Handle navigation in edit mode
     */
    handleEditModeNavigation(e) {
        const selected = document.querySelector('.option.selected');
        if (!selected) return;

        switch (e.keyCode) {
            case 37: // ArrowLeft
            case 39: // ArrowRight
                this.adjustValue(selected, e.keyCode);
                break;

            case 8: // Backspace
                const activeEl = document.activeElement;
                if (activeEl?.tagName === 'INPUT' || activeEl?.tagName === 'TEXTAREA') {
                    return;
                }
                e.preventDefault();
                e.stopPropagation();
                this.state.editMode = false;
                break;

            case 27: // Escape
                this.state.editMode = false;
                break;

            case 13: // Enter
                this.state.editMode = false;
                this.selectFocusedOption();
                break;
        }
    }

    /**
     * Rebuild visible options list
     */
    rebuildVisibleList() {
        this.state.visibleElements = Array.from(document.querySelectorAll('.option:not(.hidden)'));
    }

    /**
     * Move focus up/down
     */
    moveFocus(keyCode) {
        const selected = document.querySelector('.option.selected');
        if (!selected) {
            this.selectFirstOption();
            return;
        }

        // Chiudi dropdown aperti quando ci si muove via
        if (this.state.dropdownOpen) {
            this.closeDropdown(selected);
            this.closeColorPicker(selected);
            this.closeRadioGroup(selected);
        }

        const currentIndex = this.state.visibleElements.indexOf(selected);
        let newIndex;

        if (keyCode === 38) { // Up
            newIndex = currentIndex > 0 ? currentIndex - 1 : currentIndex;
        } else { // Down
            newIndex = currentIndex < this.state.visibleElements.length - 1 ? currentIndex + 1 : currentIndex;
        }

        if (newIndex !== currentIndex) {
            document.querySelectorAll('.option').forEach(opt => opt.classList.remove('selected'));
            this.state.visibleElements[newIndex]?.classList.add('selected');
            this.scrollToSelected();
            this.updateCounter();
        }
    }

    /**
     * Scroll to selected option
     */
    scrollToSelected() {
        const selected = document.querySelector('.option.selected');
        selected?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    /**
     * Select first visible option
     */
    selectFirstOption() {
        const firstOption = document.querySelector('.option:not(.hidden)');
        firstOption?.classList.add('selected');
    }

    /**
     * Expand focused dropdown
     */
    expandFocused() {
        const selected = document.querySelector('.option.selected');
        if (selected?.classList.contains('dropdown')) {
            const content = selected.querySelector('.dropdown-content');
            content?.classList.remove('hidden');
            const arrow = selected.querySelector('.arrow');
            if (arrow) arrow.textContent = '▲';
            this.rebuildVisibleList();
        }
    }

    /**
     * Collapse focused dropdown
     */
    collapseFocused() {
        const selected = document.querySelector('.option.selected');
        if (selected?.classList.contains('dropdown')) {
            const content = selected.querySelector('.dropdown-content');
            content?.classList.add('hidden');
            const arrow = selected.querySelector('.arrow');
            if (arrow) arrow.textContent = '▼';
            this.rebuildVisibleList();
        }
    }

    /**
     * Select/activate focused option
     */
    selectFocusedOption() {
        const selected = document.querySelector('.option.selected');
        if (!selected) return;

        if (selected.classList.contains('action') || selected.classList.contains('checkbox')) {
            selected.click();
        } else if (selected.classList.contains('dropdown')) {
            this.expandFocused();
        } else if (selected.classList.contains('radio-group')) {
            const radio = selected.querySelector('input[type="radio"]');
            if (radio) {
                radio.checked = true;
                radio.dispatchEvent(new Event('change'));
            }
        } else if (selected.classList.contains('select-input')) {
            selected.querySelector('.custom-select')?.click();
        } else if (selected.classList.contains('list-picker')) {
            selected.querySelector('.controls .right')?.click();
        } else if (selected.classList.contains('color-input')) {
            selected.querySelector('.custom-color-picker')?.click();
        } else if (selected.classList.contains('date-input')) {
            selected.querySelector('input[type="date"]')?.focus();
        }
    }

    /**
     * Open select dropdown
     */
    openDropdown(option) {
        const dropdown = option.querySelector('.select-dropdown');
        const customSelect = option.querySelector('.custom-select');
        const options = dropdown?.querySelectorAll('.select-option');

        if (!dropdown || !options || options.length === 0) return;

        dropdown.classList.remove('hidden');
        customSelect?.classList.add('open');

        this.state.dropdownOpen = true;
        this.state.dropdownSelectedIndex = Array.from(options).findIndex(opt => opt.classList.contains('selected'));
        if (this.state.dropdownSelectedIndex === -1) this.state.dropdownSelectedIndex = 0;

        this.highlightDropdownOption(dropdown, this.state.dropdownSelectedIndex);
    }

    /**
     * Close select dropdown
     */
    closeDropdown(option) {
        const dropdown = option?.querySelector('.select-dropdown');
        const customSelect = option?.querySelector('.custom-select');

        dropdown?.classList.add('hidden');
        customSelect?.classList.remove('open');

        this.state.dropdownOpen = false;
        this.state.dropdownSelectedIndex = 0;
    }

    /**
     * Open color picker
     */
    openColorPicker(option) {
        const palette = option.querySelector('.color-palette');
        const customPicker = option.querySelector('.custom-color-picker');
        const colors = palette?.querySelectorAll('.preset-color');

        if (!palette || !colors || colors.length === 0) return;

        palette.classList.remove('hidden');
        customPicker?.classList.add('open');

        this.state.dropdownOpen = true;
        this.state.colorPickerSelectedIndex = 0;

        this.highlightColorOption(palette, this.state.colorPickerSelectedIndex);
    }

    /**
     * Close color picker
     */
    closeColorPicker(option) {
        const palette = option?.querySelector('.color-palette');
        const customPicker = option?.querySelector('.custom-color-picker');

        palette?.classList.add('hidden');
        customPicker?.classList.remove('open');

        this.state.dropdownOpen = false;
        this.state.colorPickerSelectedIndex = 0;
    }

    /**
     * Highlight color option
     */
    highlightColorOption(palette, index) {
        const colors = palette.querySelectorAll('.preset-color');
        colors.forEach((color, i) => {
            if (i === index) {
                color.style.borderColor = '#ffffff';
                color.style.transform = 'scale(1.1)';
            } else {
                color.style.borderColor = '';
                color.style.transform = '';
            }
        });
    }

    /**
     * Open radio group navigation
     */
    openRadioGroup(option) {
        const labels = option.querySelectorAll('label');
        const radios = option.querySelectorAll('input[type="radio"]');

        if (!labels || labels.length === 0) return;

        this.state.dropdownOpen = true;

        // Trova l'indice del radio attualmente selezionato
        this.state.radioGroupSelectedIndex = 0;
        radios.forEach((radio, i) => {
            if (radio.checked) {
                this.state.radioGroupSelectedIndex = i;
            }
        });

        this.highlightRadioOption(option, this.state.radioGroupSelectedIndex);
    }

    /**
     * Close radio group navigation
     */
    closeRadioGroup(option) {
        const labels = option?.querySelectorAll('label');
        labels?.forEach(label => {
            label.style.background = '';
        });

        this.state.dropdownOpen = false;
        this.state.radioGroupSelectedIndex = 0;
    }

    /**
     * Highlight radio option
     */
    highlightRadioOption(option, index) {
        const labels = option.querySelectorAll('label');
        labels.forEach((label, i) => {
            if (i === index) {
                label.style.background = '#252525';
            } else {
                label.style.background = '';
            }
        });
    }

    /**
     * Highlight dropdown option
     */
    highlightDropdownOption(dropdown, index) {
        const options = dropdown.querySelectorAll('.select-option');
        options.forEach((opt, i) => {
            if (i === index) {
                opt.style.background = '#252525';
            } else {
                opt.style.background = '';
            }
        });
    }

    /**
     * Handle dropdown navigation
     */
    handleDropdownNavigation(e) {
        const selected = document.querySelector('.option.selected');
        if (!selected) return;

        const dropdown = selected.querySelector('.select-dropdown');
        const palette = selected.querySelector('.color-palette');

        if (dropdown && !dropdown.classList.contains('hidden')) {
            const options = dropdown.querySelectorAll('.select-option');

            switch (e.keyCode) {
                case 38: // ArrowUp
                    e.preventDefault();
                    if (this.state.dropdownSelectedIndex > 0) {
                        this.state.dropdownSelectedIndex--;
                        this.highlightDropdownOption(dropdown, this.state.dropdownSelectedIndex);
                    }
                    break;

                case 40: // ArrowDown
                    e.preventDefault();
                    if (this.state.dropdownSelectedIndex < options.length - 1) {
                        this.state.dropdownSelectedIndex++;
                        this.highlightDropdownOption(dropdown, this.state.dropdownSelectedIndex);
                    }
                    break;

                case 13: // Enter
                    e.preventDefault();
                    if (options[this.state.dropdownSelectedIndex]) {
                        options[this.state.dropdownSelectedIndex].click();
                    }
                    this.closeDropdown(selected);
                    break;

                case 27: // Escape
                    e.preventDefault();
                    this.closeDropdown(selected);
                    break;
            }
        } else if (palette && !palette.classList.contains('hidden')) {
            const colors = palette.querySelectorAll('.preset-color');
            const columnsCount = 10; // grid-template-columns: repeat(10, 1fr)

            switch (e.keyCode) {
                case 37: // ArrowLeft
                    e.preventDefault();
                    if (this.state.colorPickerSelectedIndex > 0) {
                        this.state.colorPickerSelectedIndex--;
                        this.highlightColorOption(palette, this.state.colorPickerSelectedIndex);
                    }
                    break;

                case 39: // ArrowRight
                    e.preventDefault();
                    if (this.state.colorPickerSelectedIndex < colors.length - 1) {
                        this.state.colorPickerSelectedIndex++;
                        this.highlightColorOption(palette, this.state.colorPickerSelectedIndex);
                    }
                    break;

                case 38: // ArrowUp
                    e.preventDefault();
                    if (this.state.colorPickerSelectedIndex >= columnsCount) {
                        this.state.colorPickerSelectedIndex -= columnsCount;
                        this.highlightColorOption(palette, this.state.colorPickerSelectedIndex);
                    }
                    break;

                case 40: // ArrowDown
                    e.preventDefault();
                    if (this.state.colorPickerSelectedIndex + columnsCount < colors.length) {
                        this.state.colorPickerSelectedIndex += columnsCount;
                        this.highlightColorOption(palette, this.state.colorPickerSelectedIndex);
                    }
                    break;

                case 13: // Enter
                    e.preventDefault();
                    if (colors[this.state.colorPickerSelectedIndex]) {
                        colors[this.state.colorPickerSelectedIndex].click();
                    }
                    this.closeColorPicker(selected);
                    break;

                case 27: // Escape
                    e.preventDefault();
                    this.closeColorPicker(selected);
                    break;
            }
        } else if (selected.classList.contains('radio-group')) {
            const labels = selected.querySelectorAll('label');
            const radios = selected.querySelectorAll('input[type="radio"]');

            switch (e.keyCode) {
                case 38: // ArrowUp
                    e.preventDefault();
                    if (this.state.radioGroupSelectedIndex > 0) {
                        this.state.radioGroupSelectedIndex--;
                        this.highlightRadioOption(selected, this.state.radioGroupSelectedIndex);
                    }
                    break;

                case 40: // ArrowDown
                    e.preventDefault();
                    if (this.state.radioGroupSelectedIndex < labels.length - 1) {
                        this.state.radioGroupSelectedIndex++;
                        this.highlightRadioOption(selected, this.state.radioGroupSelectedIndex);
                    }
                    break;

                case 13: // Enter
                    e.preventDefault();
                    if (radios[this.state.radioGroupSelectedIndex]) {
                        radios[this.state.radioGroupSelectedIndex].checked = true;
                        radios[this.state.radioGroupSelectedIndex].dispatchEvent(new Event('change'));
                    }
                    this.closeRadioGroup(selected);
                    break;

                case 27: // Escape
                    e.preventDefault();
                    this.closeRadioGroup(selected);
                    break;
            }
        }
    }

    /**
     * Update option counter display
     */
    updateCounter() {
        const allOptions = document.querySelectorAll('.option:not(.hidden)');
        const selected = document.querySelector('.option.selected');

        if (allOptions.length > 0 && selected && this.elements.optionsCounter) {
            const currentIndex = Array.from(allOptions).indexOf(selected) + 1;
            const total = allOptions.length;
            this.elements.optionsCounter.textContent = `${currentIndex}/${total}`;
        }
    }

    /**
     * Adjust range/number input value with arrow keys
     */
    adjustValue(option, keyCode) {
        if (option.classList.contains('range-input')) {
            const input = option.querySelector('input[type="range"]');
            if (!input) return;

            const step = parseFloat(input.step) || 1;
            const current = parseFloat(input.value);
            const min = parseFloat(input.min);
            const max = parseFloat(input.max);

            const newValue = keyCode === 37
                ? Math.max(min, current - step)
                : Math.min(max, current + step);

            input.value = newValue;
            input.dispatchEvent(new Event('input'));
        } else if (option.classList.contains('number-input')) {
            const input = option.querySelector('input[type="number"]');
            if (!input) return;

            const current = parseFloat(input.value) || 0;
            const newValue = keyCode === 37 ? current - 1 : current + 1;

            input.value = newValue;
            input.dispatchEvent(new Event('change'));
        }
    }
}

// Initialize context menu
const contextMenu = new ContextMenu();
