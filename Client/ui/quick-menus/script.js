/**
 * HELIX Quick Menu System
 * Manages input and confirmation dialogs
 */
class QuickMenuSystem {
    constructor() {
        this.elements = {
            inputMenu: document.querySelector('.input-menu'),
            confirmMenu: document.querySelector('.confirm-menu'),
            inputField: document.querySelector('.input-menu input'),
            inputTitle: document.querySelector('.input-menu .title'),
            confirmTitle: document.querySelector('.confirm-menu .title'),
            confirmMessage: document.querySelector('.confirm-menu .message')
        };

        this.state = {
            isInputOpen: false,
            isConfirmOpen: false
        };

        this.init();
    }

    init() {
        this.setupEventListeners();

        // Listen for game messages
        window.addEventListener('message', (event) => this.handleMessage(event));

        // Notify ready
        setTimeout(() => {
            this.sendEvent('Ready', {});
        }, 100);
    }

    setupEventListeners() {
        // === INPUT MENU ===
        const inputConfirmBtn = this.elements.inputMenu.querySelector('.confirm');
        const inputCancelBtn = this.elements.inputMenu.querySelector('.cancel');

        inputConfirmBtn.addEventListener('click', () => this.submitInput());
        inputCancelBtn.addEventListener('click', () => this.cancelInput());

        this.elements.inputField.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.submitInput();
        });

        // === CONFIRM MENU ===
        const confirmYesBtn = this.elements.confirmMenu.querySelector('.confirm');
        const confirmNoBtn = this.elements.confirmMenu.querySelector('.cancel');

        confirmYesBtn.addEventListener('click', () => this.confirmYes());
        confirmNoBtn.addEventListener('click', () => this.confirmNo());

        // === GLOBAL KEYS ===
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (this.state.isInputOpen) this.cancelInput();
                if (this.state.isConfirmOpen) this.confirmNo();
            }
        });
    }

    handleMessage(event) {
        const data = event.data;
        const action = data.name || data.action;
        const args = data.args?.[0];

        const actions = {
            'ShowInputMenu': () => this.showInputMenu(args),
            'HideInputMenu': () => this.hideInputMenu(),
            'ShowConfirmMenu': () => this.showConfirmMenu(args),
            'HideConfirmMenu': () => this.hideConfirmMenu()
        };

        if (actions[action]) {
            actions[action]();
        }
    }

    // === INPUT MENU METHODS ===

    showInputMenu(data) {
        if (!data) return;

        this.elements.inputTitle.textContent = data.title || 'ENTER VALUE';
        this.elements.inputField.placeholder = data.placeholder || '';
        this.elements.inputField.value = '';
        this.elements.inputField.type = data.type || 'text';

        document.body.classList.add('in-input-menu');
        this.state.isInputOpen = true;

        // Focus input
        setTimeout(() => {
            this.elements.inputField.focus();
        }, 50);
    }

    hideInputMenu() {
        document.body.classList.remove('in-input-menu');
        this.state.isInputOpen = false;
        this.elements.inputField.blur();
    }

    submitInput() {
        const value = this.elements.inputField.value;
        this.sendEvent('OnInputConfirmed', { value: value });
        // Note: We usually wait for server response to close, but we can close immediately if preferred
        // or wait for HideInputMenu event
    }

    cancelInput() {
        this.sendEvent('OnInputCanceled', {});
        this.hideInputMenu();
    }

    // === CONFIRM MENU METHODS ===

    showConfirmMenu(data) {
        if (!data) return;

        this.elements.confirmTitle.textContent = data.title || 'CONFIRM';
        this.elements.confirmMessage.textContent = data.message || 'Are you sure?';

        document.body.classList.add('in-confirm-menu');
        this.state.isConfirmOpen = true;
    }

    hideConfirmMenu() {
        document.body.classList.remove('in-confirm-menu');
        this.state.isConfirmOpen = false;
    }

    confirmYes() {
        this.sendEvent('OnConfirmYes', {});
        // Typically wait for server or explicit hide command
    }

    confirmNo() {
        this.sendEvent('OnConfirmNo', {});
        this.hideConfirmMenu();
    }

    // === HELPERS ===

    sendEvent(eventName, data) {
        if (typeof hEvent === 'function') {
            hEvent(eventName, data);
        } else {
            console.log(`[Mock hEvent] ${eventName}`, data);
        }
    }
}

// Initialize
const quickMenuSystem = new QuickMenuSystem();
