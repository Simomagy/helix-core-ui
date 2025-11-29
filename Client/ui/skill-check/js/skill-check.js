/**
 * HELIX Skill Check System
 */
class SkillCheckSystem {
    constructor() {
        this.checks = new Map();
        this.template = document.getElementById('template-skill-check');
        this.container = document.getElementById('sc-container');
        this.animationFrameId = null;

        this.init();
    }

    init() {
        window.addEventListener('message', (event) => this.handleMessage(event));

        // Notify ready
        setTimeout(() => {
            this.sendEvent('Ready', {});
        }, 100);

        // Start global animation loop
        this.animate();
    }

    handleMessage(event) {
        const data = event.data;
        const action = data.name || data.action;
        const args = data.args?.[0] || data;

        switch(action) {
            case 'AddSkillCheck':
                this.addSkillCheck(args);
                break;
            case 'RemoveSkillCheck':
                this.removeSkillCheck(args);
                break;
            case 'CheckKeyPress':
                this.checkInput(args.id);
                break;
            case 'ClearAll':
                this.clearAll();
                break;
        }
    }

    addSkillCheck(data) {
        if (!data || !data.id) return;
        if (this.checks.has(data.id)) this.removeSkillCheck(data);

        const element = this.template.cloneNode(true);
        element.id = `sc-${data.id}`;
        element.style.display = 'block';

        // Setup key
        const keyEl = element.querySelector('.key-name');
        if (keyEl) keyEl.textContent = (data.key || 'E').toUpperCase();

        console.log("Key: " + data.key);

        // Setup retries
        const retriesContainer = element.querySelector('.sc-retries');
        retriesContainer.innerHTML = '';
        const maxRetries = data.retries || 3;
        for(let i=0; i<maxRetries; i++) {
            const dot = document.createElement('div');
            dot.className = 'sc-retry-dot';
            retriesContainer.appendChild(dot);
        }

        this.container.appendChild(element);

        // Config
        const difficulty = data.difficulty || 1;
        const speed = 1 + (difficulty * 0.5); // Base speed multiplier

        const zoneWidth = this.calculateZoneSize(difficulty);

        this.checks.set(data.id, {
            element: element,
            id: data.id,
            difficulty: difficulty,
            speed: speed,
            cursorPos: 0,
            direction: 1, // 1 = right, -1 = left
            zoneStart: 0,
            zoneWidth: zoneWidth, // percentage
            retriesLeft: maxRetries,
            totalRetries: maxRetries,
            completed: false
        });

        // Initialize first zone
        this.randomizeZone(data.id);

        // Show
        requestAnimationFrame(() => {
            element.classList.add('show');
        });
    }

    calculateZoneSize(difficulty) {
        switch(difficulty) {
            case 1:
                return 20;
            case 2:
                return 15;
            case 3:
                return 10;
            default:
                return 20;
        }
    }

    randomizeZone(id) {
        const check = this.checks.get(id);
        if (!check) return;

        // Random position between 10% and (90% - width)
        const min = 10;
        const max = 90 - check.zoneWidth;
        check.zoneStart = Math.floor(Math.random() * (max - min + 1)) + min;

        const zoneEl = check.element.querySelector('.sc-zone');
        if (zoneEl) {
            zoneEl.style.left = `${check.zoneStart}%`;
            zoneEl.style.width = `${check.zoneWidth}%`;
        }
    }

    animate() {
        this.checks.forEach((check) => {
            if (check.completed) return;

            // Move cursor
            check.cursorPos += check.speed * check.direction;

            // Bounce logic
            if (check.cursorPos >= 100) {
                check.cursorPos = 100;
                check.direction = -1;
            } else if (check.cursorPos <= 0) {
                check.cursorPos = 0;
                check.direction = 1;
            }

            // Update DOM
            const cursorEl = check.element.querySelector('.sc-cursor');
            if (cursorEl) {
                cursorEl.style.left = `${check.cursorPos}%`;
            }
        });

        this.animationFrameId = requestAnimationFrame(() => this.animate());
    }

    checkInput(id) {
        const check = this.checks.get(id);
        if (!check || check.completed) return;

        const pos = check.cursorPos;
        const zoneEnd = check.zoneStart + check.zoneWidth;

        if (pos >= check.zoneStart && pos <= zoneEnd) {
            // Success
            this.handleSuccess(check);
        } else {
            // Fail
            this.handleFail(check);
        }
    }

    handleSuccess(check) {
        check.completed = true;
        check.element.classList.add('success');

        const feedback = check.element.querySelector('.sc-feedback');
        if (feedback) feedback.textContent = 'SUCCESS';

        setTimeout(() => {
            this.sendEvent('SkillCheckSuccess', { id: check.id });
            // Visual removal is handled by Lua calling remove, or we can do it here too for responsiveness
        }, 500);
    }

    handleFail(check) {
        check.retriesLeft--;

        // Update dots
        const feedback = check.element.querySelector('.sc-feedback');
        const dots = check.element.querySelectorAll('.sc-retry-dot');
        const failedIndex = check.totalRetries - check.retriesLeft - 1;
        if (dots[failedIndex]) {
            dots[failedIndex].classList.add('active');
        }

        check.element.classList.add('shake');

        if (feedback) feedback.textContent = 'TRY AGAIN';
        setTimeout(() => check.element.classList.remove('shake'), 400);

        if (check.retriesLeft <= 0) {
            check.completed = true;
            if (feedback) feedback.textContent = 'FAILED';

            setTimeout(() => {
                this.sendEvent('SkillCheckFail', { id: check.id });
            }, 500);
        } else {
            // Reset zone for next try
            this.randomizeZone(check.id);
            // Speed up slightly
            check.speed *= 1.1;
        }
    }

    removeSkillCheck(data) {
        const check = this.checks.get(data.id);
        if (!check) return;

        check.element.classList.remove('show');

        setTimeout(() => {
            check.element.remove();
            this.checks.delete(data.id);
        }, 300);
    }

    clearAll() {
        this.checks.forEach((check, id) => {
            this.removeSkillCheck({ id: id });
        });
    }

    sendEvent(name, data) {
        if (typeof hEvent === 'function') {
            hEvent(name, data);
        }
    }
}

const skillCheckSystem = new SkillCheckSystem();

