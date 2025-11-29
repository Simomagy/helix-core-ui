/**
 * HELIX Progress Bar System
 */
class ProgressBarSystem {
    constructor() {
        this.bars = new Map();
        this.templates = {
            helix: document.getElementById('template-helix'),
            horizontal: document.getElementById('template-horizontal')
        };

        this.containers = {
            'center': document.getElementById('pb-container-center'),

            'top-left': document.getElementById('pb-container-top-left'),

            'top-center': document.getElementById('pb-container-top-center'),

            'top-right': document.getElementById('pb-container-top-right'),

            'center-left': document.getElementById('pb-container-center-left'),

            'center-right': document.getElementById('pb-container-center-right'),

            'bottom-left': document.getElementById('pb-container-bottom-left'),

            'bottom-right': document.getElementById('pb-container-bottom-right'),

            'bottom-center': document.getElementById('pb-container-bottom-center'),
        };

        this.init();
    }

    init() {
        window.addEventListener('message', (event) => this.handleMessage(event));

        // Notify ready
        setTimeout(() => {
            this.sendEvent('Ready', {});
        }, 100);
    }

    handleMessage(event) {
        const data = event.data;
        const action = data.name || data.action;
        const args = data.args?.[0] || data;

        switch(action) {
            case 'AddProgressBar':
                this.addProgressBar(args);
                break;
            case 'RemoveProgressBar':
                this.removeProgressBar(args);
                break;
            case 'UpdateProgress':
                this.updateProgress(args);
                break;
            case 'CompleteProgressBar':
                this.completeProgressBar(args);
                break;
            case 'ClearAll':
                this.clearAll();
                break;
        }
    }

    addProgressBar(data) {
        if (!data || !data.id) return;
        if (this.bars.has(data.id)) this.removeProgressBar(data);

        const style = data.style || 'helix';
        const template = this.templates[style] || this.templates.helix;
        const container = this.containers[data.position] || this.containers['bottom-center'];

        const element = template.cloneNode(true);
        element.id = `pb-${data.id}`;
        element.style.display = 'flex'; // or block depending on style
        if(style === 'horizontal') element.style.display = 'block';

        // Setup content
        const textEl = element.querySelector('.pb-text');
        if (textEl) textEl.textContent = data.text || 'PROCESSING';

        container.appendChild(element);

        if (style === 'helix') {
            this.adjustHelixDimensions(element);
        }

        this.bars.set(data.id, {
            element: element,
            style: style
        });

        // Show animation
        requestAnimationFrame(() => {
            element.classList.add('show');
        });
    }

    adjustHelixDimensions(element) {
        const innerContainer = element.querySelector('.pb-container-inner');
        const svg = element.querySelector('.pb-border');
        const path = element.querySelector('.pb-path');
        const textEl = element.querySelector('.pb-text');

        if (innerContainer && svg && path && textEl) {
            // Calculate width based on text content
            const text = textEl.textContent || '';
            // Approx char width (avg) + padding
            // Base padding: 40px (20px left/right)
            // Min width: 120px
            // Char width estimate: 9px (font-size 12px, uppercase, tomorrow font)

            const charWidth = 9;
            const basePadding = 50; // Extra space for layout
            const estimatedWidth = Math.max(120, (text.length * charWidth) + basePadding);
            const height = 44; // Fixed height from CSS (padding + line-height approx)

            // Set inner container width explicitly
            innerContainer.style.width = `${estimatedWidth}px`;

            // SVG dimensions
            const svgWidth = estimatedWidth + 6; // +4px per side border
            const svgHeight = height + 8; // +4px top/bottom border

            svg.style.width = `${svgWidth}px`;
            svg.style.height = `${svgHeight}px`;
            svg.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight}`);

            const clipOffset = 8;
            // Draw path
            const newPath = `M 2 2 L ${svgWidth - 2} 2 L ${svgWidth - 2} ${svgHeight - clipOffset - 2} L ${svgWidth - clipOffset - 2} ${svgHeight - 2} L 2 ${svgHeight - 2} Z`;

            path.setAttribute('d', newPath);

            const pathLength = path.getTotalLength();
            path.style.strokeDasharray = `0 ${pathLength}`;
            path.setAttribute('pathLength', pathLength);
        }
    }

    updateProgress(data) {
        const bar = this.bars.get(data.id);
        if (!bar) return;

        const progress = Math.max(0, Math.min(100, data.progress));
        const pctText = Math.floor(progress) + '%';

        // Update percentage text
        const pctEl = bar.element.querySelector('.pb-percentage');
        if (pctEl) pctEl.textContent = pctText;

        if (bar.style === 'helix') {
            // Update border stroke
            const path = bar.element.querySelector('.pb-path');
            if (path) {
                const pathLength = path.getTotalLength();
                // Calculate dash offset to "fill" the border
                const dashValue = (progress / 100) * pathLength;
                path.style.strokeDasharray = `${dashValue} ${pathLength}`;
            }
        } else {
            // Update horizontal fill
            const fill = bar.element.querySelector('.pb-fill');
            if (fill) {
                fill.style.width = `${progress}%`;
            }
        }

        // Handle completion automatically if 100%
        if (progress >= 100) {
            this.completeProgressBar({ id: data.id });
        }
    }

    completeProgressBar(data) {
        const bar = this.bars.get(data.id);
        if (!bar) return;

        // Avoid re-triggering if already marked
        if (bar.element.classList.contains('completed')) return;

        bar.element.classList.add('completed');
        // Ensure visual state is 100%
        this.updateProgress({ id: data.id, progress: 100 });

		// Remove after a short delay (handled by UI usually, but we clean up data)
        setTimeout(() => {
            this.removeProgressBar({ id: data.id });
        }, 500);
    }

    removeProgressBar(data) {
        const bar = this.bars.get(data.id);
        if (!bar) return;

        bar.element.classList.remove('show');

        // Clear timer if any
        if (bar.removeTimeout) clearTimeout(bar.removeTimeout);

        bar.removeTimeout = setTimeout(() => {
            bar.element.remove();
            this.bars.delete(data.id);
        }, 300);
    }

    clearAll() {
        this.bars.forEach((bar, id) => {
            this.removeProgressBar({ id: id });
        });
    }

    sendEvent(name, data) {
        if (typeof hEvent === 'function') {
            hEvent(name, data);
        }
    }
}

const progressBarSystem = new ProgressBarSystem();

