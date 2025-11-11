const notifications = {};
let notificationZIndex = 1000;
let containerVisible = false;

const icons = {
    success: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
    error: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
    warning: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
    info: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`
};

function ShowContainer() {
    if (containerVisible) return;
    $('#notification-container').removeClass('hidden');
    containerVisible = true;
}

function HideContainer() {
    if (!containerVisible) return;
    $('#notification-container').addClass('hidden');
    containerVisible = false;
}

function addNotification(id, type, title, message, duration) {

    const template = $('#notification-template').clone();
    template.attr('id', `notification-${id}`);
    template.addClass(`notification-${type}`);
    template.show();

    template.find('.notification-icon').html(icons[type] || icons.info);
    template.find('.notification-title').text(title);
    template.find('.notification-message').text(message);

    $('#notification-container').prepend(template);

    notifications[id] = {
        element: template,
        duration: duration,
        timer: null
    };

    template.find('.notification-close').on('click', function() {
        removeNotification(id);
    });

    const progressBar = template.find('.notification-progress');
    progressBar.css({
        'animation-duration': `${duration}ms`
    });
    progressBar.addClass('animate');

    ShowContainer();

    setTimeout(() => {
        template.addClass('show');
        updatePositions();
    }, 10);
}

function removeNotification(id) {
    const notification = notifications[id];
    if (!notification) return;

    if (notification.timer) {
        clearTimeout(notification.timer);
    }

    notification.element.removeClass('show');
    notification.element.addClass('hide');

    setTimeout(() => {
        notification.element.remove();
        delete notifications[id];

        if (typeof hEvent === 'function') {
            hEvent('NotificationClosed', { id: id });
        }
        updatePositions();
    }, 300);
}

function updatePositions() {
    let topOffset = 20;
    const spacing = 10;

    const visibleNotifs = $('#notification-container').children('.notification.show');

    visibleNotifs.each(function() {
        $(this).css('top', `${topOffset}px`);
        topOffset += $(this).outerHeight() + spacing;
    });

    if (visibleNotifs.length === 0) {
        HideContainer();
        if (typeof hEvent === 'function') {
            hEvent('AllNotificationsClosed', {});
        }
    }
}

function clearAll() {
    for (const id in notifications) {
        removeNotification(id);
    }
}

window.addEventListener('message', (event) => {
    const eventData = event.data;
    const eventAction = eventData.name || eventData.action;

    if (eventAction === 'AddNotification') {
        const data = eventData.args && eventData.args[0];
        if (data) {
            addNotification(data.id, data.type, data.title, data.message, data.duration);
        }
    } else if (eventAction === 'RemoveNotification') {
        const data = eventData.args && eventData.args[0];
        if (data && data.id) {
            removeNotification(data.id);
        }
    } else if (eventAction === 'ClearAll') {
        clearAll();
    }
});

setTimeout(function() {
    if (typeof hEvent === 'function') {
        hEvent('Ready', {});
    }
}, 100);
