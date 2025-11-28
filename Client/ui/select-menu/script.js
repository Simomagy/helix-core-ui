/**
 * HELIX Select Menu System
 * Manages the gamemode/map selection interface
 */
class SelectMenuSystem {
    constructor() {
        this.state = {
            options: [],
            currentPage: 0,
            itemsPerPage: 3,
            selectedOptionId: null
        };

        this.elements = {
            container: document.querySelector('.configurable-menu'),
            optionsScroller: document.querySelector('.scroller'),
            pagination: document.querySelector('.pagination'),
            slideLeft: document.querySelector('.slide-btn.left'),
            slideRight: document.querySelector('.slide-btn.right'),

            headerTitle: document.querySelector('header h1'),
            headerCount: document.querySelector('.players-count .value'),

            detailsName: document.querySelector('.details-panel .option-name'),
            detailsDesc: document.querySelector('.details-panel .option-description'),
            detailsStats: document.querySelector('.details-panel .stats-list'),

            btnSelect: document.querySelector('.action-btn.select'),
            btnReturn: document.querySelector('.action-btn.return')
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
        this.elements.slideLeft.addEventListener('click', () => this.prevPage());
        this.elements.slideRight.addEventListener('click', () => this.nextPage());

        this.elements.btnSelect.addEventListener('click', () => this.confirmSelection());
        this.elements.btnReturn.addEventListener('click', () => this.closeMenu());

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (document.body.classList.contains('hidden')) return;

            if (e.key === 'ArrowLeft') this.prevPage();
            if (e.key === 'ArrowRight') this.nextPage();
            if (e.key === 'Enter') this.confirmSelection();
            if (e.key === 'Escape') this.closeMenu();
        });
    }

    handleMessage(event) {
        const data = event.data;
        const action = data.name || data.action;
        const args = data.args?.[0];

        const actions = {
            'ShowMenu': () => this.showMenu(),
            'HideMenu': () => this.hideMenu(),
            'SetMenuTitle': () => this.setTitle(args?.title),
            'SetPlayersCount': () => this.setPlayersCount(args?.count),
            'ClearOptions': () => this.clearOptions(),
            'AddOption': () => this.addOption(args),
            'BuildMenu': () => this.renderMenu()
        };

        if (actions[action]) {
            actions[action]();
        }
    }

    // === ACTIONS ===

    showMenu() {
        document.body.classList.remove('hidden');
    }

    hideMenu() {
        document.body.classList.add('hidden');
    }

    closeMenu() {
        this.sendEvent('OnReturn', {});
        this.hideMenu();
    }

    setTitle(title) {
        if (title) this.elements.headerTitle.textContent = title;
    }

    setPlayersCount(count) {
        if (count) this.elements.headerCount.textContent = count;
    }

    clearOptions() {
        this.state.options = [];
        this.state.currentPage = 0;
        this.state.selectedOptionId = null;
        this.elements.optionsScroller.innerHTML = '';
        this.elements.pagination.innerHTML = '';
        this.updateDetails(null);
    }

    addOption(data) {
        if (!data || !data.id) return;
        // Check if exists
        const exists = this.state.options.find(o => o.id === data.id);
        if (!exists) {
            this.state.options.push(data);
        }
    }

    renderMenu() {
        this.elements.optionsScroller.innerHTML = '';

        this.state.options.forEach((option, index) => {
            const el = document.createElement('div');
            el.className = 'option';
            el.dataset.id = option.id;
            el.onclick = () => this.selectOption(option.id);

            const inner = document.createElement('div');
            inner.className = 'option-inner';

            const img = document.createElement('img');
            img.className = 'bg';
            img.src = option.image || '';
            img.alt = option.name;

            const name = document.createElement('p');
            name.className = 'name';
            name.textContent = option.name;

            inner.appendChild(img);
            inner.appendChild(name);
            el.appendChild(inner);

            this.elements.optionsScroller.appendChild(el);
        });

        // Select first if available
        if (this.state.options.length > 0) {
            this.selectOption(this.state.options[0].id);
        } else {
            this.updateDetails(null);
        }

        this.updatePagination();
    }

    selectOption(id) {
        this.state.selectedOptionId = id;

        // Update UI selection
        const allOptions = this.elements.optionsScroller.querySelectorAll('.option');
        allOptions.forEach(el => {
            if (el.dataset.id === id) el.classList.add('selected');
            else el.classList.remove('selected');
        });

        // Update details
        const option = this.state.options.find(o => o.id === id);
        this.updateDetails(option);

        this.sendEvent('OnOptionSelected', { optionId: id });
    }

    updateDetails(option) {
        if (!option) {
            this.elements.detailsName.textContent = 'Select an Option';
            this.elements.detailsDesc.textContent = '';
            this.elements.detailsStats.innerHTML = '';
            return;
        }

        this.elements.detailsName.textContent = option.name;
        this.elements.detailsDesc.textContent = option.description || '';

        this.elements.detailsStats.innerHTML = '';
        if (option.info && Array.isArray(option.info)) {
            option.info.forEach(stat => {
                const el = document.createElement('div');
                el.className = 'stat-item';
                el.innerHTML = `
                    <span class="label">${stat.name}</span>
                    <span class="value">${stat.value}</span>
                `;
                this.elements.detailsStats.appendChild(el);
            });
        }
    }

    confirmSelection() {
        if (this.state.selectedOptionId) {
            this.sendEvent('OnConfirm', { optionId: this.state.selectedOptionId });
        }
    }

    // === SLIDER LOGIC ===

    updatePagination() {
        const totalPages = Math.ceil(this.state.options.length / this.state.itemsPerPage);
        this.elements.pagination.innerHTML = '';

        if (totalPages <= 1) {
            this.elements.slideLeft.classList.add('disabled');
            this.elements.slideRight.classList.add('disabled');
            return;
        }

        // Create dots
        for (let i = 0; i < totalPages; i++) {
            const dot = document.createElement('div');
            dot.className = `dot ${i === this.state.currentPage ? 'active' : ''}`;
            this.elements.pagination.appendChild(dot);
        }

        // Update buttons
        this.elements.slideLeft.classList.toggle('disabled', this.state.currentPage === 0);
        this.elements.slideRight.classList.toggle('disabled', this.state.currentPage === totalPages - 1);
    }

    prevPage() {
        if (this.state.currentPage > 0) {
            this.state.currentPage--;
            this.scrollToPage();
        }
    }

    nextPage() {
        const totalPages = Math.ceil(this.state.options.length / this.state.itemsPerPage);
        if (this.state.currentPage < totalPages - 1) {
            this.state.currentPage++;
            this.scrollToPage();
        }
    }

    scrollToPage() {
        const translateValue = -(this.state.currentPage * 100); // 100% width shift
        this.elements.optionsScroller.style.transform = `translateX(${translateValue}%)`;
        this.updatePagination();
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
const selectMenuSystem = new SelectMenuSystem();
