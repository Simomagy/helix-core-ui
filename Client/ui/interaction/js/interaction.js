/**
 * HELIX Interaction System
 * Manages dynamic interaction prompts with progress circles
 */
class InteractionSystem {
    constructor() {
        this.interactions = new Map();
        this.containerVisible = false;

        this.elements = {
            container: document.getElementById('interactions-container'),
            template: document.getElementById('interaction-template')
        };

        this.init();
    }

    /**
     * Initialize the system
     */
    init() {
        window.addEventListener('message', (event) => this.handleMessage(event));

        // Notify ready
        setTimeout(() => {
            this.sendEvent('Ready', {});
        }, 100);
    }

    /**
     * Handle incoming messages
     */
    handleMessage(event) {
        const data = event.data;
        const action = data.name || data.action;
        const args = data.args?.[0];

        const actions = {
            'AddInteraction': () => this.addInteraction(args),
            'RemoveInteraction': () => this.removeInteraction(args),
            'StartProgress': () => this.startProgress(args),
            'UpdateProgress': () => this.updateProgress(args),
            'ResetProgress': () => this.resetProgress(args),
            'ClearAll': () => this.clearAll()
        };

        if (actions[action]) {
            actions[action]();
        }
    }

    /**
     * Show container
     */
    showContainer() {
        if (this.containerVisible) return;
        this.elements.container?.classList.remove('hidden');
        this.containerVisible = true;
    }

    /**
     * Hide container
     */
    hideContainer() {
        if (!this.containerVisible) return;
        this.elements.container?.classList.add('hidden');
        this.containerVisible = false;
    }

    /**
     * Check visibility and hide if no interactions
     */
    checkVisibility() {
        const visibleInteractions = this.elements.container?.querySelectorAll('.interaction-item.show');

        if (!visibleInteractions || visibleInteractions.length === 0) {
            this.hideContainer();
            this.sendEvent('AllInteractionsClosed', {});
        }
    }

    /**
     * Add new interaction
     */
    addInteraction(data) {
        if (!data || !data.id) return;

        // Clone template
        const element = this.elements.template.cloneNode(true);
        element.id = `interaction-${data.id}`;
        element.classList.add('visible');
        element.style.display = 'flex';

        // Set text and key
        const textElement = element.querySelector('.interaction-text');
        const keyElement = element.querySelector('.key-text');

        if (textElement) textElement.textContent = (data.text || 'INTERACTION').toUpperCase();
        if (keyElement) keyElement.textContent = (data.key || 'E').toUpperCase();

        // Append to container (temporarily hidden to measure)
        element.style.visibility = 'hidden';
        this.elements.container?.appendChild(element);

        // Measure and adjust SVG to key-container size
        const keyContainer = element.querySelector('.key-container');
        const svg = element.querySelector('.progress-border');
        const path = element.querySelector('.progress-path');

        if (keyContainer && svg && path) {
            const rect = keyContainer.getBoundingClientRect();
            const width = rect.width;
            const height = rect.height;

            // Add padding around the key (4px on each side)
            const svgWidth = width + 10;
            const svgHeight = height + 10;

            // Update SVG dimensions
            svg.style.width = `${svgWidth}px`;
            svg.style.height = `${svgHeight}px`;
            svg.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight}`);

            // Calculate clip offset (8px from bottom-right corner)
            const clipOffset = 8;

            // Update path to match new dimensions
            const newPath = `M 2 2 L ${svgWidth - 2} 2 L ${svgWidth - 2} ${svgHeight - clipOffset - 2} L ${svgWidth - clipOffset - 2} ${svgHeight - 2} L 2 ${svgHeight - 2} Z`;
            path.setAttribute('d', newPath);
        }

        // Make visible again
        element.style.visibility = 'visible';

        // Store reference
        this.interactions.set(data.id, {
            element: element,
            duration: data.duration || 0
        });

        // Show container
        this.showContainer();

        // Trigger show animation
        setTimeout(() => {
            element.classList.add('show');
        }, 50);
    }

    /**
     * Remove interaction
     */
    removeInteraction(data) {
        if (!data || !data.id) return;

        const interaction = this.interactions.get(data.id);
        if (!interaction) return;

        // Hide animation
        interaction.element.classList.remove('show');

        // Remove after animation
        setTimeout(() => {
            interaction.element.remove();
            this.interactions.delete(data.id);
            this.checkVisibility();
        }, 300);
    }

    /**
     * Start progress animation
     */
    startProgress(data) {
        if (!data || !data.id) return;

        const interaction = this.interactions.get(data.id);
        if (!interaction) return;

        interaction.element.classList.add('pressing');
    }

    /**
     * Update progress
     */
    updateProgress(data) {
        if (!data || !data.id) return;

        const interaction = this.interactions.get(data.id);
        if (!interaction) return;

        const progressPath = interaction.element.querySelector('.progress-path');
        if (!progressPath) return;

        const progress = Math.max(0, Math.min(100, data.progress || 0));
        const dashValue = (progress / 100) * 1000;

        progressPath.style.strokeDasharray = `${dashValue} 1000`;
    }

    /**
     * Reset progress
     */
    resetProgress(data) {
        if (!data || !data.id) return;

        const interaction = this.interactions.get(data.id);
        if (!interaction) return;

        interaction.element.classList.remove('pressing');

        const progressPath = interaction.element.querySelector('.progress-path');
        if (!progressPath) return;

        progressPath.style.strokeDasharray = '0 1000';
        progressPath.style.transition = 'stroke-dasharray 0.3s ease-out';
    }

    /**
     * Clear all interactions
     */
    clearAll() {
        this.interactions.forEach((interaction) => {
            interaction.element.classList.remove('show');
            setTimeout(() => {
                interaction.element.remove();
            }, 300);
        });

        this.interactions.clear();
        this.hideContainer();
    }

    /**
     * Send event to Lua
     */
    sendEvent(eventName, data) {
        if (typeof hEvent === 'function') {
            hEvent(eventName, data);
        }
    }

    /**
     * Sanitize HTML to prevent XSS
     */
    sanitizeHTML(str) {
        const temp = document.createElement('div');
        temp.textContent = str;
        return temp.innerHTML;
    }
}

// Initialize interaction system
const interactionSystem = new InteractionSystem();
