class NotificationSystem {
    constructor() {
        this.notifications = {};
        this.container = document.getElementById('notification-container');
        this.template = document.getElementById('notification-template');
        this.zIndex = 1000;
        this.containerVisible = false;

        this.icons = {
            success: `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>`,
            error: `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/></svg>`,
            warning: `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>`,
            info: `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>`
        };

        this.init();
    }

    init() {
        window.addEventListener('message', (event) => this.handleMessage(event));

        // Notify ready
        setTimeout(() => {
            if (typeof hEvent === 'function') {
                hEvent('Ready', {});
            }
        }, 100);
    }

    handleMessage(event) {
        const eventData = event.data;
        const eventAction = eventData.name || eventData.action;
        const data = eventData.args && eventData.args[0];

        switch (eventAction) {
            case 'AddNotification':
                if (data) this.add(data.id, data.type, data.title, data.message, data.duration);
                break;
            case 'RemoveNotification':
                if (data && data.id) this.remove(data.id);
                break;
            case 'ClearAll':
                this.clearAll();
                break;
        }
    }

    showContainer() {
        if (this.containerVisible) return;
        this.container.classList.remove('hidden');
        this.containerVisible = true;
    }

    hideContainer() {
        if (!this.containerVisible) return;
        this.container.classList.add('hidden');
        this.containerVisible = false;
    }

    add(id, type, title, message, duration) {
        // Clone template
        const element = this.template.cloneNode(true);
        element.id = `notification-${id}`;
        element.classList.add(`notification-${type}`);
        element.style.display = 'flex';

        // Set content
        const iconContainer = element.querySelector('.notification-icon');
        iconContainer.innerHTML = this.icons[type] || this.icons.info;

        element.querySelector('.notification-title').textContent = title;
        element.querySelector('.notification-message').textContent = message;

        // Prepend to container
        this.container.insertBefore(element, this.container.firstChild);

        // Store notification data
        this.notifications[id] = {
            element: element,
            duration: duration,
            timer: null
        };

        // Close button event
        element.querySelector('.notification-close').addEventListener('click', () => {
            this.remove(id);
        });

        // Progress bar
        const progressBar = element.querySelector('.notification-progress');
        progressBar.style.animationDuration = `${duration}ms`;
        progressBar.classList.add('animate');

        // Show container if needed
        this.showContainer();

        // Animate in
        // Use requestAnimationFrame to ensure the class is added after the element is in the DOM
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                element.classList.add('show');
            });
        });

        // Auto remove
        if (duration > 0) {
            this.notifications[id].timer = setTimeout(() => {
                this.remove(id);
            }, duration);
        }
    }

    remove(id) {
        const notification = this.notifications[id];
        if (!notification) return;

        if (notification.timer) {
            clearTimeout(notification.timer);
        }

        notification.element.classList.remove('show');
        notification.element.classList.add('hide');

        // Wait for animation to finish
        setTimeout(() => {
            if (notification.element.parentNode) {
                notification.element.parentNode.removeChild(notification.element);
            }
            delete this.notifications[id];

            if (typeof hEvent === 'function') {
                hEvent('NotificationClosed', { id: id });
            }

            // Check if container should be hidden
            if (Object.keys(this.notifications).length === 0) {
                this.hideContainer();
                if (typeof hEvent === 'function') {
                    hEvent('AllNotificationsClosed', {});
                }
            }
        }, 300);
    }

    clearAll() {
        Object.keys(this.notifications).forEach(id => this.remove(id));
    }
}

// Initialize system
const notificationSystem = new NotificationSystem();
